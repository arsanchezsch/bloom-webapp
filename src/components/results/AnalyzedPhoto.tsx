// ============================================
// ANALYZED PHOTO COMPONENT
// FINAL + PIGMENTATION + DARK CIRCLES FIX (front/left/right priority)
//
// FIX "images look a bit dull":
// - Apply subtle global photo boost filter to BOTH aligned_face + base photo
// - Use a darker background behind images to avoid "wash" perception
//
// FIX Pigmentation slight drift:
// - Only apply HAUT_MASK_OFFSET for pigmentation when using MASK-ONLY fallback
// - If aligned_face exists => NO offset (pixel-perfect)
// ============================================

import { useMemo, useState } from "react";

interface AnalyzedPhotoProps {
  imageUrl: string;

  hautFaceImageUrl?: string;

  hautLinesMaskUrl?: string;
  hautPoresMaskUrl?: string;
  hautPigmentationMaskUrl?: string;
  hautAcneMaskUrl?: string;
  hautRednessMaskUrl?: string;
  hautSaggingMaskUrl?: string;
  hautDarkCirclesMaskUrl?: string;

  hautLinesAlignedFaceUrl?: string;
  hautPoresAlignedFaceUrl?: string;
  hautPigmentationAlignedFaceUrl?: string;
  hautAcneAlignedFaceUrl?: string;
  hautRednessAlignedFaceUrl?: string;
  hautSaggingAlignedFaceUrl?: string;
  hautDarkCirclesAlignedFaceUrl?: string;

  hautPigmentationMaskUrlFront?: string;
  hautPigmentationMaskUrlLeft?: string;
  hautPigmentationMaskUrlRight?: string;

  hautPigmentationAlignedFaceUrlFront?: string;
  hautPigmentationAlignedFaceUrlLeft?: string;
  hautPigmentationAlignedFaceUrlRight?: string;

  hautDarkCirclesMaskUrlFront?: string;
  hautDarkCirclesMaskUrlLeft?: string;
  hautDarkCirclesMaskUrlRight?: string;

  hautDarkCirclesAlignedFaceUrlFront?: string;
  hautDarkCirclesAlignedFaceUrlLeft?: string;
  hautDarkCirclesAlignedFaceUrlRight?: string;
}

type MetricHighlight =
  | "acne"
  | "pores"
  | "pigmentation"
  | "redness"
  | "sagging"
  | "dark_circles"
  | "lines";

const METRIC_OPTIONS: Array<{ value: MetricHighlight; label: string }> = [
  { value: "acne", label: "Acne" },
  { value: "pores", label: "Pores" },
  { value: "pigmentation", label: "Pigmentation" },
  { value: "redness", label: "Redness" },
  { value: "sagging", label: "Sagging" },
  { value: "dark_circles", label: "Dark Circles" },
  { value: "lines", label: "Lines & Wrinkles" },
];

const HAUT_MASK_OFFSET = {
  xPercent: -1.5,
  yPercent: -1.0,
};

