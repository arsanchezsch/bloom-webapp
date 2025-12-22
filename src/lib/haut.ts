// ============================================
// src/lib/haut.ts
// Cliente ligero para la API SaaS de Haut.AI
// ============================================

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

  const response = await fetch(url, { ...options, headers });

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

// ============================================
// Helpers Bloom: Score → Grade/Tag/Description
// ============================================

export type HautScoreGradeMeta = {
  grade: number; // 1..5
  tag: "Great" | "Good" | "Average" | "Poor";
  description: string;
};

// ============================================
// (PORES) según la tabla
// ============================================

export function getPoresScoreGradeMeta(score: number): HautScoreGradeMeta {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  if (s >= 90) return { grade: 1, tag: "Great", description: "No visible pores" };
  if (s >= 80) return { grade: 2, tag: "Good", description: "Minimal visible pores" };
  if (s >= 50) return { grade: 3, tag: "Average", description: "Moderate visible pores" };
  if (s >= 30) return { grade: 4, tag: "Poor", description: "Numerous enlarged pores" };
  return { grade: 5, tag: "Poor", description: "Extensive enlarged pores" };
}

// ============================================
// (REDNESS) según tu tabla
// ============================================

export function getRednessScoreGradeMeta(score: number): HautScoreGradeMeta {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  if (s >= 90) {
    return {
      grade: 1,
      tag: "Great",
      description: "Minimal redness, barely noticeable pink tint",
    };
  }
  if (s >= 80) {
    return {
      grade: 2,
      tag: "Good",
      description: "Light pink areas or mild flushing",
    };
  }
  if (s >= 50) {
    return {
      grade: 3,
      tag: "Average",
      description: "Moderate redness with visible blood vessels",
    };
  }
  if (s >= 30) {
    return {
      grade: 4,
      tag: "Poor",
      description: "Significant redness with inflammation",
    };
  }
  return {
    grade: 5,
    tag: "Poor",
    description: "Severe redness with pronounced inflammation",
  };
}

// ============================================
// (SAGGING) según tu tabla (screenshot)
// 100–90: grade 1 Great
// 89–80: grade 2 Good
// 50–79: grade 3 Average
// 30–49: grade 4 Poor
// <30: grade 5 Poor
// ============================================

export function getSaggingScoreGradeMeta(score: number): HautScoreGradeMeta {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  if (s >= 90) {
    return { grade: 1, tag: "Great", description: "No visible skin sagging" };
  }
  if (s >= 80) {
    return {
      grade: 2,
      tag: "Good",
      description: "Mild sagging in nasolabial area or marionette lines",
    };
  }
  if (s >= 50) {
    return {
      grade: 3,
      tag: "Average",
      description:
        "Moderate sagging in the cheeks or jawline with visible softening of facial contours",
    };
  }
  if (s >= 30) {
    return {
      grade: 4,
      tag: "Poor",
      description:
        "Pronounced sagging with deep folds and noticeable loss of definition in facial structure",
    };
  }
  return {
    grade: 5,
    tag: "Poor",
    description:
      "Severe sagging with significant drooping, jowls, and extensive volume loss",
  };
}

// ============================================
// (PIGMENTATION) según tu tabla (screenshot)
// 100–90: grade 1 Great
// 89–80: grade 2 Good
// 50–79: grade 3 Average
// 30–49: grade 4 Poor
// <30: grade 5 Poor
// ============================================

export function getPigmentationScoreGradeMeta(score: number): HautScoreGradeMeta {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  if (s >= 90) {
    return {
      grade: 1,
      tag: "Great",
      description: "Skin tone is even with minimal to no visible pigmented spots",
    };
  }
  if (s >= 80) {
    return {
      grade: 2,
      tag: "Good",
      description: "Mild pigmentation visible as small, localized spots",
    };
  }
  if (s >= 50) {
    return {
      grade: 3,
      tag: "Average",
      description:
        "Moderate pigmentation present, with noticeable uneven tone and several pigmented spots across face",
    };
  }
  if (s >= 30) {
    return {
      grade: 4,
      tag: "Poor",
      description: "Extensive pigmentation with prominent hyperpigmented sports and areas",
    };
  }
  return {
    grade: 5,
    tag: "Poor",
    description: "Severe and widespread pigmentation with large, dense spots",
  };
}

