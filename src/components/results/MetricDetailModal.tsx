// ============================================
// METRIC DETAIL MODAL COMPONENT
// Detailed view of a specific skin metric
// ============================================

import { X } from "lucide-react";
import type { SkinMetric } from "../../types";
import { getStatusBadge, getScoreColor } from "../../utils/helpers";

type MetricHighlight =
  | "acne"
  | "pores"
  | "pigmentation"
  | "redness"
  | "sagging"
  | "dark_circles"
  | "lines";

// Offset global para TODAS las máscaras de Haut (en %)
const HAUT_MASK_OFFSET = {
  xPercent: -1.5,
  yPercent: -1.0,
};

interface MetricDetailModalProps {
  metric: SkinMetric | null;
  onClose: () => void;
  imageUrl: string;
  // Imagen de cara generada por Haut (anonymised / aligned_face)
  hautFaceImageUrl?: string;
  // Máscara de líneas de Haut
  hautLinesMaskUrl?: string;
  // Máscara de poros de Haut
  hautPoresMaskUrl?: string;
  // Máscara de pigmentación de Haut
  hautPigmentationMaskUrl?: string;
  // Máscara de acné (breakouts) de Haut
  hautAcneMaskUrl?: string;
  // Máscara de redness de Haut
  hautRednessMaskUrl?: string;
  // Máscara de sagging de Haut
  hautSaggingMaskUrl?: string;
  // Máscara de dark circles de Haut
  hautDarkCirclesMaskUrl?: string;
}

