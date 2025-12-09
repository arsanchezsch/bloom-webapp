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
  project: process.env.OPENAI_PROJECT_ID,
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

  const body = {
    app_args: {},
  };

  await hautRequest(url, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// 5) Poll until results are ready
async function waitForResults(batchId, options = {}) {
  const maxAttempts = options.maxAttempts ?? 45;
  const delayMs = options.delayMs ?? 2000;

  const url = `${HAUT_BASE_V3}/companies/${COMPANY_ID}/batches/${batchId}/results/`;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const data = await hautRequest(url, { method: "GET" });

    const metrics = data && data.face_skin_metrics_3;

    if (metrics) {
      if (metrics.all_algorithms_calculated === true) {
        return data;
      }

      console.log(
        `[Bloom Haut] Batch ${batchId} still processing (attempt ${attempt}/${maxAttempts})`
      );
    }

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

    const subjectId = await createSubject(subjectName);
    const { batchId, uploadUrl, uploadMethod, uploadHeaders } =
      await initiateUpload(subjectId);

    await uploadImageToStorage(
      uploadUrl,
      uploadMethod,
      uploadHeaders,
      base64Image
    );

    await computeBatch(batchId);

    const rawResults = await waitForResults(batchId);

    const ids = {
      companyId: COMPANY_ID,
      datasetId: DATASET_ID,
      subjectId,
      batchId,
      imageId: batchId,
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

// ============================================
// OPENAI: BLOOM SKINCARE ROUTINE (JSON SIMPLE)
// ============================================
app.post("/api/recommendations", async (req, res) => {
  try {
    const { skinMetrics, overallHealth } = req.body || {};

    if (!Array.isArray(skinMetrics) || skinMetrics.length === 0) {
      return res
        .status(400)
        .json({ error: "skinMetrics array is required for recommendations" });
    }

    console.log("[Bloom OpenAI] /api/recommendations called");
    console.log(
      "[Bloom OpenAI] skinMetrics length:",
      skinMetrics.length,
      "overallHealth:",
      overallHealth
    );

    // 👉 Estructura que queremos que devuelva el modelo
    const schemaExample = {
      summary:
        "Short overview of the skin situation and what the routine will focus on.",
      mainConcerns: ["acne", "pores", "lines_wrinkles"],
      sections: [
        {
          id: "morning",
          title: "Morning Routine",
          steps: [
            {
              id: "cleanser",
              title: "Gentle Cleanser",
              subtitle: "Maintain barrier function",
              concerns: ["acne", "pores"],
              usageNotes: "Use every morning on damp skin."
            }
          ]
        },
        {
          id: "evening",
          title: "Evening Routine",
          steps: []
        },
        {
          id: "weekly",
          title: "Weekly Treatments",
          steps: []
        }
      ],
      disclaimer:
        "This routine is cosmetic advice only and does not replace a visit to a dermatologist."
    };

    const inputText = `
    You are Bloom, an expert skincare assistant for a digital skin-analysis product.
    
    User data:
    - Dynamic overall health object (may be partial):
    ${JSON.stringify(overallHealth || {}, null, 2)}
    
    - Raw Haut metrics from the last scan (array with techName, value, tag):
    ${JSON.stringify(skinMetrics, null, 2)}
    
    TASK:
    Create a personalized skincare routine.
    
    ANALYSIS RULES:
    - First, carefully analyze the metrics to identify the 2–4 WORST concerns.
    - "Worst" means lower numeric scores and/or tags like "Bad" or their equivalents.
    - Give special priority to classic concerns: acne, pores, redness, pigmentation, lines_wrinkles, sagging, dark_circles when they appear among the worst metrics.
    - The 2–4 worst concerns you identify will be your "mainConcerns".
    
    OUTPUT RULES:
    - Answer ONLY with valid JSON.
    - Do NOT include backticks, markdown, or explanations.
    - The JSON MUST follow exactly this structure (same keys, but with your own values):
    
    ${JSON.stringify(schemaExample, null, 2)}
    
    DETAILS:
    - summary:
      - 1–3 short sentences explaining the overall situation and what the routine will focus on.
      - The FIRST sentence MUST explicitly mention the mainConcerns in natural language (e.g. "acne and sagging", "redness, pores and lines").
      - If any acne-related metric is among the worst, you MUST mention acne in the summary.
    - mainConcerns:
      - Array of 2–4 concern IDs in snake_case (e.g. "lines_wrinkles", "pores", "acne").
      - These MUST correspond to the 2–4 worst concerns you identified above.
    - sections:
      - Always 3 items with ids "morning", "evening" and "weekly".
      - Each section has 3–5 steps for morning, 3–5 for evening, 2–4 for weekly.
      - step.title <= 30 characters.
      - step.subtitle <= 80 characters.
      - concerns: array of concern IDs this step helps with (reuse the same concern ids as in mainConcerns where relevant, but you can also include others if it makes sense).
    - disclaimer:
      - Brief safety note reminding the user this is not medical advice.
    
    If data is incomplete, make safe, generic assumptions.
    Keep the JSON as compact as possible (short subtitles and usageNotes).
    `;    

const response = await openai.responses.create({
  model: "gpt-4.1-mini",
  input: inputText,
  // Más margen para que no corte el JSON a la mitad
  max_output_tokens: 2000,
});

    // 🔎 Intentamos sacar el texto de la forma más robusta posible
    const rawText =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text ||
      "";

      console.log("[Bloom OpenAI] Raw text from model:", rawText);

      let jsonPayload;
  
      try {
        // Intento normal
        jsonPayload = JSON.parse(rawText);
      } catch (e) {
        console.error("[Bloom OpenAI] Could not parse JSON (first try):", e);
  
        // 👇 Intento 2: recortar hasta el último "}" por si el modelo cortó el final
        const lastBrace = rawText.lastIndexOf("}");
        if (lastBrace !== -1) {
          const trimmed = rawText.slice(0, lastBrace + 1);
          try {
            jsonPayload = JSON.parse(trimmed);
            console.log(
              "[Bloom OpenAI] JSON parsed OK after trimming trailing content"
            );
          } catch (inner) {
            console.error(
              "[Bloom OpenAI] Could not parse JSON even after trimming:",
              inner
            );
          }
        }
  
        // 👇 Si sigue sin poder parsear, caemos a una rutina genérica
        if (!jsonPayload) {
          console.warn(
            "[Bloom OpenAI] Falling back to generic routine schemaExample"
          );
          jsonPayload = schemaExample;
        }
      }
  
      console.log("[Bloom OpenAI] JSON payload generated OK");  

    return res.status(200).json(jsonPayload);
  } catch (error) {
    console.error("[Bloom OpenAI] Error in /api/recommendations:", {
      message: error.message,
      status: error.status,
      details: error.details
    });

    return res.status(500).json({
      error: "Error generating routine with OpenAI"
    });
  }
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(
    `Bloom backend running on http://localhost:${PORT} (POST /api/haut-inference, /api/openai-recommendations, /api/recommendations)`
  );
});
