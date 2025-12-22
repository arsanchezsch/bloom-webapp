// ============================================
// WEB RESULTS SCREEN
// Main screen showing skin analysis results
// ============================================

import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Calendar, LayoutDashboard, Share2, Download } from "lucide-react";

import bloomLogo from "../assets/73a8a80abf64277705c5d856c147464ec33b1a04.png";
import exampleImage from "../assets/dab1c1df3e9d3b8d3a4ac9926dcfb3acb1003b4a.png";

import { AnalyzingScreen } from "./AnalyzingScreen";
import { exportElementToPdf } from "../utils/exportToPdf";
import { fakeBackend } from "../services/fakeBackend";

import {
  skinMetrics as staticSkinMetrics,
  overallHealth as mockOverallHealth,
} from "../constants/skinAnalysis";

import { formatDate } from "../utils/helpers";
import type { SkinMetric } from "../types";

// Sub-components
import { AnalyzedPhoto } from "./results/AnalyzedPhoto";
import { RadarOverview } from "./results/RadarOverview";
import { MetricCard } from "./results/MetricCard";
import { MetricDetailModal } from "./results/MetricDetailModal";
import { ShareModal } from "./results/ShareModal";

// Haut hook + mapper para OverallHealth real
import { useHautInference } from "../hooks/useHautInference";
import { mapFaceSkin3ToOverallHealth } from "../lib/haut";

interface WebResultsScreenProps {
  capturedImage: string | null;
  onViewDashboard?: () => void;
}

const BLOOM_SERVER_URL = import.meta.env.VITE_BLOOM_SERVER_URL;

// IDs de las métricas que usamos para el Overall Health (promedio)
const OVERALL_METRIC_IDS = [
  "acne",
  "redness",
  "pores",
  "sagging",
  "pigmentation",
  "dark_circles",
  "lines_wrinkles",
];

// Simple mapping from Haut algorithm tech names → Bloom metric IDs.
const TECH_NAME_TO_SKIN_METRIC_ID: Record<string, string> = {
  acne: "acne",
  redness: "redness",
  pores: "pores",
  pigmentation: "pigmentation",
  sagging: "sagging",
  dark_circles: "dark_circles",
  hydration: "sagging",
  translucency: "dark_circles",
  lines: "lines_wrinkles",
  uniformness: "texture",
  quality: "image_quality",
  ita: "skin_tone",
  skin_type: "skin_type",
  skin_tone: "skin_tone",
};

// ---------- OpenAI Routine Types ----------
type RoutineSectionId = "morning" | "evening" | "weekly";

interface RoutineStep {
  id: string;
  title: string;
  subtitle: string;
  concerns: string[];
  usageNotes?: string;
}

interface RoutineSection {
  id: RoutineSectionId;
  title: string;
  steps: RoutineStep[];
}

interface BloomRoutineResponse {
  summary: string;
  mainConcerns: string[];
  sections: RoutineSection[];
  disclaimer: string;
}

