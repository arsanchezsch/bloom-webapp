// server.js
// Bloom backend proxy to call Haut.AI safely from the webapp.

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const OpenAI = require("openai");

// Load env vars from .env.local (same ones used by Vite)
dotenv.config({ path: ".env.local" });

console.log(
  "[DEBUG] OPENAI_API_KEY está cargada?",
  !!process.env.OPENAI_API_KEY
);
console.log(
  "[DEBUG] Primeros caracteres de la clave:",
  process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.slice(0, 8)
);

const app = express();
const PORT = process.env.PORT || 8787;

const HAUT_BASE_V1 = "https://saas.haut.ai/api/v1";
const HAUT_BASE_V3 = "https://saas.haut.ai/api/v3";

const API_KEY = process.env.VITE_HAUT_API_KEY;
const COMPANY_ID = process.env.VITE_HAUT_COMPANY_ID;
const DATASET_ID = process.env.VITE_HAUT_DATASET_ID;

// OpenAI client (Bloom recommendations / chat)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

if (!API_KEY || !COMPANY_ID || !DATASET_ID) {
  console.warn(
    "[Bloom Haut] Missing env vars. Check VITE_HAUT_API_KEY, VITE_HAUT_COMPANY_ID and VITE_HAUT_DATASET_ID in .env.local"
  );
}

app.use(cors());
app.use(
  express.json({
    limit: "15mb", // enough for base64 selfies
  })
);

// Helper to call Haut APIs with proper headers
async function hautRequest(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const err = new Error(`Haut API error ${res.status}`);
    err.status = res.status;
    err.details = data;
    throw err;
  }

  return data;
}

// 1) Create subject in our dataset
async function createSubject(subjectName) {
  const url = `${HAUT_BASE_V1}/companies/${COMPANY_ID}/datasets/${DATASET_ID}/subjects/`;

  const body = {
    // 👇 ESTE CAMPO ES OBLIGATORIO SEGÚN EL ERROR
    name:
      subjectName && subjectName.trim().length > 0
        ? subjectName
        : "Bloom Web User",
    age: null,
    phenotype: null,
    biological_sex: null,
    meta: {
      source: "bloom-webapp",
    },
  };

  const subject = await hautRequest(url, {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!subject || !subject.id) {
    throw new Error("Could not create subject in dataset");
  }

  return subject.id;
}

// 2) Request upload URL (Face Skin Analysis 3.0 - v3 API)
async function initiateUpload(subjectId) {
  const url = `${HAUT_BASE_V3}/companies/${COMPANY_ID}/subjects/${subjectId}/upload/`;

  const body = {
    front: "bloom_front_selfie.jpg",
    meta: {
      source: "bloom-webapp",
    },
  };

  const resp = await hautRequest(url, {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!resp || !resp.front || !resp.image_batch_id) {
    throw new Error("Unexpected response from Haut when initiating upload");
  }

  return {
    batchId: resp.image_batch_id,
    uploadUrl: resp.front.url,
    uploadMethod: resp.front.method || "PUT",
    uploadHeaders: resp.front.headers || {},
  };
}

// 3) Upload image bytes to signed URL (storage)
async function uploadImageToStorage(
  uploadUrl,
  uploadMethod,
  uploadHeaders,
  base64Image
) {
  const base64Data = base64Image.replace(
    /^data:image\/[a-zA-Z+]+;base64,/,
    ""
  );
  const buffer = Buffer.from(base64Data, "base64");

  const res = await fetch(uploadUrl, {
    method: uploadMethod,
    headers: uploadHeaders,
    body: buffer,
  });

  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`Failed to upload image to storage (${res.status})`);
    err.details = text;
    throw err;
  }
}