export function MetricDetailModal({
  metric,
  onClose,
  imageUrl,
  hautFaceImageUrl,
  hautLinesMaskUrl,
  hautPoresMaskUrl,
  hautPigmentationMaskUrl,
  hautAcneMaskUrl,
  hautRednessMaskUrl,
  hautSaggingMaskUrl,
  hautDarkCirclesMaskUrl,
}: MetricDetailModalProps) {
  if (!metric) return null;

  // Map metric names to highlight types
  const getMetricHighlight = (metricName: string): MetricHighlight | null => {
    const name = metricName.toLowerCase();
    if (name.includes("acne") || name.includes("breakout")) return "acne";
    if (name.includes("pore")) return "pores";
    if (name.includes("pigment")) return "pigmentation";
    if (name.includes("redness") || name.includes("erythema")) return "redness";
    if (name.includes("sagging")) return "sagging";
    if (name.includes("dark circle")) return "dark_circles";
    if (name.includes("line") || name.includes("wrinkle")) return "lines";
    return null;
  };

  const highlightType = getMetricHighlight(metric.name);
  const isLinesMetric = highlightType === "lines";
  const isPoresMetric = highlightType === "pores";
  const isPigmentationMetric = highlightType === "pigmentation";
  const isAcneMetric = highlightType === "acne";
  const isRednessMetric = highlightType === "redness";
  const isSaggingMetric = highlightType === "sagging";
  const isDarkCirclesMetric = highlightType === "dark_circles";

  const getHighlightColor = (type: MetricHighlight): string => {
    switch (type) {
      case "acne":
        return "rgba(255, 107, 74, 0.35)";
      case "pores":
        return "rgba(255, 169, 77, 0.35)";
      case "pigmentation":
        return "rgba(255, 193, 7, 0.35)";
      case "redness":
        return "rgba(239, 68, 68, 0.35)";
      case "sagging":
        return "rgba(59, 130, 246, 0.35)";
      case "dark_circles":
        return "rgba(168, 85, 247, 0.35)";
      case "lines":
        return "rgba(107, 114, 128, 0.35)";
    }
  };

  const hasRealMask =
    (isLinesMetric && !!hautLinesMaskUrl) ||
    (isPoresMetric && !!hautPoresMaskUrl) ||
    (isPigmentationMetric && !!hautPigmentationMaskUrl) ||
    (isAcneMetric && !!hautAcneMaskUrl) ||
    (isRednessMetric && !!hautRednessMaskUrl) ||
    (isSaggingMetric && !!hautSaggingMaskUrl) ||
    (isDarkCirclesMetric && !!hautDarkCirclesMaskUrl);

  const renderHighlightAreas = () => {
    if (!highlightType) return null;

    // Si tenemos máscara real de Haut no pintamos overlays fake
    if (hasRealMask) return null;

    const overlays: Record<
      MetricHighlight,
      Array<{ top: string; left: string; width: string; height: string }>
    > = {
      acne: [
        { top: "25%", left: "30%", width: "15%", height: "8%" },
        { top: "40%", left: "20%", width: "12%", height: "10%" },
        { top: "42%", left: "68%", width: "10%", height: "8%" },
        { top: "55%", left: "42%", width: "8%", height: "6%" },
      ],
      pores: [
        { top: "45%", left: "40%", width: "20%", height: "15%" },
        { top: "38%", left: "25%", width: "15%", height: "12%" },
        { top: "38%", left: "60%", width: "15%", height: "12%" },
      ],
      pigmentation: [
        { top: "40%", left: "22%", width: "18%", height: "20%" },
        { top: "40%", left: "60%", width: "18%", height: "20%" },
        { top: "25%", left: "35%", width: "30%", height: "10%" },
      ],
      redness: [
        { top: "42%", left: "24%", width: "16%", height: "18%" },
        { top: "42%", left: "60%", width: "16%", height: "18%" },
        { top: "48%", left: "42%", width: "16%", height: "12%" },
      ],
      sagging: [
        { top: "52%", left: "35%", width: "12%", height: "12%" },
        { top: "52%", left: "53%", width: "12%", height: "12%" },
        { top: "62%", left: "38%", width: "10%", height: "12%" },
        { top: "62%", left: "50%", width: "10%", height: "12%" },
      ],
      dark_circles: [
        { top: "38%", left: "30%", width: "16%", height: "10%" },
        { top: "38%", left: "54%", width: "16%", height: "10%" },
      ],
      lines: [
        { top: "22%", left: "35%", width: "30%", height: "5%" },
        { top: "52%", left: "35%", width: "12%", height: "8%" },
        { top: "52%", left: "53%", width: "12%", height: "8%" },
        { top: "36%", left: "32%", width: "8%", height: "4%" },
        { top: "36%", left: "60%", width: "8%", height: "4%" },
      ],
    };

    const areas = overlays[highlightType] || [];
    const color = getHighlightColor(highlightType);

    return areas.map((area, idx) => (
      <div
        key={idx}
        className="absolute rounded-full animate-pulse"
        style={{
          top: area.top,
          left: area.left,
          width: area.width,
          height: area.height,
          backgroundColor: color,
          border: `2px solid ${color.replace("0.35", "0.8")}`,
          boxShadow: `0 0 20px ${color}`,
          pointerEvents: "none",
        }}
      />
    ));
  };

  // ✅ Siempre misma foto base (alineada si existe)
  const basePhoto = hautFaceImageUrl || imageUrl;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-[#E5E5E5] p-6 sm:p-8 max-w-5xl w-[96vw] shadow-2xl flex flex-col sm:flex-row gap-6 sm:gap-10 overflow-y-auto"
        style={{ maxHeight: "92vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Columna izquierda: foto */}
        <div className="flex justify-center sm:justify-start sm:w-[46%]">
          {basePhoto && (
            <div
              className="relative rounded-3xl overflow-hidden border border-[#E5E5E5] bg-[#F5F5F5] w-full"
              style={{
                maxWidth: "420px",
                aspectRatio: "4 / 5",
              }}
            >
              {/* Cara base */}
              <img
                src={basePhoto}
                alt="Skin Analysis"
                className="w-full h-full object-contain"
                style={{ background: "#F5F5F5" }}
              />

              {/* Lines */}
              {isLinesMetric && hautLinesMaskUrl && (
                <img
                  src={hautLinesMaskUrl}
                  alt="Lines overlay"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none mix-blend-screen opacity-35"
                  style={{
                    transform: `translate(${HAUT_MASK_OFFSET.xPercent}%, ${HAUT_MASK_OFFSET.yPercent}%)`,
                    transformOrigin: "center center",
                    filter:
                      "brightness(0.9) contrast(1.15) saturate(1.2) blur(0.5px)",
                  }}
                />
              )}

              {/* Pores */}
              {isPoresMetric && hautPoresMaskUrl && (
                <img
                  src={hautPoresMaskUrl}
                  alt="Pores overlay"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none mix-blend-screen opacity-40"
                  style={{
                    transform: `translate(${HAUT_MASK_OFFSET.xPercent}%, ${HAUT_MASK_OFFSET.yPercent}%)`,
                    transformOrigin: "center center",
                    filter:
                      "brightness(0.95) contrast(1.1) saturate(1.1) blur(0.4px)",
                  }}
                />
              )}

              {/* Pigmentation */}
              {isPigmentationMetric && hautPigmentationMaskUrl && (
                <img
                  src={hautPigmentationMaskUrl}
                  alt="Pigmentation overlay"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none mix-blend-screen opacity-80"
                  style={{
                    transform: `translate(${HAUT_MASK_OFFSET.xPercent}%, ${HAUT_MASK_OFFSET.yPercent}%)`,
                    transformOrigin: "center center",
                    filter:
                      "brightness(1.05) contrast(1.15) saturate(1.2)",
                  }}
                />
              )}

              {/* Acne / Breakouts */}
              {isAcneMetric && hautAcneMaskUrl && (
                <img
                  src={hautAcneMaskUrl}
                  alt="Acne overlay"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none mix-blend-screen opacity-70"
                  style={{
                    transform: `translate(${HAUT_MASK_OFFSET.xPercent}%, ${HAUT_MASK_OFFSET.yPercent}%)`,
                    transformOrigin: "center center",
                    filter: "brightness(1.05) contrast(1.1) saturate(1.1)",
                  }}
                />
              )}

              {/* Redness */}
              {isRednessMetric && hautRednessMaskUrl && (
                <img
                  src={hautRednessMaskUrl}
                  alt="Redness overlay"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none mix-blend-screen opacity-65"
                  style={{
                    transform: `translate(${HAUT_MASK_OFFSET.xPercent}%, ${HAUT_MASK_OFFSET.yPercent}%)`,
                    transformOrigin: "center center",
                    filter: "brightness(1.0) contrast(1.15) saturate(1.1)",
                  }}
                />
              )}

              {/* Sagging */}
              {isSaggingMetric && hautSaggingMaskUrl && (
                <img
                  src={hautSaggingMaskUrl}
                  alt="Sagging overlay"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none mix-blend-screen opacity-70"
                  style={{
                    transform: `translate(${HAUT_MASK_OFFSET.xPercent}%, ${HAUT_MASK_OFFSET.yPercent}%)`,
                    transformOrigin: "center center",
                    filter: "brightness(1.0) contrast(1.15) saturate(1.05)",
                  }}
                />
              )}

              {/* Dark Circles */}
              {isDarkCirclesMetric && hautDarkCirclesMaskUrl && (
                <img
                  src={hautDarkCirclesMaskUrl}
                  alt="Dark circles overlay"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none mix-blend-screen opacity-75"
                  style={{
                    transform: `translate(${HAUT_MASK_OFFSET.xPercent}%, ${HAUT_MASK_OFFSET.yPercent}%)`,
                    transformOrigin: "center center",
                    filter: "brightness(1.05) contrast(1.2) saturate(1.15)",
                  }}
                />
              )}

              {/* Overlays fake (fallback) */}
              {renderHighlightAreas()}
            </div>
          )}
        </div>

        {/* Columna derecha: info */}
        <div className="flex-1 flex flex-col gap-5 sm:pr-2">
          {/* Header: título + score + close */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                className="text-[#18212D] font-['Manrope',sans-serif]"
                style={{ fontSize: "26px", lineHeight: "32px" }}
              >
                {metric.name}
              </h2>
            </div>

            <div className="flex items-start gap-4">
              {/* Score */}
              <div className="text-right">
                <div
                  className="font-['Manrope',sans-serif]"
                  style={{
                    fontSize: "28px",
                    lineHeight: "32px",
                    color: getScoreColor(metric.score),
                  }}
                >
                  {metric.score}
                </div>
                <div className="text-[11px] text-[#9CA3AF] font-['Manrope',sans-serif]">
                  / 100
                </div>
              </div>

              {/* Botón cerrar */}
              <button
                onClick={onClose}
                className="text-[#6B7280] hover:text-[#18212D] ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <div
              className={`inline-flex items-center px-3 py-1.5 rounded-full border text-xs font-['Manrope',sans-serif] ${getStatusBadge(
                metric.status
              )}`}
            >
              {metric.status}
            </div>
          </div>

          {/* Descripción */}
          <p className="text-[#6B7280] font-['Manrope',sans-serif] text-sm">
            {metric.description}
          </p>

          {/* Nota bajo la imagen */}
          <div className="mt-1 p-3 bg-[#FFF5F3] rounded-xl">
            <p className="text-xs text-[#FF6B4A] font-['Manrope',sans-serif] text-center">
              ✨ Highlighted areas show detected {metric.name.toLowerCase()}
            </p>
          </div>

          {/* Biomarkers */}
          {metric.biomarkers && metric.biomarkers.length > 0 && (
            <div className="mt-2">
              <h3
                className="text-[#18212D] mb-3 font-['Manrope',sans-serif]"
                style={{ fontSize: "18px" }}
              >
                Key Biomarkers
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {metric.biomarkers.map((bio, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border border-[#E5E5E5] p-4 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="text-xs text-[#9CA3AF] font-['Manrope',sans-serif] mb-1">
                      {bio.label}
                    </div>
                    <div
                      className="text-[#18212D] font-['Manrope',sans-serif]"
                      style={{ fontSize: "18px", fontWeight: 600 }}
                    >
                      {bio.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendation */}
          <div className="bg-[#F5F5F5] rounded-xl p-4 mt-2">
            <div className="text-[#18212D] mb-2 font-['Manrope',sans-serif] text-sm">
              Recommendation
            </div>
            <p className="text-[#6B7280] font-['Manrope',sans-serif] text-sm">
              {metric.recommendation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
