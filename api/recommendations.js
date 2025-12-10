// api/recommendations.js
// Vercel serverless function for Bloom skincare routine (OpenAI)

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  project: process.env.OPENAI_PROJECT_ID,
});

// Handler Vercel (ESM)
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { skinMetrics, overallHealth } = req.body || {};

    if (!Array.isArray(skinMetrics) || skinMetrics.length === 0) {
      return res
        .status(400)
        .json({ error: "skinMetrics array is required for recommendations" });
    }

    console.log("[Bloom OpenAI] /api/recommendations (serverless) called");
    console.log(
      "[Bloom OpenAI] skinMetrics length:",
      skinMetrics.length,
      "overallHealth:",
      overallHealth
    );

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
              usageNotes: "Use every morning on damp skin.",
            },
          ],
        },
        {
          id: "evening",
          title: "Evening Routine",
          steps: [],
        },
        {
          id: "weekly",
          title: "Weekly Treatments",
          steps: [],
        },
      ],
      disclaimer:
        "This routine is cosmetic advice only and does not replace a visit to a dermatologist.",
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
      max_output_tokens: 2000,
    });

    const rawText =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text ||
      "";

    console.log("[Bloom OpenAI] Raw text from model (serverless):", rawText);

    let jsonPayload;

    try {
      jsonPayload = JSON.parse(rawText);
    } catch (e) {
      console.error(
        "[Bloom OpenAI] Could not parse JSON (first try, serverless):",
        e
      );

      const lastBrace = rawText.lastIndexOf("}");
      if (lastBrace !== -1) {
        const trimmed = rawText.slice(0, lastBrace + 1);
        try {
          jsonPayload = JSON.parse(trimmed);
          console.log(
            "[Bloom OpenAI] JSON parsed OK after trimming trailing content (serverless)"
          );
        } catch (inner) {
          console.error(
            "[Bloom OpenAI] Could not parse JSON even after trimming (serverless):",
            inner
          );
        }
      }

      if (!jsonPayload) {
        console.warn(
          "[Bloom OpenAI] Falling back to generic routine schemaExample (serverless)"
        );
        jsonPayload = schemaExample;
      }
    }

    console.log("[Bloom OpenAI] JSON payload generated OK (serverless)");

    return res.status(200).json(jsonPayload);
  } catch (error) {
    console.error("[Bloom OpenAI] Error in /api/recommendations (serverless):", {
      message: error.message,
      status: error.status,
      details: error.details,
    });

    return res
      .status(500)
      .json({ error: "Error generating routine with OpenAI (serverless)" });
  }
}