// 4) Ask Haut to compute algorithms for this batch
async function computeBatch(batchId) {
  const url = `${HAUT_BASE_V3}/companies/${COMPANY_ID}/batches/${batchId}/compute/`;

  // En tu tenant, app_args NO puede ser null.
  // Mandamos un objeto vacío por defecto.
  const body = {
    app_args: {}, // <- clave del arreglo del error
  };

  await hautRequest(url, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// 5) Poll until results are ready (wait until all_algorithms_calculated = true)
async function waitForResults(batchId, options = {}) {
  // Damos un poco más de margen: hasta ~90s máximo
  const maxAttempts = options.maxAttempts ?? 45;
  const delayMs = options.delayMs ?? 2000;

  const url = `${HAUT_BASE_V3}/companies/${COMPANY_ID}/batches/${batchId}/results/`;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const data = await hautRequest(url, { method: "GET" });

    const metrics = data && data.face_skin_metrics_3;

    if (metrics) {
      // Si ya se han calculado TODOS los algoritmos, devolvemos el resultado
      if (metrics.all_algorithms_calculated === true) {
        return data;
      }

      // Si existe el objeto pero aún está en cálculo, lo registramos en logs
      console.log(
        `[Bloom Haut] Batch ${batchId} still processing (attempt ${attempt}/${maxAttempts})`
      );
    }

    // Esperamos un poco antes del siguiente intento
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  const err = new Error(
    "No completed results were received from Haut.AI within timeout"
  );
  err.status = 504;
  throw err;
}

// ============================================
// MAIN HAUT ENDPOINT CALLED FROM THE FRONTEND
// ============================================
app.post("/api/haut-inference", async (req, res) => {
  try {
    const { base64Image, subjectName } = req.body || {};

    if (!base64Image || typeof base64Image !== "string") {
      return res
        .status(400)
        .json({ error: "base64Image is required and must be a string" });
    }

    console.log(
      "[Bloom Haut] New inference request",
      subjectName ? `for ${subjectName}` : ""
    );

    // 1) Subject in dataset (ahora sí pasamos subjectName)
    const subjectId = await createSubject(subjectName);

    // 2) Upload URL + batch
    const { batchId, uploadUrl, uploadMethod, uploadHeaders } =
      await initiateUpload(subjectId);

    // 3) Upload selfie to storage
    await uploadImageToStorage(
      uploadUrl,
      uploadMethod,
      uploadHeaders,
      base64Image
    );

    // 4) Trigger computation
    await computeBatch(batchId);

    // 5) Wait for results
    const rawResults = await waitForResults(batchId);

    const ids = {
      companyId: COMPANY_ID,
      datasetId: DATASET_ID,
      subjectId,
      batchId,
      imageId: batchId, // v3 does not expose explicit imageId
    };

    return res.json({ ids, rawResults });
  } catch (error) {
    console.error("[Bloom Haut] Error in /api/haut-inference:", {
      message: error.message,
      status: error.status,
      details: error.details,
    });

    const status = Number.isInteger(error.status) ? error.status : 500;

    return res.status(status).json({
      error: error.message || "Unexpected error",
      details: error.details || null,
    });
  }
});

// ============================================
// OPENAI: SIMPLE RECOMMENDATIONS ENDPOINT
// ============================================
app.post("/api/openai-recommendations", async (req, res) => {
  try {
    const { userProfile, hautMetrics } = req.body || {};

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      instructions:
        "Eres Bloom, una asistente experta en cuidado de la piel. Hablas en español neutro, tono calmado, claro y minimalista.",
      input: `
        Este es el perfil del usuario (puede estar vacío):
        ${JSON.stringify(userProfile || {}, null, 2)}

        Estas son sus métricas de piel (pueden estar vacías):
        ${JSON.stringify(hautMetrics || {}, null, 2)}

        Genera un mensaje muy corto (máximo 2 frases) dando la bienvenida a Bloom
        y explicando que pronto verá recomendaciones basadas en su piel.
      `,
    });

    // Intentamos obtener el texto de forma robusta
    let message =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text ||
      "Bienvenida a Bloom ✨";

    return res.status(200).json({
      ok: true,
      message,
    });
  } catch (error) {
    console.error("[Bloom OpenAI] Error in /api/openai-recommendations:", {
      message: error.message,
      status: error.status,
      details: error.details,
    });

    return res.status(500).json({
      ok: false,
      error: "Error generando recomendaciones con OpenAI",
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `Bloom backend running on http://localhost:${PORT} (POST /api/haut-inference, /api/openai-recommendations)`
  );
});
