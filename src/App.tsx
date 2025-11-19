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
  const [currentScreen, setCurrentScreen] =
    useState<Screen>("web-consultation");

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [consultationData, setConsultationData] =
    useState<ConsultationData | null>(null);

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

  const handleViewDashboard = () => {
    setCurrentScreen("web-dashboard");
  };

  const handleViewResults = () => {
    setCurrentScreen("web-results");
  };

  // Render según pantalla
  switch (currentScreen) {
    case "web-consultation":
      return <PersonalConsultation onComplete={handleConsultationComplete} />;

    case "web-scan":
      return <WebSkinScan onComplete={handleScanComplete} />;

    case "web-results":
      return (
        <WebResultsScreen
          capturedImage={capturedImage}
          onViewDashboard={handleViewDashboard}
        />
      );

    case "web-dashboard":
      return (
        <WebDashboard
          onViewResults={handleViewResults}
          userInfo={consultationData ?? undefined}
        />
      );

    default:
      return null;
  }
}
