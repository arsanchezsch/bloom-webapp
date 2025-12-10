import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { base64Image, subjectName } = req.body || {};

    if (!base64Image) {
      return res.status(400).json({ error: "base64Image missing" });
    }

    console.log("[Bloom API] Starting Haut 3.0 inference…");

    const HAUT_BASE_V1 = "https://saas.haut.ai/api/v1";
    const HAUT_BASE_V3 = "https://saas.haut.ai/api/v3";

    const API_KEY = process.env.VITE_HAUT_API_KEY;
    const COMPANY_ID = process.env.VITE_HAUT_COMPANY_ID;
    const DATASET_ID = process.env.VITE_HAUT_DATASET_ID;

    if (!API_KEY || !COMPANY_ID || !DATASET_ID) {
      return res.status(500).json({ error: "Missing HAUT env vars" });
    }

    // Helper
    async function hautRequest(url, options = {}) {
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          Accept: "application/json",
          ...(options.body ? { "Content-Type": "application/json" } : {})
        }
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      if (!response.ok) {
        const err = new Error("Haut error");
        err.status = response.status;
        err.details = data;
        throw err;
      }

      return data;
    }

    // 1) Create subject
    const subject = await hautRequest(
      `${HAUT_BASE_V1}/companies/${COMPANY_ID}/datasets/${DATASET_ID}/subjects/`,
      {
        method: "POST",
        body: JSON.stringify({
          name: subjectName || "Bloom Web User",
          meta: { source: "bloom-webapp" }
        })
      }
    );

    const subjectId = subject.id;

    // 2) Upload request
    const uploadInit = await hautRequest(
      `${HAUT_BASE_V3}/companies/${COMPANY_ID}/subjects/${subjectId}/upload/`,
      {
        method: "POST",
        body: JSON.stringify({
          front: "front.jpg",
          meta: { source: "bloom-webapp" }
        })
      }
    );

    const { url, method, headers } = uploadInit.front;

    // 3) Upload image
    const buffer = Buffer.from(
      base64Image.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );

    const uploadRes = await fetch(url, {
      method,
      headers,
      body: buffer
    });

    if (!uploadRes.ok) {
      throw new Error("Failed image upload");
    }

    // 4) Compute algorithms
    const batchId = uploadInit.image_batch_id;

    await hautRequest(
      `${HAUT_BASE_V3}/companies/${COMPANY_ID}/batches/${batchId}/compute/`,
      { method: "POST", body: JSON.stringify({}) }
    );

    // 5) Poll results
    for (let i = 0; i < 45; i++) {
      const result = await hautRequest(
        `${HAUT_BASE_V3}/companies/${COMPANY_ID}/batches/${batchId}/results/`,
        { method: "GET" }
      );

      if (result.face_skin_metrics_3?.all_algorithms_calculated) {
        console.log("[Bloom API] Haut results ready");
        return res.status(200).json({
          ids: { subjectId, batchId },
          rawResults: result
        });
      }

      await new Promise((r) => setTimeout(r, 2000));
    }

    return res.status(504).json({ error: "Timeout waiting for Haut results" });
  } catch (err) {
    console.error("[Bloom API] Haut inference error:", err);
    return res.status(err.status || 500).json({
      error: err.message,
      details: err.details || null
    });
  }
}
