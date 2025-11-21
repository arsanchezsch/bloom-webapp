// src/App.tsx
import { useState } from "react";
import { PersonalConsultation } from "./components/PersonalConsultation";
import { WebSkinScan } from "./components/WebSkinScan";
import { WebResultsScreen } from "./components/WebResultsScreen";
import { WebDashboard } from "./components/WebDashboard";
import { fakeBackend } from "./services/fakeBackend";

type Screen =
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
  // Detectar si estamos en la ruta /capture (para el flujo QR móvil)
  const isCaptureRoute =
    typeof window !== "undefined" && window.location.pathname === "/capture";

  // Si es /capture empezamos directamente en el escáner,
  // si no, empezamos en la consulta normal
  const initialScreen: Screen = isCaptureRoute
    ? "web-scan"
    : "web-consultation";

  const [currentScreen, setCurrentScreen] = useState<Screen>(initialScreen);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [consultationData, setConsultationData] =
    useState<ConsultationData | null>(null);

  // Tab inicial del dashboard
  const [initialDashboardTab, setInitialDashboardTab] = useState<
    "chat" | "progress" | "recommendations" | "profile"
  >("chat");

  // 🧍 Guardamos la consulta en el backend falso
  const handleConsultationComplete = async (data: ConsultationData) => {
    const saved = await fakeBackend.saveConsultation(data);
    setConsultationData(saved);
    setCurrentScreen("web-scan");
  };

  // 📸 Guardamos el scan en el backend falso
  const handleScanComplete = async (
    imageData: string,
    source: "camera" | "upload" = "upload"
  ) => {
    setCapturedImage(imageData);

    const consultationId = (consultationData as any)?.id;

    await fakeBackend.saveScan({
      imageData,
      source,
      consultationId,
    });

    setCurrentScreen("web-results");
  };

  const handleViewDashboard = (initialTab = "chat") => {
    setCurrentScreen("web-dashboard");
    setInitialDashboardTab(initialTab);
  };

  const handleViewResults = () => {
    setCurrentScreen("web-results");
  };

  // Render según pantalla
  switch (currentScreen) {
    case "web-consultation":
      return (
        <PersonalConsultation onComplete={handleConsultationComplete} />
      );

    case "web-scan":
      return (
        <WebSkinScan
          onComplete={handleScanComplete}
          // 👇 Si venimos de /capture (QR), abrimos la cámara directamente
          forceCameraMode={isCaptureRoute}
        />
      );

    case "web-results":
      return (
        <WebResultsScreen
          capturedImage={capturedImage}
          // Al ir al dashboard desde resultados, abrimos directamente la pestaña de progreso
          onViewDashboard={() => handleViewDashboard("progress")}
        />
      );

    case "web-dashboard":
      return (
        <WebDashboard
          onViewResults={handleViewResults}
          userInfo={consultationData ?? undefined}
          initialTab={initialDashboardTab}
        />
      );

    default:
      return null;
  }
}