// ============================================
// (LINES) según tu tabla (screenshot)
// 100–90: grade 1 Great: Subtle signs of fine lines
// 89–80: grade 2 Good: Multiple fine lines or a few deep lines
// 50–79: grade 3 Average: Presence of both deep and fine lines
// 30–49: grade 4 Poor: Presence of severe deep lines
// <30: grade 5 Poor: Presence of severe deep lines
// ============================================

export function getLinesScoreGradeMeta(score: number): HautScoreGradeMeta {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  if (s >= 90) {
    return { grade: 1, tag: "Great", description: "Subtle signs of fine lines" };
  }
  if (s >= 80) {
    return {
      grade: 2,
      tag: "Good",
      description: "Multiple fine lines or a few deep lines",
    };
  }
  if (s >= 50) {
    return {
      grade: 3,
      tag: "Average",
      description: "Presence of both deep and fine lines",
    };
  }
  if (s >= 30) {
    return {
      grade: 4,
      tag: "Poor",
      description: "Presence of severe deep lines",
    };
  }
  return {
    grade: 5,
    tag: "Poor",
    description: "Presence of severe deep lines",
  };
}

// ============================================
// Submétricas listas para usar en MetricDetailModal
// ============================================

// (PORES)
export type HautPoresSubmetrics = {
  numberOfPores: number; // pores.amount
  enlargedPores: number; // enlarged_pores.amount
  areas?: {
    pores?: Record<string, { amount?: number }>;
    enlarged_pores?: Record<string, { amount?: number }>;
  };
};

export function extractPoresSubmetricsFromRaw(raw: any): HautPoresSubmetrics {
  const poresAmount =
    typeof raw?.amount === "number"
      ? raw.amount
      : typeof raw?.pores_amount === "number"
      ? raw.pores_amount
      : 0;

  const enlargedAmount =
    typeof raw?.enlarged_pores_amount === "number"
      ? raw.enlarged_pores_amount
      : typeof raw?.enlarged_pores?.amount === "number"
      ? raw.enlarged_pores.amount
      : 0;

  return {
    numberOfPores: poresAmount,
    enlargedPores: enlargedAmount,
    areas: {
      pores: raw?.areas ?? undefined,
      enlarged_pores: raw?.enlarged_pores?.areas ?? undefined,
    },
  };
}

// (REDNESS) - IRRITATION score
export type HautRednessSubmetrics = {
  irritationScore: number; // irritation.score
  irritation?: any;
};

export function extractRednessSubmetricsFromRaw(raw: any): HautRednessSubmetrics {
  const irritationScore =
    typeof raw?.irritation?.score === "number"
      ? raw.irritation.score
      : typeof raw?.irritation_score === "number"
      ? raw.irritation_score
      : 0;

  return {
    irritationScore: Math.max(0, Math.min(100, Math.round(irritationScore))),
    irritation: raw?.irritation ?? undefined,
  };
}

// (SAGGING) - Jowls grade + Lacrimal grooves score
export type HautSaggingSubmetrics = {
  jowlsGrade: number; // jowls.grade
  lacrimalGroovesScore: number; // lacrimal_grooves.score
  jowls?: any;
  lacrimal_grooves?: any;
};

export function extractSaggingSubmetricsFromRaw(raw: any): HautSaggingSubmetrics {
  const jowlsGrade =
    typeof raw?.jowls?.grade === "number"
      ? raw.jowls.grade
      : typeof raw?.jowls_grade === "number"
      ? raw.jowls_grade
      : 0;

  const lacrimalScore =
    typeof raw?.lacrimal_grooves?.score === "number"
      ? raw.lacrimal_grooves.score
      : typeof raw?.lacrimal_grooves_score === "number"
      ? raw.lacrimal_grooves_score
      : 0;

  return {
    jowlsGrade: Math.max(0, Math.min(5, Math.round(jowlsGrade))),
    lacrimalGroovesScore: Math.max(0, Math.min(100, Math.round(lacrimalScore))),
    jowls: raw?.jowls ?? undefined,
    lacrimal_grooves: raw?.lacrimal_grooves ?? undefined,
  };
}

