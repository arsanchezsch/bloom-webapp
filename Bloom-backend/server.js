// server.js
// Bloom backend proxy to call Haut.AI safely from the webapp.

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const OpenAI = require("openai");

// Load env vars from .env.local (same ones used by Vite)
dotenv.config({ path: ".env.local" });

console.log(
  "[DEBUG] ENV LOADED → ",
  Object.keys(process.env).filter(
    (k) => k.includes("OPENAI") || k.includes("LIQA")
  )
);
console.log("[DEBUG] OPENAI KEY RAW →", process.env.OPENAI_API_KEY);
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

const API_KEY = process.env.HAUT_API_KEY;
const COMPANY_ID = process.env.HAUT_COMPANY_ID;
const DATASET_ID = process.env.HAUT_DATASET_ID;

// OpenAI client (Bloom recommendations / chat)
// 👉 Solo apiKey, SIN "project", porque estás usando un secret key normal (sk-...)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY?.trim(),
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
  const schemaExample = {
    summary:
      "We detected some imbalances in your skin barrier and will focus on gentle cleansing, hydration and protection.",
    mainConcerns: ["acne", "pores", "lines_wrinkles"],
    sections: [
      {
        id: "morning",
        title: "Morning Routine",
        steps: [
          {
            id: "cleanser",
            title: "Gentle Cleanser",
            subtitle: "Cleanses without stripping the skin barrier.",
            concerns: ["acne", "pores"],
            usageNotes: "Use every morning on damp skin.",
          },
          {
            id: "moisturizer",
            title: "Light Moisturizer",
            subtitle: "Keeps skin hydrated and comfortable.",
            concerns: ["lines_wrinkles"],
            usageNotes: "Apply after cleanser while skin is slightly damp.",
          },
          {
            id: "sunscreen",
            title: "Broad-Spectrum SPF",
            subtitle: "Protects against daily UV damage.",
            concerns: ["pigmentation", "lines_wrinkles"],
            usageNotes: "Use every morning as the last step of your routine.",
          },
        ],
      },
      {
        id: "evening",
        title: "Evening Routine",
        steps: [
          {
            id: "double_cleanse",
            title: "Thorough Cleanse",
            subtitle: "Removes sunscreen, sweat and excess oil.",
            concerns: ["acne", "pores"],
          },
          {
            id: "treatment",
            title: "Targeted Treatment",
            subtitle: "Use a gentle serum adapted to your main concerns.",
            concerns: ["acne", "pores", "lines_wrinkles"],
          },
          {
            id: "night_cream",
            title: "Repairing Moisturizer",
            subtitle: "Supports overnight skin recovery.",
            concerns: ["lines_wrinkles"],
          },
        ],
      },
      {
        id: "weekly",
        title: "Weekly Treatments",
        steps: [
          {
            id: "exfoliation",
            title: "Gentle Exfoliation",
            subtitle: "Smooths texture and unclogs pores.",
            concerns: ["pores", "acne"],
            usageNotes: "Use 1–2 times per week, never on irritated skin.",
          },
        ],
      },
    ],
    disclaimer:
      "This routine is cosmetic advice only and does not replace a visit to a dermatologist.",
  };

  try {
    const { skinMetrics, overallHealth } = req.body || {};

    if (!Array.isArray(skinMetrics) || skinMetrics.length === 0) {
      console.warn(
        "[Bloom OpenAI] /api/recommendations called without skinMetrics. Returning fallback schema."
      );
      return res.status(200).json(schemaExample);
    }

    console.log("[Bloom OpenAI] /api/recommendations called");
    console.log(
      "[Bloom OpenAI] skinMetrics length:",
      skinMetrics.length,
      "overallHealth:",
      overallHealth
    );

    const inputText = `
You are Bloom, an expert skincare assistant for a digital skin-analysis product.

User data:
- Dynamic overall health object (may be partial):
${JSON.stringify(overallHealth || {}, null, 2)}

- Raw Haut metrics from the last scan (array with techName, value, tag):
${JSON.stringify(skinMetrics, null, 2)}

TASK:
Create a personalized skincare routine.
...
    `.trim();

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: inputText,
      max_output_tokens: 2000,
    });

    const rawText =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text ||
      "";

    console.log("[Bloom OpenAI] Raw text from model:", rawText);

    let jsonPayload;

    try {
      jsonPayload = JSON.parse(rawText);
    } catch (e) {
      console.error("[Bloom OpenAI] Could not parse JSON (first try):", e);
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
      details: error.details,
    });

    return res.status(200).json(schemaExample);
  }
});

// ============================================
// OPENAI: BLOOM AI CHAT
// ============================================
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, skinContext } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res
        .status(400)
        .json({ ok: false, error: "messages array is required" });
    }

    const historyText = messages
      .map((m) => {
        const speaker = m.role === "assistant" ? "Bloom" : "User";
        return `${speaker}: ${m.content}`;
      })
      .join("\n");

    const contextText = JSON.stringify(skinContext || {}, null, 2);

    const inputText = `
You are Bloom, an expert AI skincare assistant. 
Always answer in **English**, with a calm, minimal, and clear tone.

### FORMATTING RULES
- Write **2 to 4 short paragraphs**.
- Each paragraph must be **1–3 concise sentences**.
- Always insert a **blank line between paragraphs**.
- Avoid long blocks of text. Keep responses readable and elegant.

### DATA RULES
- ALWAYS use the latest skinContext values provided below.
- If the user asks about a metric (skin age, acne score, redness, pores, etc.), answer based on the actual scan values.
- Do NOT invent numbers. Use ONLY metrics that exist.
- If something is missing, give a safe general explanation.
- Do NOT mention Haut.AI, algorithms, scoring systems or internal terms.

### SKIN CONTEXT (latest scan):
${contextText}

### CHAT HISTORY:
${historyText}

### TASK
Respond to the user's LAST message using the real scan data.
Keep the tone warm, supportive and professional.
`.trim();


    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: inputText,
      max_output_tokens: 600,
    });

    const reply =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text ||
      "Ahora mismo tengo un problema para procesar tus datos de piel, pero puedo darte consejos cosméticos generales.";

    return res.status(200).json({ ok: true, reply });
  } catch (error) {
    console.error("[Bloom OpenAI] Error in /api/chat:", {
      message: error.message,
      status: error.status,
      details: error.details,
    });

    // ⚠️ IMPORTANTE: nunca devolvemos 500 al frontend; damos fallback
    const fallbackReply =
      "Ahora mismo tengo un problema para acceder a todos tus datos de piel, pero puedo darte un consejo general: prioriza una limpieza suave, hidratación constante y protector solar diario. Si notas irritación, simplifica la rutina.";

    return res.status(200).json({
      ok: true,
      reply: fallbackReply,
      error:
        "OpenAI error interno, se devolvió una respuesta genérica en su lugar.",
    });
  }
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(
    `Bloom backend running on http://localhost:${PORT} (POST /api/haut-inference, /api/openai-recommendations, /api/recommendations, /api/chat)`
  );
});
