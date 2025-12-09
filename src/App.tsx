// src/App.tsx
import { useEffect, useState } from "react";
import { PersonalConsultation } from "./components/PersonalConsultation";
import { WebSkinScan } from "./components/WebSkinScan";
import { WebResultsScreen } from "./components/WebResultsScreen";
import { WebDashboard } from "./components/WebDashboard";
import { fakeBackend } from "./services/fakeBackend";

import {
  DoctorAuthScreen,
  DoctorSession,
} from "./components/DoctorAuthScreen";
import { DoctorHomeScreen } from "./components/DoctorHomeScreen";

type Screen =
  | "doctor-home"
  | "web-consultation"
  | "web-scan"
  | "web-results"
  | "web-dashboard";

export interface ConsultationData {
  fullName: string;
  email: string;
  age?: string;
  gender?: string;
  skinType?: string;
  skinConcerns?: string[];
  currentProducts?: string;
  medicalHistory?: string;
  [key: string]: any;
}

export default function App() {
  const [doctorSession, setDoctorSession] = useState<DoctorSession | null>(
    null
  );
  const [authReady, setAuthReady] = useState(false);

  const isCaptureRoute =
    typeof window !== "undefined" && window.location.pathname === "/capture";

  const [currentScreen, setCurrentScreen] = useState<Screen>(
    isCaptureRoute ? "web-scan" : "doctor-home"
  );
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [consultationData, setConsultationData] =
    useState<ConsultationData | null>(null);

  const [initialDashboardTab, setInitialDashboardTab] = useState<
    "chat" | "progress" | "recommendations" | "patient-profile"
  >("chat");

  // Leer sesión del doctor
  useEffect(() => {
    try {
      const stored = localStorage.getItem("bloom_doctor_session_v2");
      if (stored) {
        const parsed = JSON.parse(stored) as DoctorSession;
        if (parsed?.email) {
          setDoctorSession(parsed);
        }
      }
    } catch (err) {
      console.error("Error reading doctor session:", err);
    } finally {
      setAuthReady(true);
    }
  }, []);

  // Handlers
  const handleConsultationComplete = async (data: ConsultationData) => {
    const saved = await fakeBackend.saveConsultation(data);
    setConsultationData(saved);
    setCurrentScreen("web-scan");
  };

  const handleScanComplete = async (
    imageData: string,
    source: "camera" | "upload" = "upload"
  ) => {
    setCapturedImage(imageData);

    const consultationId = (consultationData as any)?.id;

    try {
      await fakeBackend.saveScan({
        imageData,
        source,
        consultationId,
      });
    } catch (error) {
      console.error("Error saving scan in fakeBackend:", error);
    } finally {
      setCurrentScreen("web-results");
    }
  };

  const handleViewDashboard = (
    initialTab:
      | "chat"
      | "progress"
      | "recommendations"
      | "patient-profile" = "chat"
  ) => {
    setCurrentScreen("web-dashboard");
    setInitialDashboardTab(initialTab);
  };

  const handleViewResults = () => {
    setCurrentScreen("web-results");
  };

  const handleStartConsultation = () => {
    setCurrentScreen("web-consultation");
  };

  const handleSelectPatient = async (patientId: string) => {
    // Cargar la consulta de ese paciente y abrir el dashboard
    const consultation = await fakeBackend.getConsultationById(patientId);
    if (consultation) {
      setConsultationData(consultation);
      setCurrentScreen("web-dashboard");
      setInitialDashboardTab("progress");
    }
  };

  const handleDoctorLogout = () => {
    try {
      localStorage.removeItem("bloom_doctor_session_v2");
    } catch {
      // ignore
    }
    setDoctorSession(null);
    setConsultationData(null);
    setCapturedImage(null);
    setCurrentScreen("doctor-home");
  };

  // =============== AUTH ===============
  if (!authReady) {
    return null;
  }

  if (!doctorSession) {
    return (
      <DoctorAuthScreen
        onAuthenticated={(session) => {
          setDoctorSession(session);
          setCurrentScreen("doctor-home");
        }}
      />
    );
  }

  // ============== NAV ==============
  switch (currentScreen) {
    case "doctor-home":
      return (
        <DoctorHomeScreen
          onNewConsultation={handleStartConsultation}
          onSelectPatient={handleSelectPatient}
          onLogout={handleDoctorLogout}
        />
      );

    case "web-consultation":
      return (
        <PersonalConsultation onComplete={handleConsultationComplete} />
      );

    case "web-scan":
      return (
        <WebSkinScan
          onComplete={handleScanComplete}
          forceCameraMode={isCaptureRoute}
        />
      );

    case "web-results":
      return (
        <WebResultsScreen
          capturedImage={capturedImage}
          onViewDashboard={() => handleViewDashboard("progress")}
        />
      );

    case "web-dashboard":
      return (
        <WebDashboard
          onViewResults={handleViewResults}
          userInfo={consultationData ?? undefined}
          initialTab={initialDashboardTab}
          onBackToHome={() => setCurrentScreen("doctor-home")}
          onTakeNewScan={() => setCurrentScreen("web-scan")}
        />
      );

    default:
      return null;
  }
}
