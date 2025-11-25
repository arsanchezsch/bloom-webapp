// ============================================
// WEB RESULTS SCREEN
// Main screen showing skin analysis results
// ============================================

import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Calendar, LayoutDashboard, Share2, Download } from "lucide-react";
import bloomLogo from "../assets/73a8a80abf64277705c5d856c147464ec33b1a04.png";
import exampleImage from "../assets/dab1c1df3e9d3b8d3a4ac9926dcfb3acb1003b4a.png";
import { AnalyzingScreen } from "./AnalyzingScreen";
import { exportElementToPdf } from "../utils/exportToPdf";

import {
  skinMetrics as staticSkinMetrics,
  overallHealth,
  recommendations,
} from "../constants/skinAnalysis";
import { formatDate } from "../utils/helpers";
import type { SkinMetric } from "../types";

// Sub-components
import { AnalyzedPhoto } from "./results/AnalyzedPhoto";
import { RadarOverview } from "./results/RadarOverview";
import { MetricCard } from "./results/MetricCard";
import { MetricDetailModal } from "./results/MetricDetailModal";
import { ShareModal } from "./results/ShareModal";
import { RoutineCard } from "./results/RoutineCard";

// Haut hook
import { useHautInference } from "../hooks/useHautInference";

interface WebResultsScreenProps {
  capturedImage: string | null;
  onViewDashboard?: () => void;
}

const SKIN_TYPE_ID = "skin_type";

// Simple mapping from Haut algorithm tech names → Bloom metric IDs.
const TECH_NAME_TO_SKIN_METRIC_ID: Record<string, string> = {
  // básicos que ya tenemos en UI
  acne: "acne",
  redness: "redness",
  pores: "pores",
  hydration: "hydration",
  pigmentation: "pigmentation",
  translucency: "translucency",

  // Haut "lines" → Bloom "Lines & Wrinkles"
  lines: "lines_wrinkles",

  // otros que quizá usemos más adelante
  uniformness: "texture",
  quality: "image_quality",
  ita: "skin_tone",
  skin_type: "skin_type",
  skin_tone: "skin_tone",
};


export function WebResultsScreen({
  capturedImage,
  onViewDashboard,
}: WebResultsScreenProps) {
  const [selectedMetric, setSelectedMetric] = useState<SkinMetric | null>(null);

  // SHARE
  const [isShareOpen, setIsShareOpen] = useState(false);

  // REF of the block we want to export to PDF
  const reportRef = useRef<HTMLDivElement | null>(null);

  // Avoid double click on download
  const [isDownloading, setIsDownloading] = useState(false);

  // Minimal data for share (later you can connect to real user email)
  const userEmail = "user@example.com";

  // Active metric ONLY for the photo dropdown
  const [activeMetricId, setActiveMetricId] = useState<string | null>(null);

  // Metrics we actually display (start with static, then override with Haut values)
  const [displayMetrics, setDisplayMetrics] =
    useState<SkinMetric[]>(staticSkinMetrics);

    // Mapa: id de métrica → URL de la imagen con máscara de Haut
const [metricMasks, setMetricMasks] = useState<Record<string, string | undefined>>({});


  // Call Haut inference whenever we have a captured image
  const {
    status: hautStatus,
    result: hautResult,
    error: hautError,
    isLoading: isHautLoading,
  } = useHautInference(capturedImage);

    // URLs de Haut para usar en el modal de detalle
    const faceSkin3 = (hautResult?.rawResults?.[0] as any)?.face_skin_metrics_3;

    const hautFaceImageUrl: string | undefined =
      faceSkin3?.predicted_images?.front?.aligned_face ??
      faceSkin3?.predicted_images?.front?.anonymised ??
      faceSkin3?.predicted_images?.front?.original;
  
    const hautLinesMaskUrl: string | undefined =
      faceSkin3?.parameters?.lines?.masks?.front?.aligned_face ??
      faceSkin3?.parameters?.lines?.masks?.front?.anonymised ??
      faceSkin3?.parameters?.lines?.masks?.front?.original;  

  // Options for the photo dropdown (without skin_type)
  const metricOptionsForPhoto = displayMetrics
    .filter((m) => m.id !== SKIN_TYPE_ID)
    .map((m) => ({
      id: m.id,
      name: m.name,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      label: (m as any).label,
    }));

      // When Haut returns results, update the scores & statuses of known metrics
  useEffect(() => {
    if (!hautResult || !hautResult.metrics || hautResult.metrics.length === 0) {
      return;
    }

    // 1) Actualizamos SCORE + STATUS (Good / Great / Average…)
    setDisplayMetrics((prev) => {
      const byId = new Map<string, SkinMetric>();
      prev.forEach((m) => byId.set(m.id, m));

      for (const m of hautResult.metrics) {
        const tech = (m.techName || "").toLowerCase();
        const mappedId = TECH_NAME_TO_SKIN_METRIC_ID[tech];

        if (!mappedId) continue;

        const existing = byId.get(mappedId);
        if (!existing) continue;

        byId.set(mappedId, {
          ...existing,
          score: m.value ?? existing.score,
          // AQUÍ usamos el tag de Haut (Great / Average / etc.)
          status: m.tag || existing.status,
        });
      }

      return Array.from(byId.values());
    });

    // 2) Guardamos las URLs de las máscaras para usarlas en el modal
    setMetricMasks((prevMasks) => {
      const next = { ...prevMasks };

      for (const m of hautResult.metrics) {
        const tech = (m.techName || "").toLowerCase();
        const mappedId = TECH_NAME_TO_SKIN_METRIC_ID[tech];
        if (!mappedId) continue;

        if (m.maskUrl) {
          next[mappedId] = m.maskUrl;
        }
      }

      return next;
    });
  }, [hautResult]);  

  const handleDownloadReport = async () => {
    if (!reportRef.current || isDownloading) return;

    try {
      setIsDownloading(true);
      await exportElementToPdf(reportRef.current, "bloom-skin-report.pdf");
    } catch (error) {
      console.error("Error generating PDF", error);
    } finally {
      setIsDownloading(false);
    }
  };

  // If there is no captured image, show a gentle fallback
  if (!capturedImage) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-[#E5E5E5] p-8 max-w-xl w-full shadow-sm">
          <div className="flex items-center mb-4">
            <img src={bloomLogo} alt="Bloom logo" className="h-8 w-auto mr-3" />
            <h1 className="text-[#18212D] font-['Manrope',sans-serif] text-xl">
              No active scan
            </h1>
          </div>
          <p className="text-[#4B5563] mb-6 font-['Manrope',sans-serif]">
            To view your skin analysis, please complete a scan from the previous
            screen.
          </p>
          <Button
            type="button"
            className="w-full h-11 bg-[#111827] text-white font-['Manrope',sans-serif]"
            onClick={() => {
              window.location.href = "/";
            }}
          >
            Go back to scan
          </Button>
        </div>
      </div>
    );
  }

  // Loading state while Haut is processing
