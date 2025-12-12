// src/hooks/useHautInference.ts
// Frontend hook: calls backend (BLOOM_SERVER_URL + /api/haut-inference)
// and maps Haut raw results into Bloom metrics.

import { useEffect, useState } from "react";
import {
  mapRawResultsToMetrics,
  type HautScanResult,
  type HautScanIdentifiers,
  mapFaceSkin3LinesToBloom,
  mapFaceSkin3PoresToBloom,
  mapFaceSkin3PigmentationToBloom, // 👈 NUEVO IMPORT
} from "../lib/haut";

// 👇 URL del backend (Render en prod, localhost en dev)
const BLOOM_SERVER_URL =
  import.meta.env.VITE_BLOOM_SERVER_URL || "http://localhost:8787";

export type InferenceStatus =
  | "idle"
  | "uploading"
  | "processing"
  | "completed"
  | "failed";

interface UseHautInferenceOptions {
  subjectName?: string;
}

interface UseHautInferenceState {
  status: InferenceStatus;
  result: HautScanResult | null;
  error: string | null;
  isLoading: boolean;
}

// === Helper: comprimir imagen base64 para evitar 413 en Vercel/Render ===
async function compressBase64Image(
  dataUrl: string,
  maxWidth = 1200,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Canvas context error"));
        return;
      }

      const scale = Math.min(1, maxWidth / img.width);
      const w = img.width * scale;
      const h = img.height * scale;

      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);

      const compressed = canvas.toDataURL("image/jpeg", quality);
      resolve(compressed);
    };

    img.onerror = reject;
    img.src = dataUrl;
  });
}

// Llama a nuestro backend serverless (/api/haut-inference)
async function callBackendInference(
  imageData: string,
  subjectName: string
): Promise<{ ids: HautScanIdentifiers; rawResults: any[] }> {
  console.log("[Bloom Front] Original image size:", imageData.length);

  // 🔥 Comprimir imagen antes de enviarla al backend
  const compressedImage = await compressBase64Image(imageData, 1200, 0.85);

  console.log(
    "[Bloom Front] Compressed image size:",
    compressedImage.length
  );

  // 👇 AQUÍ estaba el error de sintaxis (faltaba la ` y el paréntesis)
  const response = await fetch(`${BLOOM_SERVER_URL}/api/haut-inference`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      base64Image: compressedImage,
      subjectName,
    }),
  });

  const text = await response.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }

  if (!response.ok) {
    throw new Error(
      `[Backend] Error ${response.status} calling /api/haut-inference: ${text}`
    );
  }

  // Aquí ya sabemos que Haut respondió bien via backend
  if (!json || json.rawResults == null) {
    throw new Error("Backend returned an empty response from Haut.AI.");
  }

  // El backend devuelve un OBJETO con Face Skin Analysis 3.0.
  // Lo convertimos siempre a array para el resto de la app.
  const rawResultsAny = json.rawResults;
  const rawResults: any[] = Array.isArray(rawResultsAny)
    ? rawResultsAny
    : [rawResultsAny];

  const ids: HautScanIdentifiers =
    json.ids && json.ids.companyId
      ? json.ids
      : {
          companyId: import.meta.env.VITE_HAUT_COMPANY_ID as string,
          datasetId: import.meta.env.VITE_HAUT_DATASET_ID as string,
          subjectId: "unknown",
          batchId: "unknown",
          imageId: "unknown",
        };

  return {
    ids,
    rawResults,
  };
}

/**
 * Hook principal que lanza la inferencia en Haut.AI
 * a partir de una imagen en base64 usando el backend.
 */
export function useHautInference(
  imageData: string | null,
  options: UseHautInferenceOptions = {}
): UseHautInferenceState {
  const [status, setStatus] = useState<InferenceStatus>("idle");
  const [result, setResult] = useState<HautScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { subjectName = "Bloom Web User" } = options;

  useEffect(() => {
    if (!imageData) {
      setStatus("idle");
      setResult(null);
      setError(null);
      return;
    }

    let cancelled = false;

    async function run() {
      try {
        setStatus("uploading");
        setError(null);
        setResult(null);

        // 1) Llamamos a nuestro backend
        const { ids, rawResults } = await callBackendInference(
          imageData,
          subjectName
        );

        if (cancelled) return;

        setStatus("processing");

        if (!rawResults.length) {
          throw new Error(
            "No completed results were received from Haut.AI. Please try scanning again."
          );
        }

        // 2) Mapeamos resultados de Haut a métricas de Bloom
        let metrics: any[] = [];
        try {
          // Mapeo genérico
          metrics = await mapRawResultsToMetrics(rawResults);

          // 3) Extra: conectar Face Skin Metrics 3.0 -> Bloom
          const faceSkinBlock = rawResults[0]; // nuestro backend devuelve 1 bloque

          // ---- Lines & Wrinkles ----
          const linesMetric = mapFaceSkin3LinesToBloom(faceSkinBlock);

          if (linesMetric) {
            metrics.push({
              id: linesMetric.id, // "lines_wrinkles"
              label: "Lines & Wrinkles",
              value: linesMetric.score,
              techName: "lines",
              familyName: "Lines",
              raw: linesMetric,
            });
          }

          // ---- Pores ----
          const poresMetric = mapFaceSkin3PoresToBloom(faceSkinBlock);

          if (poresMetric) {
            metrics.push({
              id: "pores",
              label: "Pores",
              value: poresMetric.score,
              techName: "pores",
              familyName: "Pores",
              raw: poresMetric,
            });
          }

          // ---- Pigmentation (NUEVO) ----
          const pigmentationMetric =
            mapFaceSkin3PigmentationToBloom(faceSkinBlock);

          if (pigmentationMetric) {
            metrics.push({
              id: "pigmentation",
              label: "Pigmentation",
              value: pigmentationMetric.score,
              techName: "pigmentation",
              familyName: "Pigmentation",
              raw: pigmentationMetric,
            });
          }
        } catch (e) {
          console.warn(
            "[useHautInference] Could not map raw results to metrics. Raw results will still be available in debug UI.",
            e
          );
          metrics = [];
        }

        const resultObj: HautScanResult = {
          ids,
          metrics,
          rawResults,
        };

        if (cancelled) return;

        setResult(resultObj);
        setStatus("completed");
      } catch (err) {
        if (cancelled) return;

        const msg =
          err instanceof Error
            ? err.message
            : "Unexpected error while calling Haut.AI";

        console.error("[useHautInference] error:", err);
        setError(msg);
        setStatus("failed");
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [imageData, subjectName]);

  return {
    status,
    result,
    error,
    isLoading: status === "uploading" || status === "processing",
  };
}