export function WebResultsScreen({
  capturedImage,
  onViewDashboard,
}: WebResultsScreenProps) {
  const [selectedMetric, setSelectedMetric] = useState<SkinMetric | null>(null);

  const [isShareOpen, setIsShareOpen] = useState(false);
  const reportRef = useRef<HTMLDivElement | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const userEmail = "user@example.com";

  const [displayMetrics, setDisplayMetrics] =
    useState<SkinMetric[]>(staticSkinMetrics);

  const [dynamicOverallHealth, setDynamicOverallHealth] =
    useState(mockOverallHealth);

  // Guardamos el link “maskUrl” por metricId (viene de lib/haut.ts como aligned_face)
  const [metricMasks, setMetricMasks] = useState<
    Record<string, string | undefined>
  >({});

  // flag para no guardar dos veces el mismo análisis
  const hasPersistedRef = useRef(false);

  // ---- OpenAI Routine state ----
  const [routine, setRoutine] = useState<BloomRoutineResponse | null>(null);
  const [isLoadingRoutine, setIsLoadingRoutine] = useState(false);
  const [routineError, setRoutineError] = useState<string | null>(null);

  const {
    status: hautStatus,
    result: hautResult,
    error: hautError,
    isLoading: isHautLoading,
  } = useHautInference(capturedImage);

  // ============================
  // Imagen base + máscaras Haut (legacy fallback)
  // ============================
  const faceSkin3 = (hautResult?.rawResults?.[0] as any)?.face_skin_metrics_3;

  let hautFaceImageUrl: string | undefined;
  let hautLinesMaskUrl: string | undefined;
  let hautPoresMaskUrl: string | undefined;
  let hautPigmentationMaskUrl: string | undefined;
  let hautAcneMaskUrl: string | undefined;
  let hautRednessMaskUrl: string | undefined;
  let hautSaggingMaskUrl: string | undefined;
  let hautDarkCirclesMaskUrl: string | undefined;

  if (faceSkin3) {
    const frontImages = faceSkin3.predicted_images?.front ?? {};
    const variantOrder = ["aligned_face", "anonymised", "original"] as const;

    const chosenVariant =
      variantOrder.find((v) => frontImages && frontImages[v]) ?? undefined;

    hautFaceImageUrl =
      (chosenVariant && frontImages[chosenVariant]) ||
      frontImages.aligned_face ||
      frontImages.anonymised ||
      frontImages.original;

    const getMask = (
      metricKey:
        | "lines"
        | "pores"
        | "pigmentation"
        | "breakouts"
        | "redness"
        | "sagging"
        | "dark_circles"
    ) => {
      const masksFront = faceSkin3.parameters?.[metricKey]?.masks?.front ?? {};
      if (chosenVariant && masksFront[chosenVariant]) return masksFront[chosenVariant];
      return masksFront.aligned_face || masksFront.anonymised || masksFront.original;
    };

    hautLinesMaskUrl = getMask("lines");
    hautPoresMaskUrl = getMask("pores");
    hautPigmentationMaskUrl = getMask("pigmentation");
    hautAcneMaskUrl = getMask("breakouts");
    hautRednessMaskUrl = getMask("redness");
    hautSaggingMaskUrl = getMask("sagging");
    hautDarkCirclesMaskUrl = getMask("dark_circles");
  }

  // ============================
  // 1) Actualizar métricas (scores + status + raw + biomarkers)
  //    ✅ + Pigmentation FIXED
  //    ✅ + Lines Deep/Fine FIXED (using face_skin_metrics_3.parameters.deep_lines/fine_lines)
  // ============================
  useEffect(() => {
    if (!hautResult || !hautResult.metrics || hautResult.metrics.length === 0) return;

    // ✅ Fuente real de deep_lines / fine_lines
    const fs3Params =
      (hautResult.rawResults?.[0] as any)?.face_skin_metrics_3?.parameters ?? {};

    const deepLinesScoreReal =
      typeof fs3Params?.deep_lines?.score === "number"
        ? fs3Params.deep_lines.score
        : typeof fs3Params?.deep_wrinkles?.score === "number"
        ? fs3Params.deep_wrinkles.score
        : undefined;

    const fineLinesScoreReal =
      typeof fs3Params?.fine_lines?.score === "number"
        ? fs3Params.fine_lines.score
        : typeof fs3Params?.fine_wrinkles?.score === "number"
        ? fs3Params.fine_wrinkles.score
        : undefined;

    setDisplayMetrics((prev) => {
      const byId = new Map<string, SkinMetric>();
      prev.forEach((m) => byId.set(m.id, m));

      for (const m of hautResult.metrics) {
        const tech = String((m as any).techName || "").toLowerCase();
        const mappedId = TECH_NAME_TO_SKIN_METRIC_ID[tech];
        if (!mappedId) continue;

        const existing = byId.get(mappedId);
        if (!existing) continue;

        const nameLower = String(existing.name || "").toLowerCase();

        const isAcneMetric =
          mappedId === "acne" || nameLower.includes("acne") || tech === "acne";
        const isPoresMetric =
          mappedId === "pores" || nameLower.includes("pore") || tech === "pores";
        const isRednessMetric =
          mappedId === "redness" || nameLower.includes("redness") || tech === "redness";
        const isSaggingMetric =
          mappedId === "sagging" || nameLower.includes("sagging") || tech === "sagging";
        const isPigmentationMetric =
          mappedId === "pigmentation" || nameLower.includes("pigment") || tech === "pigmentation";
        const isLinesMetric =
          mappedId === "lines_wrinkles" || nameLower.includes("line") || tech === "lines";

        const rawAny: any = (m as any).raw ?? (existing as any).raw ?? {};
        const scoreDescription =
          typeof rawAny?.score_description === "string" ? rawAny.score_description : undefined;

        let updated: SkinMetric = {
          ...existing,
          score: (m as any).value ?? existing.score,
          status: ((m as any).tag as any) || existing.status,
          raw: rawAny,
          ...(scoreDescription ? { description: scoreDescription } : {}),
          ...(m.maskUrl ? ({ maskUrl: m.maskUrl } as any) : {}),
        };

        // ✅ ACNE biomarkers
        if (isAcneMetric) {
          const acneRaw: any = rawAny || {};
          const pimplesCount =
            acneRaw?.pimples?.amount ??
            acneRaw?.pimples?.count ??
            acneRaw?.pimples_count ??
            acneRaw?.number_of_pimples ??
            acneRaw?.pimples?.number ??
            undefined;

          const acneDensity =
            acneRaw?.inflammation?.density ??
            acneRaw?.acne_inflammation?.density ??
            acneRaw?.density ??
            undefined;

          updated = {
            ...updated,
            biomarkers: [
              { label: "Number of pimples", value: pimplesCount ?? existing.biomarkers?.[0]?.value ?? "—" },
              { label: "Density", value: acneDensity ?? existing.biomarkers?.[1]?.value ?? "—" },
            ],
          };
        }

        // ✅ PORES biomarkers
        if (isPoresMetric) {
          const poresRaw: any = rawAny || {};
          const poresTotal =
            poresRaw?.amount ??
            poresRaw?.pores_amount ??
            (typeof poresRaw?.areas === "object"
              ? Object.values(poresRaw.areas || {}).reduce((acc: number, a: any) => {
                  const v = typeof a?.amount === "number" ? a.amount : 0;
                  return acc + v;
                }, 0)
              : undefined);

          const enlargedTotal =
            poresRaw?.enlarged_pores?.amount ??
            poresRaw?.enlarged_pores_amount ??
            (typeof poresRaw?.enlarged_pores?.areas === "object"
              ? Object.values(poresRaw.enlarged_pores.areas || {}).reduce(
                  (acc: number, a: any) => {
                    const v = typeof a?.amount === "number" ? a.amount : 0;
                    return acc + v;
                  },
                  0
                )
              : undefined);

          updated = {
            ...updated,
            biomarkers: [
              { label: "Number of pores", value: poresTotal ?? existing.biomarkers?.[0]?.value ?? "—" },
              { label: "Enlarged pores", value: enlargedTotal ?? existing.biomarkers?.[1]?.value ?? "—" },
            ],
          };
        }

        // ✅ REDNESS biomarker
        if (isRednessMetric) {
          const rednessRaw: any = rawAny || {};
          const irritationScore =
            rednessRaw?.irritation?.score ?? rednessRaw?.irritation_score ?? undefined;

          updated = {
            ...updated,
            biomarkers: [{ label: "Irritation", value: irritationScore ?? existing.biomarkers?.[0]?.value ?? "—" }],
          };
        }

        // ✅ SAGGING biomarkers
        if (isSaggingMetric) {
          const sagRaw: any = rawAny || {};
          const jowlsGrade =
            sagRaw?.jowls?.grade ?? sagRaw?.jowls_grade ?? sagRaw?.jowls?.value ?? undefined;

          const lacrimalScore =
            sagRaw?.lacrimal_grooves?.score ??
            sagRaw?.lacrimal_grooves_score ??
            sagRaw?.tear_trough?.score ??
            sagRaw?.tear_troughs?.score ??
            undefined;

          updated = {
            ...updated,
            biomarkers: [
              { label: "Jowls", value: jowlsGrade ?? existing.biomarkers?.[0]?.value ?? "—" },
              { label: "Lacrimal grooves", value: lacrimalScore ?? existing.biomarkers?.[1]?.value ?? "—" },
            ],
          };
        }

        // ✅ PIGMENTATION biomarkers (uses enriched keys if present)
        if (isPigmentationMetric) {
          const pigRaw: any = rawAny || {};
          const frecklesDensity = pigRaw?.freckles_density ?? pigRaw?.freckles?.density ?? undefined;

          const molesAmount =
            pigRaw?.moles_count ??
            pigRaw?.moles_amount ??
            pigRaw?.moles?.number_of_moles ??
            pigRaw?.moles?.count ??
            pigRaw?.moles?.amount ??
            undefined;

          const melasmaDensity = pigRaw?.melasma_density ?? pigRaw?.melasma?.density ?? undefined;

          const sunSpotsDensity =
            pigRaw?.sun_spots_density ??
            pigRaw?.sun_spots?.density ??
            pigRaw?.sunspots_density ??
            undefined;

          updated = {
            ...updated,
            biomarkers: [
              { label: "Freckles", value: frecklesDensity ?? existing.biomarkers?.[0]?.value ?? "—" },
              { label: "Moles", value: molesAmount ?? existing.biomarkers?.[1]?.value ?? "—" },
              { label: "Melasma", value: melasmaDensity ?? existing.biomarkers?.[2]?.value ?? "—" },
              { label: "Sun spots", value: sunSpotsDensity ?? existing.biomarkers?.[3]?.value ?? "—" },
            ],
          };
        }

        // ✅✅ LINES FIX: NO uses the main lines score for deep/fine.
        // Pull real values from face_skin_metrics_3.parameters.deep_lines / fine_lines
        if (isLinesMetric) {
          const linesRaw: any = rawAny || {};

          const deepScore =
            typeof linesRaw?.deep_lines?.score === "number"
              ? linesRaw.deep_lines.score
              : deepLinesScoreReal;

          const fineScore =
            typeof linesRaw?.fine_lines?.score === "number"
              ? linesRaw.fine_lines.score
              : fineLinesScoreReal;

          updated = {
            ...updated,
            raw: {
              ...linesRaw,
              deep_lines: linesRaw?.deep_lines ?? (typeof deepScore === "number" ? { score: deepScore } : undefined),
              fine_lines: linesRaw?.fine_lines ?? (typeof fineScore === "number" ? { score: fineScore } : undefined),
              deep_lines_score: linesRaw?.deep_lines_score ?? deepScore,
              fine_lines_score: linesRaw?.fine_lines_score ?? fineScore,
            },
          };
        }

        byId.set(mappedId, updated);
      }

      return Array.from(byId.values());
    });

    // Guardamos masks en mapa
    setMetricMasks((prevMasks) => {
      const next = { ...prevMasks };
      for (const m of hautResult.metrics) {
        const tech = String((m as any).techName || "").toLowerCase();
        const mappedId = TECH_NAME_TO_SKIN_METRIC_ID[tech];
        if (!mappedId) continue;
        if ((m as any).maskUrl) next[mappedId] = (m as any).maskUrl;
      }
      return next;
    });
  }, [hautResult]);

  // ============================
  // 2) OverallHealth desde Haut
  // ============================
  useEffect(() => {
    if (!hautResult || !hautResult.rawResults?.length) return;
    const rawBlock = hautResult.rawResults[0];
    const mapped = mapFaceSkin3ToOverallHealth(rawBlock);
    if (!mapped) return;
    setDynamicOverallHealth(mapped);
  }, [hautResult]);

  // ============================
  // 3) Overall Health promedio
  // ============================
  useEffect(() => {
    if (!displayMetrics || displayMetrics.length === 0) return;

    const relevantMetrics = displayMetrics.filter((m) =>
      OVERALL_METRIC_IDS.includes(m.id)
    );
    if (relevantMetrics.length === 0) return;

    const sum = relevantMetrics.reduce((acc, m) => acc + (m.score ?? 0), 0);
    const avg = Math.round(sum / relevantMetrics.length);

    setDynamicOverallHealth((prev) => ({ ...prev, score: avg }));
  }, [displayMetrics]);

  // ============================
  // 4A) Guardar último análisis
  // ============================
  useEffect(() => {
    if (!hautResult) return;
    if (!displayMetrics || displayMetrics.length === 0) return;
    if (!dynamicOverallHealth) return;

    try {
      localStorage.setItem(
        "bloom_last_scan_metrics",
        JSON.stringify(displayMetrics)
      );
      localStorage.setItem(
        "bloom_last_overall_health",
        JSON.stringify(dynamicOverallHealth)
      );
      localStorage.setItem(
        "bloom_last_metric_masks_v1",
        JSON.stringify(metricMasks)
      );
    } catch (err) {
      console.error("[Bloom] Error saving last analysis to localStorage", err);
    }
  }, [hautResult, displayMetrics, dynamicOverallHealth, metricMasks]);

  // ============================
  // 4B) Guardar UNA VEZ en histórico
  // ============================
  useEffect(() => {
    if (!hautResult) return;
    if (!capturedImage) return;
    if (hasPersistedRef.current) return;

    try {
      fakeBackend.saveScan(capturedImage, "camera");
      hasPersistedRef.current = true;
    } catch (err) {
      console.error("[Bloom] Error saving scan to fakeBackend", err);
    }
  }, [hautResult, capturedImage]);

  // ============================
  // 5) Rutina OpenAI
  // ============================
  useEffect(() => {
    if (!hautResult || !hautResult.metrics || hautResult.metrics.length === 0)
      return;

    const controller = new AbortController();

    async function fetchRoutine() {
      try {
        setIsLoadingRoutine(true);
        setRoutineError(null);

        const res = await fetch(`${BLOOM_SERVER_URL}/api/recommendations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            skinMetrics: displayMetrics,
            overallHealth: dynamicOverallHealth,
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Error fetching routine (${res.status}): ${text}`);
        }

        const data = (await res.json()) as BloomRoutineResponse;
        setRoutine(data);

        try {
          localStorage.setItem("bloom_last_routine_v1", JSON.stringify(data));
          localStorage.setItem(
            "bloom_last_routine_created_at_v1",
            new Date().toISOString()
          );
        } catch (err) {
          console.error("[Bloom] Error saving last routine", err);
        }
      } catch (error: any) {
        if (error?.name === "AbortError") return;
        setRoutineError(
          "No hemos podido generar tu rutina personalizada ahora mismo. Volveremos a intentarlo en tu próximo escaneo."
        );
      } finally {
        setIsLoadingRoutine(false);
      }
    }

    fetchRoutine();
    return () => controller.abort();
  }, [hautResult, displayMetrics, dynamicOverallHealth]);

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

  // ============================
  // Fallbacks
  // ============================
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

  if (isHautLoading) {
    const loadingImage = capturedImage || exampleImage;
    return <AnalyzingScreen imageUrl={loadingImage} />;
  }

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

  // ============================
  // MAIN UI
  // ============================
  return (
    <>
      <div ref={reportRef} className="min-h-screen bg-[#F5F5F5]">
        {/* Header */}
        <div className="bg-white border-b border-[#E5E5E5] px-8 py-4 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-6">
              {/* Left: Title */}
              <div className="min-w-0">
                <h1
                  className="text-[#18212D] font-['Manrope',sans-serif] truncate"
                  style={{ fontSize: "32px", lineHeight: "40px" }}
                >
                  Your Skin Analysis Results
                </h1>
                <p className="text-[#6B7280] mt-1 font-['Manrope',sans-serif] flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Analyzed on {formatDate(new Date())}
                </p>
              </div>

              {/* Center: Actions */}
              <div className="flex items-center gap-3 shrink-0">
                <Button
                  type="button"
                  onClick={() => onViewDashboard?.()}
                  className="bloom-btn h-11 px-7 rounded-full border-0 font-['Manrope',sans-serif] text-white bg-gradient-to-r from-[#FF6B4A] to-[#FFA94D] hover:opacity-95"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Button>

                <Button
                  type="button"
                  onClick={() => setIsShareOpen(true)}
                  className="bloom-btn h-11 px-7 rounded-full font-['Manrope',sans-serif] bg-white/70 backdrop-blur border border-[#FF6B4A]/40 text-[#FF6B4A] hover:bg-white"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>

                <Button
                  type="button"
                  onClick={handleDownloadReport}
                  disabled={isDownloading}
                  className="bloom-btn h-11 px-7 rounded-full font-['Manrope',sans-serif] bg-white/70 backdrop-blur border border-[#FF6B4A]/40 text-[#FF6B4A] hover:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isDownloading ? "Generating…" : "Download"}
                </Button>
              </div>

              {/* Right: Logo */}
              <img
                src={bloomLogo}
                alt="Bloom"
                className="h-10 w-auto shrink-0"
              />
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
                hautFaceImageUrl={hautFaceImageUrl}
                hautLinesMaskUrl={hautLinesMaskUrl}
                hautPoresMaskUrl={hautPoresMaskUrl}
                hautPigmentationMaskUrl={hautPigmentationMaskUrl}
                hautAcneMaskUrl={hautAcneMaskUrl}
                hautRednessMaskUrl={hautRednessMaskUrl}
                hautSaggingMaskUrl={hautSaggingMaskUrl}
                hautDarkCirclesMaskUrl={hautDarkCirclesMaskUrl}
              />

              <RadarOverview
                metrics={displayMetrics}
                overallHealth={dynamicOverallHealth}
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
                  onClick={(m) => setSelectedMetric(m)}
                />
              ))}
            </div>
          </div>

          {/* Personalized Recommendations / Routine */}
          <div className="mb-10">
            <h2
              className="text-[#18212D] mb-4 font-['Manrope',sans-serif]"
              style={{ fontSize: "24px", lineHeight: "32px" }}
            >
              Personalized Skincare Routine
            </h2>

            {isLoadingRoutine && (
              <p className="text-sm text-[#6B7280] mb-4 font-['Manrope',sans-serif]">
                Generating your personalized routine...
              </p>
            )}

            {routineError && !routine && (
              <p className="text-sm text-red-500 mb-4 font-['Manrope',sans-serif]">
                {routineError}
              </p>
            )}

            {routine && (
              <div className="space-y-6">
                {routine.summary && (
                  <p className="text-sm text-[#4B5563] mb-2 max-w-3xl font-['Manrope',sans-serif]">
                    {routine.summary}
                  </p>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {(["morning", "evening", "weekly"] as RoutineSectionId[]).map(
                    (sectionId) => {
                      const section = routine.sections.find(
                        (s) => s.id === sectionId
                      );
                      if (!section) return null;

                      const icon =
                        sectionId === "morning"
                          ? "☀️"
                          : sectionId === "evening"
                          ? "🌙"
                          : "✨";

                      const subtitle =
                        sectionId === "morning"
                          ? "Start your day with light, protective steps."
                          : sectionId === "evening"
                          ? "Support repair and renewal while you sleep."
                          : "Targeted boosts to support your weekly routine.";

                      return (
                        <div
                          key={section.id}
                          className="bg-white rounded-2xl border border-[#E5E5E5] p-6 shadow-sm flex flex-col"
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B4A] to-[#FFA94D] flex items-center justify-center">
                              <span className="text-xl text-white">{icon}</span>
                            </div>
                            <div>
                              <h3 className="text-[#18212D] font-['Manrope',sans-serif] font-semibold">
                                {section.title}
                              </h3>
                              <p className="text-xs text-[#6B7280] font-['Manrope',sans-serif]">
                                {subtitle}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {section.steps.map((step) => (
                              <div
                                key={step.id}
                                className="bg-[#F5F5F5] rounded-xl p-4"
                              >
                                <p className="text-sm font-medium text-[#111827] font-['Manrope',sans-serif]">
                                  {step.title}
                                </p>
                                {step.subtitle && (
                                  <p className="text-xs text-[#6B7280] mt-1 font-['Manrope',sans-serif]">
                                    {step.subtitle}
                                  </p>
                                )}
                              </div>
                            ))}

                            {section.steps.length === 0 && (
                              <p className="text-xs text-[#9CA3AF] font-['Manrope',sans-serif]">
                                This section will be updated as we learn more
                                about your skin.
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>

                {routine.disclaimer && (
                  <p className="mt-4 mb-10 text-[10px] italic text-[#9CA3AF] max-w-3xl font-['Manrope',sans-serif]">
                    * {routine.disclaimer}
                  </p>
                )}
              </div>
            )}

            {!routine && !isLoadingRoutine && !routineError && (
              <p className="text-sm text-[#9CA3AF] font-['Manrope',sans-serif]">
                We&apos;ll generate a personalized routine right after your next
                scan.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modals fuera del wrapper PDF */}
      <MetricDetailModal
        metric={selectedMetric}
        onClose={() => setSelectedMetric(null)}
        imageUrl={capturedImage || exampleImage}
        hautFaceImageUrl={hautFaceImageUrl}
        hautLinesMaskUrl={hautLinesMaskUrl}
        hautPoresMaskUrl={hautPoresMaskUrl}
        hautPigmentationMaskUrl={hautPigmentationMaskUrl}
        hautAcneMaskUrl={hautAcneMaskUrl}
        hautRednessMaskUrl={hautRednessMaskUrl}
        hautSaggingMaskUrl={hautSaggingMaskUrl}
        hautDarkCirclesMaskUrl={hautDarkCirclesMaskUrl}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        defaultEmail={userEmail}
        reportUrl={window.location.href}
      />
    </>
  );
}
