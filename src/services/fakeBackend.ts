// src/services/fakeBackend.ts

// Pequeño "backend" fake en localStorage para:
// - Guardar historial de scans (para Photo History del dashboard)
// - Guardar el último análisis (metrics + overallHealth) para el Progress

export type ScanSource = "camera" | "upload";

export interface ScanRecord {
  id: string;
  imageData: string | null;
  source: ScanSource;
  createdAt: string; // ISO string
}

// Claves de localStorage
const SCANS_STORAGE_KEY = "bloom_fake_scans_v1";
const LAST_METRICS_KEY = "bloom_last_scan_metrics";
const LAST_OVERALL_KEY = "bloom_last_overall_health";
const LAST_CREATED_AT_KEY = "bloom_last_scan_created_at";

// Helpers de almacenamiento -----------------------

function loadScansFromStorage(): ScanRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(SCANS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ScanRecord[];
  } catch (err) {
    console.error("[fakeBackend] Error loading scans", err);
    return [];
  }
}

function saveScansToStorage(scans: ScanRecord[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SCANS_STORAGE_KEY, JSON.stringify(scans));
  } catch (err) {
    console.error("[fakeBackend] Error saving scans", err);
  }
}

// API pública -------------------------------------

export const fakeBackend = {
  /**
   * Guarda un nuevo scan en el historial (para Photo History).
   */
  async saveScan(
    imageData: string | null,
    source: ScanSource = "camera"
  ): Promise<ScanRecord> {
    const scans = loadScansFromStorage();

    const record: ScanRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      imageData,
      source,
      createdAt: new Date().toISOString(),
    };

    scans.push(record);
    saveScansToStorage(scans);

    return record;
  },

  /**
   * Devuelve TODOS los scans guardados (el Dashboard los ordena).
   * Es justo lo que está usando ahora WebDashboard: fakeBackend.getAllScans()
   */
  async getAllScans(): Promise<ScanRecord[]> {
    return loadScansFromStorage();
  },

  /**
   * Por si algún día quieres limpiar el historial.
   */
  async clearScans(): Promise<void> {
    saveScansToStorage([]);
  },

  /**
   * Guarda el último análisis completo para que el Dashboard pueda
   * mostrar las métricas y el Overall Health más recientes.
   */
  async saveLastAnalysis(payload: {
    metrics: any; // en WebResults son SkinMetric[]
    overallHealth: any;
    createdAt: string;
  }): Promise<void> {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(LAST_METRICS_KEY, JSON.stringify(payload.metrics));
      localStorage.setItem(
        LAST_OVERALL_KEY,
        JSON.stringify(payload.overallHealth)
      );
      localStorage.setItem(LAST_CREATED_AT_KEY, payload.createdAt);
    } catch (err) {
      console.error("[fakeBackend] Error saving last analysis", err);
    }
  },

  /**
   * Helper por si quieres leerlo desde otro sitio en el futuro.
   * (El Dashboard ya está leyendo directamente de localStorage,
   * así que esto ahora mismo es opcional.)
   */
  async getLastAnalysis(): Promise<{
    metrics: any | null;
    overallHealth: any | null;
    createdAt: string | null;
  }> {
    if (typeof window === "undefined") {
      return { metrics: null, overallHealth: null, createdAt: null };
    }

    try {
      const rawMetrics = localStorage.getItem(LAST_METRICS_KEY);
      const rawOverall = localStorage.getItem(LAST_OVERALL_KEY);
      const createdAt = localStorage.getItem(LAST_CREATED_AT_KEY);

      return {
        metrics: rawMetrics ? JSON.parse(rawMetrics) : null,
        overallHealth: rawOverall ? JSON.parse(rawOverall) : null,
        createdAt: createdAt ?? null,
      };
    } catch (err) {
      console.error("[fakeBackend] Error loading last analysis", err);
      return { metrics: null, overallHealth: null, createdAt: null };
    }
  },
};