// (PIGMENTATION) - Freckles density / Moles number / Melasma density / Sun spots density
export type HautPigmentationSubmetrics = {
  frecklesDensity: number; // ‰
  molesAmount: number; // count
  melasmaDensity: number; // ‰
  sunSpotsDensity: number; // ‰
  freckles?: any;
  moles?: any;
  melasma?: any;
  sun_spots?: any;
};

export function extractPigmentationSubmetricsFromRaw(raw: any): HautPigmentationSubmetrics {
  const frecklesDensity =
    typeof raw?.freckles?.density === "number"
      ? raw.freckles.density
      : typeof raw?.freckles_density === "number"
      ? raw.freckles_density
      : 0;

  const molesAmount =
    typeof raw?.moles?.number_of_moles === "number"
      ? raw.moles.number_of_moles
      : typeof raw?.moles?.count === "number"
      ? raw.moles.count
      : typeof raw?.moles?.amount === "number"
      ? raw.moles.amount
      : typeof raw?.moles_amount === "number"
      ? raw.moles_amount
      : typeof raw?.moles_count === "number"
      ? raw.moles_count
      : 0;

  const melasmaDensity =
    typeof raw?.melasma?.density === "number"
      ? raw.melasma.density
      : typeof raw?.melasma_density === "number"
      ? raw.melasma_density
      : 0;

  const sunSpotsDensity =
    typeof raw?.sun_spots?.density === "number"
      ? raw.sun_spots.density
      : typeof raw?.sun_spots_density === "number"
      ? raw.sun_spots_density
      : 0;

  return {
    frecklesDensity: Math.max(0, Math.round(frecklesDensity)),
    molesAmount: Math.max(0, Math.round(molesAmount)),
    melasmaDensity: Math.max(0, Math.round(melasmaDensity)),
    sunSpotsDensity: Math.max(0, Math.round(sunSpotsDensity)),
    freckles: raw?.freckles ?? undefined,
    moles: raw?.moles ?? undefined,
    melasma: raw?.melasma ?? undefined,
    sun_spots: raw?.sun_spots ?? undefined,
  };
}

// (LINES) - Deep lines score + Fine lines score
export type HautLinesSubmetrics = {
  deepLinesScore: number;
  fineLinesScore: number;
  deep_lines?: any;
  fine_lines?: any;
  areas?: any;
};

export function extractLinesSubmetricsFromRaw(raw: any): HautLinesSubmetrics {
  const deepLinesScore =
    typeof raw?.deep_lines?.score === "number"
      ? raw.deep_lines.score
      : typeof raw?.deep_lines_score === "number"
      ? raw.deep_lines_score
      : 0;

  const fineLinesScore =
    typeof raw?.fine_lines?.score === "number"
      ? raw.fine_lines.score
      : typeof raw?.fine_lines_score === "number"
      ? raw.fine_lines_score
      : 0;

  return {
    deepLinesScore: Math.max(0, Math.min(100, Math.round(deepLinesScore))),
    fineLinesScore: Math.max(0, Math.min(100, Math.round(fineLinesScore))),
    deep_lines: raw?.deep_lines ?? undefined,
    fine_lines: raw?.fine_lines ?? undefined,
    areas: raw?.areas ?? undefined,
  };
}

// ============================================
// Tipos principales
// ============================================

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
  // etiqueta “Great / Average / …” de Haut
  tag?: string;
  // URL (aligned_face) para mostrar máscara + foto tal cual viene de Haut
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
    { method: "POST", body }
  );
  return resp.id;
}

