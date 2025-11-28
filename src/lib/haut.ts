// src/lib/haut.ts
// Cliente ligero para la API SaaS de Haut.AI

import type { OverallHealth } from "../types";

const HAUT_SAAS_HOST = "https://saas.haut.ai";
const API_BASE = `${HAUT_SAAS_HOST}/api/v1`;

const API_KEY = import.meta.env.VITE_HAUT_API_KEY as string | undefined;
const COMPANY_ID = import.meta.env.VITE_HAUT_COMPANY_ID as string | undefined;
const DATASET_ID = import.meta.env.VITE_HAUT_DATASET_ID as string | undefined;

function ensureEnv() {
  if (!API_KEY || !COMPANY_ID || !DATASET_ID) {
    throw new Error(
      "[Haut] Faltan variables de entorno: VITE_HAUT_API_KEY, VITE_HAUT_COMPANY_ID o VITE_HAUT_DATASET_ID"
    );
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  ensureEnv();

  const url = `${API_BASE}${path}`;

  const headers: HeadersInit = {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let body: string;
    try {
      body = await response.text();
    } catch {
      body = "<no body>";
    }
    throw new Error(
      `[Haut] Error ${response.status} en ${path}: ${body || response.statusText}`
    );
  }

  // Algunos endpoints devuelven 204 sin body
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return (await response.json()) as T;
}

// Tipos principales
export interface HautAlgorithmVersion {
  id: number;
  algorithm_family?: { name?: string };
  version?: string;
  algorithm_tech_name?: string;
  tech_name?: string;
}

export interface HautMetric {
  id: string;
  label: string;
  value: number;
  techName?: string;
  familyName?: string;

  // NUEVO: etiqueta “Great / Average / …” de Haut
  tag?: string;

  // NUEVO: URL de la imagen con las máscaras (líneas, rojeces, etc.)
  maskUrl?: string;

  raw: unknown;
}

export interface HautScanIdentifiers {
  companyId: string;
  datasetId: string;
  subjectId: string;
  batchId: string;
  imageId: string;
}

export interface HautScanResult {
  ids: HautScanIdentifiers;
  metrics: HautMetric[];
  rawResults: any[];
}

let algorithmsCache: HautAlgorithmVersion[] | null = null;

// GET /api/v1/dicts/algorithms/
export async function fetchAlgorithmsDict(): Promise<HautAlgorithmVersion[]> {
  if (algorithmsCache) return algorithmsCache;

  const data = await request<any>("/dicts/algorithms/");

  const list: HautAlgorithmVersion[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.results)
    ? data.results
    : [];

  algorithmsCache = list;
  return list;
}

// 1) Crear subject en dataset
export async function createSubject(name = "Bloom Web User"): Promise<string> {
  ensureEnv();

  const body = JSON.stringify({ name });

  const resp = await request<{ id: string }>(
    `/companies/${COMPANY_ID}/datasets/${DATASET_ID}/subjects/`,
    {
      method: "POST",
      body,
    }
  );

  return resp.id;
}

// 2) Crear batch para ese subject
export async function createBatch(subjectId: string): Promise<string> {
  ensureEnv();

  const resp = await request<{ id: string }>(
    `/companies/${COMPANY_ID}/datasets/${DATASET_ID}/subjects/${subjectId}/batches/`,
    {
      method: "POST",
    }
  );

  return resp.id;
}

// 3) Subir la imagen en base64 como image del batch
export async function uploadImageBase64(
  subjectId: string,
  batchId: string,
  base64DataUrl: string
): Promise<string> {
  ensureEnv();

  // La cámara / input te da "data:image/png;base64,AAAA..."
  // La API espera solo la parte base64.
  const commaIndex = base64DataUrl.indexOf(",");
  const b64 = commaIndex !== -1 ? base64DataUrl.slice(commaIndex + 1) : base64DataUrl;

  const body = JSON.stringify({
    side_id: 1, // frontal
    light_id: 1, // luz normal
    b64data: b64,
  });

  const resp = await request<{ id: string }>(
    `/companies/${COMPANY_ID}/datasets/${DATASET_ID}/subjects/${subjectId}/batches/${batchId}/images/`,
    {
      method: "POST",
      body,
    }
  );

  return resp.id;
}

// 4) Obtener resultados de esa image
export async function getImageResults(
  subjectId: string,
  batchId: string,
  imageId: string
): Promise<any[]> {
  ensureEnv();

  const resp = await request<any>(
    `/companies/${COMPANY_ID}/datasets/${DATASET_ID}/subjects/${subjectId}/batches/${batchId}/images/${imageId}/results/`
  );

  const list: any[] = Array.isArray(resp)
    ? resp
    : Array.isArray(resp?.results)
    ? resp.results
    : [];

  return list;
}

// 5) Mapear resultados crudos a métricas genéricas para la UI
export async function mapRawResultsToMetrics(
  rawResults: any[]
): Promise<HautMetric[]> {
  if (!rawResults || rawResults.length === 0) return [];

  const first = rawResults[0];

  // Caso 1: estamos usando Face Skin Metrics 3.0 (lo que tienes ahora)
  if (
    first &&
    first.face_skin_metrics_3 &&
    first.face_skin_metrics_3.parameters
  ) {
    const params = first.face_skin_metrics_3.parameters ?? {};
    const metrics: HautMetric[] = [];

    const addFromParam = (techName: string, paramKey: string) => {
      const param = (params as any)[paramKey];
      if (!param) return;

      let value: number | null = null;

      if (typeof param.score === "number") {
        value = param.score;
      } else if (typeof param.age === "number") {
        value = param.age;
      } else if (typeof param.eyes_age === "number") {
        value = param.eyes_age;
      } else if (typeof param.amount === "number") {
        value = param.amount;
      } else if (typeof param.density === "number") {
        value = param.density;
      }

      const maskUrl: string | undefined =
        param.masks?.front?.aligned_face ||
        param.masks?.front?.anonymised ||
        param.masks?.front?.original ||
        undefined;

      metrics.push({
        id: techName,
        label: techName,
        value: value ?? 0,
        techName,
        familyName: techName,
        tag: typeof param.tag === "string" ? param.tag : undefined,
        maskUrl,
        raw: param,
      });
    };

    // Aquí elegimos qué parámetros nos interesan
    addFromParam("lines", "lines");
    addFromParam("pores", "pores");
    addFromParam("redness", "redness");
    addFromParam("pigmentation", "pigmentation");
    addFromParam("acne", "breakouts");
    addFromParam("sagging", "sagging");
    addFromParam("dark_circles", "dark_circles");
    addFromParam("skin_type", "skin_type");
    addFromParam("skin_tone", "skintone");
    addFromParam("age", "age");
    addFromParam("eyes_age", "eyes_age");
    addFromParam("sun_spots", "sun_spots");

    return metrics;
  }

  // Caso 2 (fallback): resultados antiguos basados en algorithm_version_id
  const algorithms = await fetchAlgorithmsDict();

  return rawResults.map((result) => {
    const algo = algorithms.find((a) => a.id === result.algorithm_version_id);

    const techName =
      (algo as any)?.algorithm_tech_name || (algo as any)?.tech_name || undefined;
    const familyName = algo?.algorithm_family?.name;

    const r = result?.result;
    let value: number | null = null;

    if (typeof r === "number") {
      value = r;
    } else if (r && typeof r === "object") {
      if (typeof (r as any).score === "number") {
        value = (r as any).score;
      } else if (
        (r as any).main_metric &&
        typeof (r as any).main_metric.score === "number"
      ) {
        value = (r as any).main_metric.score;
      }
    }

    return {
      id:
        String(result.algorithm_version_id) ||
        techName ||
        familyName ||
        "unknown",
      label: familyName || techName || `Metric ${result.algorithm_version_id}`,
      value: value ?? 0,
      techName,
      familyName,
      raw: result,
    };
  });
}

// ==========================================
// BLOOM-SPECIFIC MAPPING (v1)
// Solo conectamos Lines & Wrinkles
// ==========================================

export function mapFaceSkin3LinesToBloom(rawBlock: any) {
  if (!rawBlock?.face_skin_metrics_3) return null;

  const params = rawBlock.face_skin_metrics_3.parameters;
  if (!params?.lines) return null;

  const haut = params.lines;

  return {
    id: "lines_wrinkles",
    score: typeof haut.score === "number" ? haut.score : 0,
    status:
      haut.tag === "Great"
        ? "Excellent"
        : haut.tag === "Good"
        ? "Good"
        : haut.tag === "Average"
        ? "Moderate"
        : "Needs Attention",
    zones: {
      forehead: haut.areas?.forehead?.length ?? 0,
      leftCheek: haut.areas?.left_eye?.length ?? 0,
      rightCheek: haut.areas?.right_eye?.length ?? 0,
      nose: haut.areas?.perioral?.length ?? 0,
      chin: 0,
    },
    insight: "Fine line detection from Haut.AI",
    description: "Real wrinkles analysis from Haut.AI Face Skin Metrics 3.0",
  };
}
// ============================================
// MAP: FACE SKIN METRICS 3 → Bloom (PORES)
// ============================================

export function mapFaceSkin3PoresToBloom(rawBlock: any) {
  // 1) Verificamos que exista el bloque correcto
  if (!rawBlock?.face_skin_metrics_3) return null;

  const params = rawBlock.face_skin_metrics_3.parameters;
  if (!params?.pores) return null;

  const haut = params.pores;

  // 2) Normalizamos score
  const rawScore =
    typeof haut.score === "number"
      ? haut.score
      : typeof haut.value === "number"
      ? haut.value
      : 0;

  const score = rawScore <= 1 ? Math.round(rawScore * 100) : Math.round(rawScore);

  // 3) Biomarcadores (ajustaremos con tu JSON real si quieres)
  const count =
    haut.count ??
    haut.number ??
    haut.metrics?.count ??
    0;

  const density =
    haut.density ??
    haut.metrics?.density ??
    null;

  return {
    id: "pores",
    score,
    rawScore,
    details: {
      count,
      density,
      ...haut,
    },
  };
}
// ============================================
// MAP: FACE SKIN METRICS 3 → Bloom (PIGMENTATION)
// ============================================
export function mapFaceSkin3PigmentationToBloom(rawBlock: any) {
  // 1) Verificamos que exista el bloque correcto
  if (!rawBlock?.face_skin_metrics_3) return null;

  const params = rawBlock.face_skin_metrics_3.parameters;
  if (!params?.pigmentation) return null;

  const haut = params.pigmentation;

  // 2) Normalizamos score (igual filosofía que en Pores)
  const rawScore =
    typeof haut.score === "number"
      ? haut.score
      : typeof haut.value === "number"
      ? haut.value
      : 0;

  const score =
    rawScore <= 1 ? Math.round(rawScore * 100) : Math.round(rawScore);

  // 3) Biomarcadores básicos (los afinamos cuando veamos el JSON real)
  const spotsCount =
    haut.spots_count ??
    haut.count ??
    haut.metrics?.spots_count ??
    haut.metrics?.count ??
    0;

  const coverage =
    haut.coverage ??
    haut.area ??
    haut.metrics?.coverage ??
    haut.metrics?.area ??
    null;

  const intensity =
    haut.intensity ??
    haut.severity ??
    haut.metrics?.intensity ??
    null;

  return {
    id: "pigmentation",
    score,
    rawScore,
    details: {
      spotsCount,
      coverage,
      intensity,
      // dejamos todo lo demás por si luego lo queremos usar
      ...haut,
    },
  };
}

// ============================================
// MAP: FACE SKIN METRICS 3 → Bloom OverallHealth
// Skin Age + Skin Type + Skin Tone (ITA real)
// ============================================
export function mapFaceSkin3ToOverallHealth(
  rawBlock: any,
  userActualAge?: number
): OverallHealth | null {
  if (!rawBlock?.face_skin_metrics_3) return null;

  const fs3 = rawBlock.face_skin_metrics_3 ?? {};
  const params = fs3.parameters ?? {};

  // Mezclamos predicted_labels del root y de face_skin_metrics_3 (por si Haut los pone en distintos sitios)
  const labels = {
    ...(rawBlock.predicted_labels ?? {}),
    ...(fs3.predicted_labels ?? {}),
  };

  const ageParam = params.age ?? params.skin_age;
  const skinTypeParam = params.skin_type;

  // ⚠️ Aquí es la clave: ITA suele venir como "ita" / "ITA"
  const itaParam =
    params.ita ?? params.ITA ?? params.ItA ?? params.itA ?? null;

  const pickNumber = (...candidates: any[]): number | undefined => {
    for (const v of candidates) {
      if (typeof v === "number" && !Number.isNaN(v)) return v;
    }
    return undefined;
  };

  const pickString = (...candidates: any[]): string | undefined => {
    for (const v of candidates) {
      if (typeof v === "string" && v.trim().length > 0) return v.trim();
    }
    return undefined;
  };

  // Helper: buscar un número con ciertas keys (ita, ita_angle, etc.) recorriendo el objeto
  const findNumberDeepByKeyList = (
    obj: any,
    keysLower: string[]
  ): number | undefined => {
    if (!obj || typeof obj !== "object") return undefined;

    for (const [k, v] of Object.entries(obj)) {
      const lowerK = k.toLowerCase();

      if (keysLower.includes(lowerK)) {
        if (typeof v === "number") return v;
        if (v && typeof v === "object" && typeof (v as any).value === "number") {
          return (v as any).value;
        }
      }

      if (v && typeof v === "object") {
        const nested = findNumberDeepByKeyList(v, keysLower);
        if (nested !== undefined) return nested;
      }
    }

    return undefined;
  };

  // -------------------------
  // 🔹 SKIN AGE (ya la teníamos)
  // -------------------------
  const perceivedAgeRaw = pickNumber(
    labels.perceived_age,
    ageParam?.age,
    ageParam?.predicted_age,
    ageParam?.apparent_age,
    ageParam?.biological_age,
    ageParam?.eyes_age
  );

  const actualAgeRaw = pickNumber(
    userActualAge,
    labels.actual_age,
    ageParam?.calendar_age,
    ageParam?.chronological_age,
    ageParam?.real_age
  );

  const perceivedAge =
    typeof perceivedAgeRaw === "number"
      ? Math.round(perceivedAgeRaw)
      : undefined;

  const actualAge =
    typeof actualAgeRaw === "number" ? Math.round(actualAgeRaw) : undefined;

  let ageAdvantage = "—";
  if (typeof perceivedAge === "number" && typeof actualAge === "number") {
    const diff = actualAge - perceivedAge;
    if (diff === 0) ageAdvantage = "Same as your age";
    else if (diff > 0) ageAdvantage = `~${diff} years younger`;
    else ageAdvantage = `~${Math.abs(diff)} years older`;
  }

  // -------------------------
  // 🔹 SKIN TYPE (Oily, Dry, etc.)
  // -------------------------
  const KNOWN_SKIN_TYPES = [
    "oily",
    "dry",
    "combination",
    "normal",
    "sensitive",
    "balanced",
  ];

  let skinType: string | undefined = pickString(
    labels.skin_type,
    labels.skin_type_label,
    skinTypeParam?.type_label,
    skinTypeParam?.skin_type,
    skinTypeParam?.category,
    skinTypeParam?.tag
  );

  if (!skinType && skinTypeParam && typeof skinTypeParam === "object") {
    for (const value of Object.values(skinTypeParam)) {
      if (typeof value === "string") {
        const lower = value.toLowerCase();
        if (KNOWN_SKIN_TYPES.includes(lower)) {
          skinType = value;
          break;
        }
      }
    }
  }

  if (!skinType) {
    skinType = "Not available";
  }

  // -------------------------
  // 🔹 ITA (Individual Typology Angle)
  // -------------------------
  // 1) Buscamos en predicted_labels
  // 2) Luego dentro de parameters.ita (itaParam)
  const itaFromTree = findNumberDeepByKeyList(itaParam, [
    "ita",
    "ita_angle",
    "ita_value",
    "ita_score",
  ]);

  const itaAngleNum = pickNumber(
    labels.ita,
    labels.ITA,
    labels.ita_angle,
    labels.ita_value,
    itaFromTree
  );

  const itaAngle =
    typeof itaAngleNum === "number" ? `${Math.round(itaAngleNum)}` : "—";

  // -------------------------
  // 🔹 SKIN TONE (lo representamos como ITA)
  // -------------------------
  let skinTone = "Not available";

  if (typeof itaAngleNum === "number") {
    // Esto es lo que verás en la card "Skin Tone"
    skinTone = `${Math.round(itaAngleNum)}`;
  }

  // -------------------------
  // 🔹 OVERALL SCORE
  // -------------------------
  const scoreNum = pickNumber(ageParam?.score, fs3.overall_score);
  const score =
    typeof scoreNum === "number" ? Math.round(scoreNum) : 72;

  return {
    score,
    skinTone,    // 👉 En tu UI actual, "Skin Tone" mostrará el número ITA (por ejemplo 23)
    itaAngle,    // 👉 También guardamos el ITA por separado por si lo quieres usar luego
    perceivedAge: perceivedAge ?? actualAge ?? 0,
    actualAge: actualAge ?? perceivedAge ?? 0,
    ageAdvantage,
    skinType,
  };
}