if (isHautLoading) {
  // Usa la misma imagen que más abajo se pasa a <AnalyzedPhoto />
  const loadingImage = capturedImage || exampleImage;

  return <AnalyzingScreen imageUrl={loadingImage} />;
}

  // Error state if Haut failed
  if (hautStatus === "failed") {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-[#FCA5A5] p-8 max-w-xl w-full shadow-sm">
          <div className="flex items-center mb-4">
            <img src={bloomLogo} alt="Bloom logo" className="h-8 w-auto mr-3" />
            <h1 className="text-[#B91C1C] font-['Manrope',sans-serif] text-xl">
              We couldn&apos;t complete your analysis
            </h1>
          </div>
          <p className="text-[#4B5563] mb-4 font-['Manrope',sans-serif]">
            {hautError ||
              "There was a problem connecting to Haut.AI. Please try scanning again with another photo or better lighting."}
          </p>
          <div className="flex gap-3">
            <Button
              type="button"
              className="flex-1 h-11 bg-[#111827] text-white font-['Manrope',sans-serif]"
              onClick={() => {
                window.location.href = "/";
              }}
            >
              Scan again
            </Button>
            {onViewDashboard && (
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11 font-['Manrope',sans-serif]"
                onClick={onViewDashboard}
              >
                Go to dashboard
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main UI with results (using displayMetrics which may include real Haut values)
  return (
    <>
      {/* Everything we want to capture in the PDF goes inside this wrapper */}
      <div ref={reportRef} className="min-h-screen bg-[#F5F5F5]">
        {/* Header */}
        <div className="bg-white border-b border-[#E5E5E5] px-8 py-6 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1
                  className="text-[#18212D] font-['Manrope',sans-serif]"
                  style={{ fontSize: "32px", lineHeight: "40px" }}
                >
                  Your Skin Analysis Results
                </h1>
                <p className="text-[#6B7280] mt-1 font-['Manrope',sans-serif] flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Analyzed on {formatDate(new Date())}
                </p>
                {hautStatus === "completed" && (
                  <p className="text-[#059669] text-xs mt-1 font-['Manrope',sans-serif]">
                    Powered by Haut.AI · Metrics generated from your latest
                    selfie.
                  </p>
                )}
              </div>
              <img src={bloomLogo} alt="Bloom" className="h-12" />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-3">
              <Button
                type="button"
                onClick={() => onViewDashboard?.()}
                className="h-12 px-6 bg-white hover:bg-gradient-to-r hover:from-[#FFF5F3] hover:to-[#FFE5DD] text-[#18212D] hover:text-[#FF6B4A] rounded-full border border-[#E5E5E5] hover:border-[#FF6B4A]/30 font-['Manrope',sans-serif] transition-all duration-300"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>

              {/* SHARE BUTTON */}
              <Button
                type="button"
                onClick={() => setIsShareOpen(true)}
                className="h-12 px-6 bg-white hover:bg-gradient-to-r hover:from-[#FFF5F3] hover:to-[#FFE5DD] text-[#18212D] hover:text-[#FF6B4A] rounded-full border border-[#E5E5E5] hover:border-[#FF6B4A]/30 font-['Manrope',sans-serif] transition-all duration-300"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>

              {/* DOWNLOAD BUTTON */}
              <Button
                type="button"
                onClick={handleDownloadReport}
                disabled={isDownloading}
                className="h-12 px-6 bg-white hover:bg-gradient-to-r hover:from-[#FFF5F3] hover:to-[#FFE5DD] text-[#18212D] hover:text-[#FF6B4A] rounded-full border border-[#E5E5E5] hover:border-[#FF6B4A]/30 font-['Manrope',sans-serif] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4 mr-2" />
                {isDownloading ? "Generating PDF..." : "Download Report"}
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-8 py-8">
          {/* Photo + Radar */}
          <div className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnalyzedPhoto
  imageUrl={capturedImage || exampleImage}
  hautFaceImageUrl={hautFaceImageUrl}      // misma que pasas al modal
  hautLinesMaskUrl={hautLinesMaskUrl}      // misma que pasas al modal
/>
              <RadarOverview
                metrics={displayMetrics}
                overallHealth={overallHealth}
              />
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="mb-8">
            <h2
              className="text-[#18212D] mb-6 font-['Manrope',sans-serif]"
              style={{ fontSize: "24px", lineHeight: "32px" }}
            >
              Detailed Analysis
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {displayMetrics.map((metric) => (
                <MetricCard
                  key={metric.id}
                  metric={metric}
                  onClick={(m) => {
                    setSelectedMetric(m);
                  }}
                />
              ))}
            </div>
          </div>

          {/* Personalized Recommendations / Routine */}
          <div className="mb-8">
            <h2
              className="text-[#18212D] mb-6 font-['Manrope',sans-serif]"
              style={{ fontSize: "24px", lineHeight: "32px" }}
            >
              Personalized Skincare Routine
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {recommendations.map((routine, idx) => (
                <RoutineCard key={idx} routine={routine} />
              ))}
            </div>
          </div>

          {/* CTA Dashboard */}
          {onViewDashboard && (
            <div className="bg-gradient-to-br from-white to orange-50/30 rounded-3xl border border-[#E5E5E5] p-12 text-center shadow-lg">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF6B4A] to-[#FFA94D] flex items-center justify-center mx-auto mb-6">
                <LayoutDashboard className="w-10 h-10 text-white" />
              </div>
              <h2
                className="text-[#18212D] mb-3 font-['Manrope',sans-serif]"
                style={{ fontSize: "28px", lineHeight: "36px" }}
              >
                Ready to Track Your Progress?
              </h2>
              <p className="text-[#6B7280] mb-8 max-w-2xl mx-auto font-['Manrope',sans-serif]">
                Access your personalized dashboard to chat with your AI
                assistant, monitor your skin improvements over time, and view
                your complete scan history.
              </p>
              <Button
                type="button"
                onClick={() => onViewDashboard?.()}
                className="h-14 px-12 bg-gradient-to-r from-[#FF6B4A] to-[#FFA94D] hover:from-[#E74C3C] hover:to-[#FF8C42] text-white rounded-full shadow-xl border-0 font-['Manrope',sans-serif] text-lg"
              >
                Go to Dashboard
              </Button>
            </div>
          )}

          {/* Debug block: raw Haut.AI results (for development only) */}
          {hautResult && (
            <div className="mt-10 mb-6">
              <h3 className="text-[#4B5563] mb-2 text-sm font-['Manrope',sans-serif]">
                Debug · Raw Haut.AI results (development only)
              </h3>
              <pre className="text-xs bg-[#111827] text-[#F9FAFB] rounded-2xl p-4 overflow-x-auto">
                {JSON.stringify(hautResult.rawResults, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* These go OUTSIDE the PDF wrapper */}

            {/* Metric detail modal */}
            <MetricDetailModal
        metric={selectedMetric}
        onClose={() => setSelectedMetric(null)}
        imageUrl={capturedImage || exampleImage}
        hautFaceImageUrl={hautFaceImageUrl}
        hautLinesMaskUrl={hautLinesMaskUrl}
      />

      {/* SHARE MODAL */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        defaultEmail={userEmail}
        reportUrl={window.location.href}
      />
    </>
  );
}
