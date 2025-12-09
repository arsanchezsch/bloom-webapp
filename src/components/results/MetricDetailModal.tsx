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

    // TEMP: debug de Acne para ver el raw de Haut
    if (metric.name.toLowerCase().includes("acne")) {
      // 👇 Esto es lo que necesitamos ver
      console.log("[Bloom DEBUG] ACNE metric.raw:", metric.raw);
    }

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

  // 👉 Detectar si realmente hay "daño" o no en esta métrica
  const hasDamage = (() => {
    const score =
      typeof metric.score === "number" && !Number.isNaN(metric.score)
        ? metric.score
        : 0;

    const status = (metric.status || "").toString().toLowerCase();
    const looksHealthy =
      status.includes("good") ||
      status.includes("healthy") ||
      status.includes("normal") ||
      status.includes("low");

    // Si el status es claramente sano y el score es alto, consideramos que NO hay daño
    if (looksHealthy && score >= 85) return false;

    // Si el score es muy alto, también asumimos que no hay daño
    if (score >= 95) return false;

    // En el resto de casos, asumimos que sí hay daño
    return true;
  })();

  // ¿Tenemos máscara real para esta métrica?
  const hasRealMask =
    (isLinesMetric && !!hautLinesMaskUrl) ||
    (isPoresMetric && !!hautPoresMaskUrl) ||
    (isPigmentationMetric && !!hautPigmentationMaskUrl) ||
    (isAcneMetric && !!hautAcneMaskUrl) ||
    (isRednessMetric && !!hautRednessMaskUrl) ||
    (isSaggingMetric && !!hautSaggingMaskUrl) ||
    (isDarkCirclesMetric && !!hautDarkCirclesMaskUrl);

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
              {isLinesMetric && hautLinesMaskUrl && hasDamage && (
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
              {isPoresMetric && hautPoresMaskUrl && hasDamage && (
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
              {isPigmentationMetric &&
                hautPigmentationMaskUrl &&
                hasDamage && (
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
              {isAcneMetric && hautAcneMaskUrl && hasDamage && (
                <img
                  src={hautAcneMaskUrl}
                  alt="Acne overlay"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none mix-blend-screen opacity-70"
                  style={{
                    transform: `translate(${HAUT_MASK_OFFSET.xPercent}%, ${HAUT_MASK_OFFSET.yPercent}%)`,
                    transformOrigin: "center center",
                    filter:
                      "brightness(1.05) contrast(1.1) saturate(1.1)",
                  }}
                />
              )}

              {/* Redness */}
              {isRednessMetric && hautRednessMaskUrl && hasDamage && (
                <img
                  src={hautRednessMaskUrl}
                  alt="Redness overlay"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none mix-blend-screen opacity-65"
                  style={{
                    transform: `translate(${HAUT_MASK_OFFSET.xPercent}%, ${HAUT_MASK_OFFSET.yPercent}%)`,
                    transformOrigin: "center center",
                    filter:
                      "brightness(1.0) contrast(1.15) saturate(1.1)",
                  }}
                />
              )}

              {/* Sagging */}
              {isSaggingMetric && hautSaggingMaskUrl && hasDamage && (
                <img
                  src={hautSaggingMaskUrl}
                  alt="Sagging overlay"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none mix-blend-screen opacity-70"
                  style={{
                    transform: `translate(${HAUT_MASK_OFFSET.xPercent}%, ${HAUT_MASK_OFFSET.yPercent}%)`,
                    transformOrigin: "center center",
                    filter:
                      "brightness(1.0) contrast(1.15) saturate(1.05)",
                  }}
                />
              )}

              {/* Dark Circles */}
              {isDarkCirclesMetric &&
                hautDarkCirclesMaskUrl &&
                hasDamage && (
                  <img
                    src={hautDarkCirclesMaskUrl}
                    alt="Dark circles overlay"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none mix-blend-screen opacity-75"
                    style={{
                      transform: `translate(${HAUT_MASK_OFFSET.xPercent}%, ${HAUT_MASK_OFFSET.yPercent}%)`,
                      transformOrigin: "center center",
                      filter:
                        "brightness(1.05) contrast(1.2) saturate(1.15)",
                    }}
                  />
                )}
              {/* ❌ No hay overlays fake, solo máscaras reales si existen */}
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

          {/* Nota bajo la imagen / estado de la métrica */}
          {hasDamage ? (
            hasRealMask ? (
              <div className="mt-1 p-3 bg-[#FFF5F3] rounded-xl">
                <p className="text-xs text-[#FF6B4A] font-['Manrope',sans-serif] text-center">
                  ✨ Highlighted areas show detected{" "}
                  {metric.name.toLowerCase()}.
                </p>
              </div>
            ) : (
              <div className="mt-1 p-3 bg-[#FFF5F3] rounded-xl">
                <p className="text-xs text-[#FF6B4A] font-['Manrope',sans-serif] text-center">
                  ✨ We detected some concerns related to{" "}
                  {metric.name.toLowerCase()} in this analysis, even if no
                  highlight overlay is shown.
                </p>
              </div>
            )
          ) : (
            <div className="mt-1 p-3 bg-[#EFF6FF] rounded-xl border border-[#BFDBFE]">
              <p className="text-xs text-[#1D4ED8] font-['Manrope',sans-serif] text-center">
                ✅ No visible concerns were detected for{" "}
                {metric.name.toLowerCase()} in your latest analysis.
              </p>
            </div>
          )}

          {/* Biomarkers */}
          {metric.name.toLowerCase().includes("acne") ? (
            <div className="mt-2">
              <h3
                className="text-[#18212D] mb-3 font-['Manrope',sans-serif]"
                style={{ fontSize: "18px" }}
              >
                Key Biomarkers
              </h3>

              {(() => {
                const acneRaw: any = metric.raw ?? {};

                // Intentamos varios nombres posibles para el número de granos
                const pimplesCountRaw =
                  acneRaw?.pimples?.count ??
                  acneRaw?.pimples_count ??
                  acneRaw?.pimples_number ??
                  acneRaw?.lesions_count ??
                  acneRaw?.inflamed_regions ??
                  undefined;

                const pimplesCount =
                  pimplesCountRaw !== undefined
                    ? pimplesCountRaw
                    : metric.biomarkers?.[0]?.value ?? "—";

                // Intentamos varios nombres posibles para la densidad / inflamación
                const densityRaw =
                  acneRaw?.pimples?.density ??
                  acneRaw?.acne_inflammation?.density ??
                  acneRaw?.density ??
                  undefined;

                let densityDisplay: string;
                if (typeof densityRaw === "number") {
                  densityDisplay = `${Math.round(densityRaw)}‰`;
                } else if (metric.biomarkers?.[1]?.value != null) {
                  densityDisplay = String(metric.biomarkers[1].value);
                } else {
                  densityDisplay = "—";
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Number of pimples */}
                    <div className="bg-white rounded-2xl border border-[#E5E5E5] p-4 shadow-sm">
                      <div className="text-xs text-[#9CA3AF] mb-1 font-['Manrope',sans-serif]">
                        Number of pimples
                      </div>
                      <div
                        className="text-[#18212D] font-['Manrope',sans-serif]"
                        style={{ fontSize: "18px", fontWeight: 600 }}
                      >
                        {pimplesCount}
                      </div>
                    </div>

                    {/* Density / Acne inflammation */}
                    <div className="bg-white rounded-2xl border border-[#E5E5E5] p-4 shadow-sm">
                      <div className="text-xs text-[#9CA3AF] mb-1 font-['Manrope',sans-serif]">
                        Acne inflammation (density)
                      </div>
                      <div
                        className="text-[#18212D] font-['Manrope',sans-serif]"
                        style={{ fontSize: "18px", fontWeight: 600 }}
                      >
                        {densityDisplay}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            metric.biomarkers &&
            metric.biomarkers.length > 0 && (
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
                      <div className="text-xs text-[#9CA3AF] mb-1 font-['Manrope',sans-serif]">
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
            )
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