// 2) Crear batch para ese subject
export async function createBatch(subjectId: string): Promise<string> {
  ensureEnv();
  const resp = await request<{ id: string }>(
    `/companies/${COMPANY_ID}/datasets/${DATASET_ID}/subjects/${subjectId}/batches/`,
    { method: "POST" }
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
  const commaIndex = base64DataUrl.indexOf(",");
  const b64 = commaIndex !== -1 ? base64DataUrl.slice(commaIndex + 1) : base64DataUrl;
  const body = JSON.stringify({
    side_id: 1, // frontal
    light_id: 1, // luz normal
    b64data: b64,
  });

  const resp = await request<{ id: string }>(
    `/companies/${COMPANY_ID}/datasets/${DATASET_ID}/subjects/${subjectId}/batches/${batchId}/images/`,
    { method: "POST", body }
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
  const list: any[] = Array.isArray(resp) ? resp : Array.isArray(resp?.results) ? resp.results : [];
  return list;
}

// ============================================
// Helpers internos
// ============================================

function pickNumber(...candidates: any[]): number | undefined {
  for (const v of candidates) {
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (typeof v === "string") {
      const n = Number(v);
      if (!Number.isNaN(n)) return n;
    }
  }
  return undefined;
}

function sumAreasAmount(areas: any): number | undefined {
  if (!areas || typeof areas !== "object") return undefined;
  const vals = Object.values(areas)
    .map((a: any) => a?.amount)
    .filter((x) => typeof x === "number" && !Number.isNaN(x)) as number[];
  if (!vals.length) return undefined;
  return vals.reduce((acc, v) => acc + v, 0);
}

// 5) Mapear resultados crudos a métricas genéricas para la UI
export async function mapRawResultsToMetrics(rawResults: any[]): Promise<HautMetric[]> {
  if (!rawResults || rawResults.length === 0) return [];

  const first = rawResults[0];

  // Caso 1: Face Skin Metrics 3.0
  if (first && first.face_skin_metrics_3 && first.face_skin_metrics_3.parameters) {
    const params = first.face_skin_metrics_3.parameters ?? {};
    const metrics: HautMetric[] = [];

    const pickAlignedFace = (obj: any) =>
      obj?.masks?.front?.aligned_face ||
      obj?.masks?.front?.anonymised ||
      obj?.masks?.front?.original ||
      undefined;

    const addFromParam = (techName: string, paramKey: string) => {
      const param = (params as any)[paramKey];
      if (!param) return;

      let value: number | null = null;
      if (typeof param.score === "number") value = param.score;
      else if (typeof param.age === "number") value = param.age;
      else if (typeof param.eyes_age === "number") value = param.eyes_age;
      else if (typeof param.amount === "number") value = param.amount;
      else if (typeof param.density === "number") value = param.density;

      // ✅ ENRIQUECER RAW PARA SUBMETRICS
      let enrichedRaw: any = param;

      // ACNE: breakouts + pimples + inflammation
      if (paramKey === "breakouts") {
        enrichedRaw = {
          ...param,
          inflammation: (params as any)?.inflammation ?? null,
          pimples: (params as any)?.pimples ?? null,
        };
      }

      // PORES: pores + enlarged_pores
      if (paramKey === "pores") {
        const enlarged = (params as any)?.enlarged_pores ?? null;
        enrichedRaw = {
          ...param,
          enlarged_pores: enlarged,
          pores_amount: typeof param?.amount === "number" ? param.amount : undefined,
          enlarged_pores_amount: typeof enlarged?.amount === "number" ? enlarged.amount : undefined,
        };

        if (typeof enrichedRaw?.score === "number") {
          const meta = getPoresScoreGradeMeta(enrichedRaw.score);
          if (!enrichedRaw?.tag) enrichedRaw.tag = meta.tag;
          if (!enrichedRaw?.grade) enrichedRaw.grade = meta.grade;
          if (!enrichedRaw?.score_description) enrichedRaw.score_description = meta.description;
        }
      }

      // REDNESS: redness + irritation
      if (paramKey === "redness") {
        const irritation = (params as any)?.irritation ?? null;
        enrichedRaw = {
          ...param,
          irritation,
          irritation_score: typeof irritation?.score === "number" ? irritation.score : undefined,
        };

        if (typeof enrichedRaw?.score === "number") {
          const meta = getRednessScoreGradeMeta(enrichedRaw.score);
          if (!enrichedRaw?.tag) enrichedRaw.tag = meta.tag;
          if (!enrichedRaw?.grade) enrichedRaw.grade = meta.grade;
          if (!enrichedRaw?.score_description) enrichedRaw.score_description = meta.description;
        }
      }

      // SAGGING: sagging + jowls + lacrimal_grooves
      if (paramKey === "sagging") {
        const jowls = (params as any)?.jowls ?? null;
        const lacrimal = (params as any)?.lacrimal_grooves ?? null;

        enrichedRaw = {
          ...param,
          jowls,
          lacrimal_grooves: lacrimal,
          jowls_grade: typeof jowls?.grade === "number" ? jowls.grade : undefined,
          lacrimal_grooves_score: typeof lacrimal?.score === "number" ? lacrimal.score : undefined,
        };

        if (typeof enrichedRaw?.score === "number") {
          const meta = getSaggingScoreGradeMeta(enrichedRaw.score);
          if (!enrichedRaw?.tag) enrichedRaw.tag = meta.tag;
          if (!enrichedRaw?.grade) enrichedRaw.grade = meta.grade;
          if (!enrichedRaw?.score_description) enrichedRaw.score_description = meta.description;
        }
      }

      // ✅ LINES: lines + deep_lines + fine_lines (Deep lines=score, Fine lines=score)
      if (paramKey === "lines") {
        const deepLines = (params as any)?.deep_lines ?? null;
        const fineLines = (params as any)?.fine_lines ?? null;

        const deepScore = pickNumber(deepLines?.score, (deepLines as any)?.value, enrichedRaw?.deep_lines_score);
        const fineScore = pickNumber(fineLines?.score, (fineLines as any)?.value, enrichedRaw?.fine_lines_score);

        enrichedRaw = {
          ...param,
          deep_lines: deepLines,
          fine_lines: fineLines,
          deep_lines_score: typeof deepScore === "number" ? deepScore : undefined,
          fine_lines_score: typeof fineScore === "number" ? fineScore : undefined,
        };

        if (typeof enrichedRaw?.score === "number") {
          const meta = getLinesScoreGradeMeta(enrichedRaw.score);
          if (!enrichedRaw?.tag) enrichedRaw.tag = meta.tag;
          if (!enrichedRaw?.grade) enrichedRaw.grade = meta.grade;
          if (!enrichedRaw?.score_description) enrichedRaw.score_description = meta.description;
        }
      }

      // ✅ PIGMENTATION robusto
      if (paramKey === "pigmentation") {
        const freckles = (params as any)?.freckles ?? null;
        const moles = (params as any)?.moles ?? null;
        const melasma = (params as any)?.melasma ?? null;
        const sunSpots = (params as any)?.sun_spots ?? null;

        const frecklesDensity = pickNumber(
          freckles?.density,
          (freckles as any)?.freckles_density,
          (freckles as any)?.density_value,
          param?.freckles?.density
        );

        const melasmaDensity = pickNumber(
          melasma?.density,
          (melasma as any)?.melasma_density,
          (melasma as any)?.density_value,
          param?.melasma?.density
        );

        const sunSpotsDensity = pickNumber(
          sunSpots?.density,
          (sunSpots as any)?.sun_spots_density,
          (sunSpots as any)?.density_value,
          param?.sun_spots?.density
        );

        const molesCount = pickNumber(
          moles?.number_of_moles,
          moles?.count,
          moles?.amount,
          (moles as any)?.moles_count,
          (moles as any)?.moles_amount,
          param?.moles?.count,
          param?.moles?.amount
        );

        enrichedRaw = {
          ...param,
          freckles,
          moles,
          melasma,
          sun_spots: sunSpots,
          freckles_density: frecklesDensity ?? 0,
          melasma_density: melasmaDensity ?? 0,
          sun_spots_density: sunSpotsDensity ?? 0,
          moles_amount: molesCount ?? 0,
          moles_count: molesCount ?? 0,
        };

        if (typeof enrichedRaw?.score === "number") {
          const meta = getPigmentationScoreGradeMeta(enrichedRaw.score);
          if (!enrichedRaw?.tag) enrichedRaw.tag = meta.tag;
          if (!enrichedRaw?.grade) enrichedRaw.grade = meta.grade;
          if (!enrichedRaw?.score_description) enrichedRaw.score_description = meta.description;
        }
      }

      // ✅ Mask URL (aligned_face) priorizado
      const maskUrl: string | undefined =
        // base param
        pickAlignedFace(enrichedRaw) ||
        // pores/acne/redness/sagging
        pickAlignedFace(enrichedRaw?.enlarged_pores) ||
        pickAlignedFace(enrichedRaw?.pimples) ||
        pickAlignedFace(enrichedRaw?.inflammation) ||
        pickAlignedFace(enrichedRaw?.irritation) ||
        pickAlignedFace(enrichedRaw?.lacrimal_grooves) ||
        pickAlignedFace(enrichedRaw?.jowls) ||
        // ✅ LINES submasks
        pickAlignedFace(enrichedRaw?.deep_lines) ||
        pickAlignedFace(enrichedRaw?.fine_lines) ||
        // pigmentation submasks
        pickAlignedFace(enrichedRaw?.sun_spots) ||
        pickAlignedFace(enrichedRaw?.melasma) ||
        pickAlignedFace(enrichedRaw?.moles) ||
        pickAlignedFace(enrichedRaw?.freckles) ||
        undefined;

      metrics.push({
        id: techName,
        label: techName,
        value: value ?? 0,
        techName,
        familyName: techName,
        tag: typeof enrichedRaw.tag === "string" ? enrichedRaw.tag : undefined,
        maskUrl,
        raw: enrichedRaw,
      });
    };

    // Parámetros que nos interesan
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

  // Caso 2 (fallback): resultados antiguos
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
      if (typeof (r as any).score === "number") value = (r as any).score;
      else if ((r as any).main_metric && typeof (r as any).main_metric.score === "number") {
        value = (r as any).main_metric.score;
      }
    }

    return {
      id: String(result.algorithm_version_id) || techName || familyName || "unknown",
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
// ==========================================

// ✅ LINES (principal + deep/fine)
export function mapFaceSkin3LinesToBloom(rawBlock: any) {
  if (!rawBlock?.face_skin_metrics_3) return null;

  const params = rawBlock.face_skin_metrics_3.parameters;
  if (!params?.lines) return null;

  const lines = params.lines;
  const deep = params.deep_lines ?? null;
  const fine = params.fine_lines ?? null;

  const rawScore =
    typeof lines.score === "number" ? lines.score : typeof lines.value === "number" ? lines.value : 0;

  const score = rawScore <= 1 ? Math.round(rawScore * 100) : Math.round(rawScore);
  const meta = getLinesScoreGradeMeta(score);

  const deepScore =
    typeof deep?.score === "number" ? deep.score : typeof deep?.value === "number" ? deep.value : 0;
  const fineScore =
    typeof fine?.score === "number" ? fine.score : typeof fine?.value === "number" ? fine.value : 0;

  return {
    id: "lines",
    score,
    rawScore,
    tag: lines?.tag ?? meta.tag,
    grade: lines?.grade ?? meta.grade,
    description: lines?.score_description ?? meta.description,
    details: {
      deepLinesScore: Math.max(0, Math.min(100, Math.round(deepScore))),
      fineLinesScore: Math.max(0, Math.min(100, Math.round(fineScore))),
      lines,
      deep_lines: deep,
      fine_lines: fine,
      areas: lines?.areas ?? null,
    },
  };
}

// ============================================
// MAP: FACE SKIN METRICS 3 → Bloom (PORES)
// ============================================

export function mapFaceSkin3PoresToBloom(rawBlock: any) {
  if (!rawBlock?.face_skin_metrics_3) return null;
  const params = rawBlock.face_skin_metrics_3.parameters;
  if (!params?.pores) return null;

  const pores = params.pores;
  const enlarged = params.enlarged_pores ?? null;

  const rawScore =
    typeof pores.score === "number" ? pores.score : typeof pores.value === "number" ? pores.value : 0;

  const score = rawScore <= 1 ? Math.round(rawScore * 100) : Math.round(rawScore);

  const sub = {
    numberOfPores: typeof pores.amount === "number" ? pores.amount : 0,
    enlargedPores: typeof enlarged?.amount === "number" ? enlarged.amount : 0,
    areas: {
      pores: pores?.areas ?? null,
      enlarged_pores: enlarged?.areas ?? null,
    },
  };

  const meta = getPoresScoreGradeMeta(score);

  return {
    id: "pores",
    score,
    rawScore,
    tag: pores?.tag ?? meta.tag,
    grade: pores?.grade ?? meta.grade,
    description: pores?.score_description ?? meta.description,
    details: { ...sub, pores, enlarged_pores: enlarged },
  };
}

// ============================================
// MAP: FACE SKIN METRICS 3 → Bloom (PIGMENTATION)
// ============================================

export function mapFaceSkin3PigmentationToBloom(rawBlock: any) {
  if (!rawBlock?.face_skin_metrics_3) return null;
  const params = rawBlock.face_skin_metrics_3.parameters;
  if (!params?.pigmentation) return null;

  const haut = params.pigmentation;

  const rawScore =
    typeof haut.score === "number" ? haut.score : typeof haut.value === "number" ? haut.value : 0;

  const score = rawScore <= 1 ? Math.round(rawScore * 100) : Math.round(rawScore);

  const spotsCount =
    haut.spots_count ?? haut.count ?? haut.metrics?.spots_count ?? haut.metrics?.count ?? 0;

  const coverage = haut.coverage ?? haut.area ?? haut.metrics?.coverage ?? haut.metrics?.area ?? null;
  const intensity = haut.intensity ?? haut.severity ?? haut.metrics?.intensity ?? null;

  return {
    id: "pigmentation",
    score,
    rawScore,
    details: { spotsCount, coverage, intensity, ...haut },
  };
}

// ============================================
// MAP: FACE SKIN METRICS 3 → Bloom OverallHealth
// ============================================

export function mapFaceSkin3ToOverallHealth(
  rawBlock: any,
  userActualAge?: number
): OverallHealth | null {
  if (!rawBlock?.face_skin_metrics_3) return null;

  const fs3 = rawBlock.face_skin_metrics_3 ?? {};
  const params = fs3.parameters ?? {};
  const labels = { ...(rawBlock.predicted_labels ?? {}), ...(fs3.predicted_labels ?? {}) };

  const ageParam = params.age ?? params.skin_age;
  const skinTypeParam = params.skin_type;
  const itaParam = params.ita ?? params.ITA ?? params.ItA ?? params.itA ?? null;

  const pickNumberDeep = (...candidates: any[]): number | undefined => {
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

  const findNumberDeepByKeyList = (obj: any, keysLower: string[]): number | undefined => {
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

  // SKIN AGE
  const perceivedAgeRaw = pickNumberDeep(
    labels.perceived_age,
    ageParam?.age,
    ageParam?.predicted_age,
    ageParam?.apparent_age,
    ageParam?.biological_age,
    ageParam?.eyes_age
  );

  const actualAgeRaw = pickNumberDeep(
    userActualAge,
    labels.actual_age,
    ageParam?.calendar_age,
    ageParam?.chronological_age,
    ageParam?.real_age
  );

  const perceivedAge = typeof perceivedAgeRaw === "number" ? Math.round(perceivedAgeRaw) : undefined;
  const actualAge = typeof actualAgeRaw === "number" ? Math.round(actualAgeRaw) : undefined;

  let ageAdvantage = "—";
  if (typeof perceivedAge === "number" && typeof actualAge === "number") {
    const diff = actualAge - perceivedAge;
    if (diff === 0) ageAdvantage = "Same as your age";
    else if (diff > 0) ageAdvantage = `~${diff} years younger`;
    else ageAdvantage = `~${Math.abs(diff)} years older`;
  }

  // SKIN TYPE
  const KNOWN_SKIN_TYPES = ["oily", "dry", "combination", "normal", "sensitive", "balanced"];
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

  if (!skinType) skinType = "Not available";

  // ITA
  const itaFromTree = findNumberDeepByKeyList(itaParam, ["ita", "ita_angle", "ita_value", "ita_score"]);
  const itaAngleNum = pickNumberDeep(labels.ita, labels.ITA, labels.ita_angle, labels.ita_value, itaFromTree);
  const itaAngle = typeof itaAngleNum === "number" ? `${Math.round(itaAngleNum)}` : "—";

  // SKIN TONE (mantenemos tu modelo actual)
  let skinTone = "Not available";
  if (typeof itaAngleNum === "number") skinTone = `${Math.round(itaAngleNum)}`;

  // OVERALL SCORE
  const scoreNum = pickNumberDeep(ageParam?.score, fs3.overall_score);
  const score = typeof scoreNum === "number" ? Math.round(scoreNum) : 72;

  return {
    score,
    skinTone,
    itaAngle,
    perceivedAge: perceivedAge ?? actualAge ?? 0,
    actualAge: actualAge ?? perceivedAge ?? 0,
    ageAdvantage,
    skinType,
  };
}
