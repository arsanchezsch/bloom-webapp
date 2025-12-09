// src/services/fakeBackend.ts

const CONSULTATIONS_KEY = "bloom_consultations_v1";
const SCANS_KEY = "bloom_scans_v1";
const PATIENTS_KEY = "bloom_patients";

function readArray<T = any>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function writeArray(key: string, value: any[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function generateId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export const fakeBackend = {
  // Guarda la consulta y registra/actualiza paciente
  async saveConsultation(data: any) {
    const consultations = readArray(CONSULTATIONS_KEY);

    const id = data.id || generateId("consultation");
    const createdAt = new Date().toISOString();

    const consultation = {
      ...data,
      id,
      createdAt,
    };

    consultations.push(consultation);
    writeArray(CONSULTATIONS_KEY, consultations);

    // Actualizar lista de pacientes para el DoctorHomeScreen
    const patients = readArray(PATIENTS_KEY);
    const patientIndex = patients.findIndex(
      (p: any) => p.email && data.email && p.email === data.email
    );

    const patient = {
      id, // usamos id de la última consulta como id del paciente
      fullName: data.fullName || "Patient",
      email: data.email || "",
      skinType: data.skinType || "Unknown",
      age: data.age || "",
      timestamp: createdAt,
    };

    if (patientIndex >= 0) {
      patients[patientIndex] = { ...patients[patientIndex], ...patient };
    } else {
      patients.push(patient);
    }

    writeArray(PATIENTS_KEY, patients);

    return consultation;
  },

  // Guarda el scan
  async saveScan(scan: { imageData: string; source?: string; consultationId?: string }) {
    const scans = readArray(SCANS_KEY);
    const id = generateId("scan");
    const createdAt = new Date().toISOString();

    const storedScan = {
      ...scan,
      id,
      createdAt,
    };

    scans.push(storedScan);
    writeArray(SCANS_KEY, scans);

    return storedScan;
  },

  async getLastConsultation() {
    const consultations = readArray(CONSULTATIONS_KEY);
    if (!consultations.length) return null;
    return consultations[consultations.length - 1];
  },

  async getLastScan() {
    const scans = readArray(SCANS_KEY);
    if (!scans.length) return null;
    return scans[scans.length - 1];
  },

  // 🔍 Para ir al dashboard de un paciente concreto
  async getConsultationById(id: string) {
    const consultations = readArray(CONSULTATIONS_KEY);
    return consultations.find((c: any) => c.id === id) || null;
  },

  // Utilidades opcionales
  async getConsultations() {
    return readArray(CONSULTATIONS_KEY);
  },

  async getPatients() {
    return readArray(PATIENTS_KEY);
  },
};
