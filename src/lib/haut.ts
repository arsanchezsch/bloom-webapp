// src/lib/haut.ts
// Cliente ligero para la API SaaS de Haut.AI

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
