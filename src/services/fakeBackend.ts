// src/services/fakeBackend.ts

import type { ConsultationData } from "../App";

export type ScanSource = "camera" | "upload";

export interface ConsultationRecord extends ConsultationData {
  id: string;
  createdAt: string; // ISO date
}

export interface ScanRecord {
  id: string;
  consultationId?: string;
  imageData: string; // base64 image
  source: ScanSource;
  createdAt: string;
}

const STORAGE_KEYS = {
  CONSULTATIONS: "bloom_consultations",
  SCANS: "bloom_scans",
} as const;

// Utils
function loadArray<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function saveArray<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function generateId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now()}`;
}

// API pública del "backend"
export const fakeBackend = {
  // 🧍 Consulta inicial (intake)
  async saveConsultation(data: ConsultationData): Promise<ConsultationRecord> {
    const consultations = loadArray<ConsultationRecord>(
      STORAGE_KEYS.CONSULTATIONS
    );

    const record: ConsultationRecord = {
      ...data,
      id: generateId("consult"),
      createdAt: new Date().toISOString(),
    };

    consultations.push(record);
    saveArray(STORAGE_KEYS.CONSULTATIONS, consultations);

    return record;
  },

  async getLatestConsultation(): Promise<ConsultationRecord | null> {
    const consultations = loadArray<ConsultationRecord>(
      STORAGE_KEYS.CONSULTATIONS
    );
    if (!consultations.length) return null;
    return consultations[consultations.length - 1];
  },

  async getAllConsultations(): Promise<ConsultationRecord[]> {
    return loadArray<ConsultationRecord>(STORAGE_KEYS.CONSULTATIONS);
  },

  // 📸 Scans
  async saveScan(params: {
    imageData: string;
    source: ScanSource;
    consultationId?: string;
  }): Promise<ScanRecord> {
    const scans = loadArray<ScanRecord>(STORAGE_KEYS.SCANS);

    const record: ScanRecord = {
      id: generateId("scan"),
      imageData: params.imageData,
      source: params.source,
      consultationId: params.consultationId,
      createdAt: new Date().toISOString(),
    };

    scans.push(record);
    saveArray(STORAGE_KEYS.SCANS, scans);

    return record;
  },

  async getScansByConsultation(
    consultationId: string
  ): Promise<ScanRecord[]> {
    const scans = loadArray<ScanRecord>(STORAGE_KEYS.SCANS);
    return scans.filter((s) => s.consultationId === consultationId);
  },

  async getAllScans(): Promise<ScanRecord[]> {
    return loadArray<ScanRecord>(STORAGE_KEYS.SCANS);
  },

  async getLatestScan(): Promise<ScanRecord | null> {
    const scans = loadArray<ScanRecord>(STORAGE_KEYS.SCANS);
    if (!scans.length) return null;
    return scans[scans.length - 1];
  },
};