export function AnalyzedPhoto({
  imageUrl,
  hautFaceImageUrl,

  hautLinesMaskUrl,
  hautPoresMaskUrl,
  hautPigmentationMaskUrl,
  hautAcneMaskUrl,
  hautRednessMaskUrl,
  hautSaggingMaskUrl,
  hautDarkCirclesMaskUrl,

  hautLinesAlignedFaceUrl,
  hautPoresAlignedFaceUrl,
  hautPigmentationAlignedFaceUrl,
  hautAcneAlignedFaceUrl,
  hautRednessAlignedFaceUrl,
  hautSaggingAlignedFaceUrl,
  hautDarkCirclesAlignedFaceUrl,

  hautPigmentationMaskUrlFront,
  hautPigmentationMaskUrlLeft,
  hautPigmentationMaskUrlRight,
  hautPigmentationAlignedFaceUrlFront,
  hautPigmentationAlignedFaceUrlLeft,
  hautPigmentationAlignedFaceUrlRight,

  hautDarkCirclesMaskUrlFront,
  hautDarkCirclesMaskUrlLeft,
  hautDarkCirclesMaskUrlRight,
  hautDarkCirclesAlignedFaceUrlFront,
  hautDarkCirclesAlignedFaceUrlLeft,
  hautDarkCirclesAlignedFaceUrlRight,
}: AnalyzedPhotoProps) {
  const [selectedMetric, setSelectedMetric] =
    useState<MetricHighlight | undefined>("acne");

  // ✅ Subtle global photo boost to match Haut's "pop"
  const photoBoostFilter = "brightness(1.04) contrast(1.08) saturate(1.08)";
  // ✅ Background behind the image (black makes colors feel richer)
  const imageBg = "#000"; // try "#FFF" if you prefer a lighter look

  // ✅ helper: best pigmentation urls by priority
  const bestPigmentationAlignedFace =
    hautPigmentationAlignedFaceUrlFront ||
    hautPigmentationAlignedFaceUrlLeft ||
    hautPigmentationAlignedFaceUrlRight ||
    hautPigmentationAlignedFaceUrl;

  const bestPigmentationMaskOnly =
    hautPigmentationMaskUrlFront ||
    hautPigmentationMaskUrlLeft ||
    hautPigmentationMaskUrlRight ||
    hautPigmentationMaskUrl;

  // ✅ helper: best dark circles urls by priority
  const bestDarkCirclesAlignedFace =
    hautDarkCirclesAlignedFaceUrlFront ||
    hautDarkCirclesAlignedFaceUrlLeft ||
    hautDarkCirclesAlignedFaceUrlRight ||
    hautDarkCirclesAlignedFaceUrl;

  const bestDarkCirclesMaskOnly =
    hautDarkCirclesMaskUrlFront ||
    hautDarkCirclesMaskUrlLeft ||
    hautDarkCirclesMaskUrlRight ||
    hautDarkCirclesMaskUrl;

  const selectedMaskUrl = useMemo(() => {
    switch (selectedMetric) {
      case "lines":
        return hautLinesMaskUrl;
      case "pores":
        return hautPoresMaskUrl;
      case "pigmentation":
        return bestPigmentationMaskOnly;
      case "acne":
        return hautAcneMaskUrl;
      case "redness":
        return hautRednessMaskUrl;
      case "sagging":
        return hautSaggingMaskUrl;
      case "dark_circles":
        return bestDarkCirclesMaskOnly;
      default:
        return undefined;
    }
  }, [
    selectedMetric,
    hautLinesMaskUrl,
    hautPoresMaskUrl,
    bestPigmentationMaskOnly,
    hautAcneMaskUrl,
    hautRednessMaskUrl,
    hautSaggingMaskUrl,
    bestDarkCirclesMaskOnly,
  ]);

  const selectedAlignedFaceUrl = useMemo(() => {
    switch (selectedMetric) {
      case "lines":
        return hautLinesAlignedFaceUrl;
      case "pores":
        return hautPoresAlignedFaceUrl;
      case "pigmentation":
        return bestPigmentationAlignedFace;
      case "acne":
        return hautAcneAlignedFaceUrl;
      case "redness":
        return hautRednessAlignedFaceUrl;
      case "sagging":
        return hautSaggingAlignedFaceUrl;
      case "dark_circles":
        return bestDarkCirclesAlignedFace;
      default:
        return undefined;
    }
  }, [
    selectedMetric,
    hautLinesAlignedFaceUrl,
    hautPoresAlignedFaceUrl,
    bestPigmentationAlignedFace,
    hautAcneAlignedFaceUrl,
    hautRednessAlignedFaceUrl,
    hautSaggingAlignedFaceUrl,
    bestDarkCirclesAlignedFace,
  ]);

  const firstRow = METRIC_OPTIONS.slice(0, 4);
  const secondRow = METRIC_OPTIONS.slice(4);

  const basePhoto = hautFaceImageUrl || imageUrl;

  const useAlignedFaceDirectly = !!selectedMetric && !!selectedAlignedFaceUrl;

  const showNoConcernsText =
    selectedMetric !== undefined && !selectedAlignedFaceUrl && !selectedMaskUrl;

  // ✅ FIX: pigmentation offset ONLY when it's mask-only fallback (no aligned_face)
  const overlayTransform =
    selectedMetric === "pigmentation" && !selectedAlignedFaceUrl
      ? `translate(${HAUT_MASK_OFFSET.xPercent}%, ${HAUT_MASK_OFFSET.yPercent}%)`
      : "translate(0%, 0%)";

  const overlayOpacity =
    selectedMetric === "lines"
      ? 0.65
      : selectedMetric === "redness"
      ? 0.55
      : selectedMetric === "pores"
      ? 0.6
      : selectedMetric === "sagging"
      ? 0.65
      : selectedMetric === "dark_circles"
      ? 0.62
      : selectedMetric === "acne"
      ? 0.7
      : selectedMetric === "pigmentation"
      ? 0.8
      : 0.75;

  const overlayFilter =
    selectedMetric === "lines"
      ? "brightness(1.05) contrast(1.25) saturate(1.15)"
      : selectedMetric === "redness"
      ? "brightness(1.02) contrast(1.28) saturate(1.22)"
      : selectedMetric === "pores"
      ? "brightness(1.03) contrast(1.25) saturate(1.18)"
      : selectedMetric === "sagging"
      ? "brightness(1.03) contrast(1.22) saturate(1.12)"
      : selectedMetric === "dark_circles"
      ? "brightness(1.02) contrast(1.22) saturate(1.08)"
      : selectedMetric === "pigmentation"
      ? "brightness(1.05) contrast(1.15) saturate(1.2)"
      : selectedMetric === "acne"
      ? "brightness(1.05) contrast(1.1) saturate(1.1)"
      : "brightness(1.05) contrast(1.15) saturate(1.15) blur(0.4px)";

  return (
    <div className="bg-white rounded-3xl border border-[#E5E5E5] shadow-sm p-6">
      {/* IMAGE */}
      <div className="flex justify-center mb-2">
        <div
          className="relative rounded-2xl overflow-hidden border-2 border-[#E5E5E5] w-full"
          style={{ maxWidth: "380px", aspectRatio: "4 / 5", background: imageBg }}
        >
          {useAlignedFaceDirectly ? (
            <img
              src={selectedAlignedFaceUrl}
              alt="Analyzed face"
              className="w-full h-full"
              style={{
                background: imageBg,
                objectFit: "cover",
                filter: photoBoostFilter,
              }}
              draggable={false}
            />
          ) : (
            <>
              <img
                src={basePhoto}
                alt="Analyzed face"
                className="w-full h-full"
                style={{
                  background: imageBg,
                  objectFit: "cover",
                  filter: photoBoostFilter,
                }}
                draggable={false}
              />

              {selectedMetric && selectedMaskUrl && (
                <img
                  src={selectedMaskUrl}
                  alt="Mask overlay"
                  className="absolute inset-0 w-full h-full pointer-events-none mix-blend-screen"
                  style={{
                    objectFit: "cover",
                    transform: overlayTransform,
                    transformOrigin: "center center",
                    opacity: overlayOpacity,
                    filter: overlayFilter,
                  }}
                  draggable={false}
                />
              )}
            </>
          )}
        </div>
      </div>

      {showNoConcernsText && (
        <p className="mt-1 mb-3 text-center text-[10px] leading-[12px] text-[#9CA3AF] font-['Manrope',sans-serif]">
          No visible concerns were detected in this area during the analysis
        </p>
      )}

      {/* METRIC SELECTOR */}
      <div className="pt-1">
        <div className="flex justify-center gap-2 mb-2">
          {firstRow.map((option) => {
            const active = selectedMetric === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setSelectedMetric(option.value)}
                className={`px-4 py-2 rounded-full text-xs font-['Manrope',sans-serif] transition-all ${
                  active
                    ? "bg-gradient-to-r from-[#FF6B4A] to-[#FFA94D] text-white shadow-md"
                    : "bg-white border border-[#E5E5E5] text-[#6B7280] hover:border-[#FF6B4A] hover:text-[#FF6B4A]"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="flex justify-center gap-2">
          {secondRow.map((option) => {
            const active = selectedMetric === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setSelectedMetric(option.value)}
                className={`px-4 py-2 rounded-full text-xs font-['Manrope',sans-serif] transition-all ${
                  active
                    ? "bg-gradient-to-r from-[#FF6B4A] to-[#FFA94D] text-white shadow-md"
                    : "bg-white border border-[#E5E5E5] text-[#6B7280] hover:border-[#FF6B4A] hover:text-[#FF6B4A]"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
