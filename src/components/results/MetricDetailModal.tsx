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
// (En acne/pores/sagging/lines/redness/dark_circles NO aplicamos offset)
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

  // Masks legacy (fallbacks)
  hautLinesMaskUrl?: string;
  hautPoresMaskUrl?: string;
  hautPigmentationMaskUrl?: string;
  hautAcneMaskUrl?: string;
  hautRednessMaskUrl?: string;
  hautSaggingMaskUrl?: string;
  hautDarkCirclesMaskUrl?: string;
}

const pickFirst = (...vals: any[]) => vals.find((v) => v !== undefined && v !== null);

const toNumberOrUndefined = (v: any) => {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && !Number.isNaN(n) ? n : undefined;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

// ✅ percent formatter: mantiene 0% si v=0 (no lo convierte en undefined)
const formatPercent = (v: any) => {
  const n = toNumberOrUndefined(v);
  if (n === undefined) return undefined;
  if (n > 0 && n <= 1) return `${Math.round(n * 100)}%`;
  return `${Math.round(n)}%`;
};

// ✅ per-mille formatter: mantiene 0 ‰ si v=0
const formatPerMilleOrPercent = (v: any) => {
  const n = toNumberOrUndefined(v);
  if (n === undefined) return undefined;
  if (n > 0 && n <= 1) return `${Math.round(n * 100)}%`;
  return `${Math.round(n)} ‰`;
};

const formatScore = (v: any) => {
  const n = toNumberOrUndefined(v);
  if (n === undefined) return undefined;
  return `${Math.round(clamp(n, 0, 100))}`;
};

const formatGrade = (v: any) => {
  const n = toNumberOrUndefined(v);
  if (n === undefined) return undefined;
  return `${Math.round(clamp(n, 0, 5))}/5`;
};

const formatNumber = (v: any) => {
  const n = toNumberOrUndefined(v);
  if (n === undefined) return undefined;
  return `${Math.round(n)}`;
};

// ✅ Helper: suma amount dentro de areas.{zone}.amount
function sumAreasAmount(areas: any): number | undefined {
  if (!areas || typeof areas !== "object") return undefined;

  const values = Object.values(areas)
    .map((a: any) => a?.amount)
    .filter((v) => typeof v === "number" && !Number.isNaN(v));

  if (values.length === 0) return undefined;
  return values.reduce((acc, v) => acc + v, 0);
}

// Busca fallback dentro de metric.biomarkers por texto
function findFromBiomarkers(biomarkers: any[] | undefined, contains: string[]) {
  if (!biomarkers || biomarkers.length === 0) return undefined;
  const needles = contains.map((s) => s.toLowerCase());
  const hit = biomarkers.find((b) => {
    const label = String(b?.label ?? "").toLowerCase();
    return needles.some((x) => label.includes(x));
  });
  return hit?.value;
}

// Highlight type ultra-safe
function getMetricHighlightSafe(metricName: any): MetricHighlight | null {
  const name = String(metricName ?? "").toLowerCase();
  if (!name) return null;
  if (name.includes("acne") || name.includes("breakout")) return "acne";
  if (name.includes("pore")) return "pores";
  if (name.includes("pigment")) return "pigmentation";
  if (name.includes("redness") || name.includes("erythema")) return "redness";
  if (name.includes("sagging")) return "sagging";
  if (name.includes("dark circle")) return "dark_circles";
  if (name.includes("line") || name.includes("wrinkle")) return "lines";
  return null;
}

// ✅ Descriptions
function getAcneDescriptionFromScore(scoreAny: any) {
  const s = toNumberOrUndefined(scoreAny);
  const score = typeof s === "number" ? Math.round(clamp(s, 0, 100)) : undefined;
  if (score === undefined) return "";
  if (score >= 90) return "Clear skin with minimal to no visible breakouts; indicates excellent skin condition";
  if (score >= 80) return "Mild breakout presence, limited to isolated pimples and some inflammation; overall skin remains in good condition";
  if (score >= 50) return "Moderate breakout activity with a combination of inflammatory areas and pimples";
  if (score >= 30) return "Prominent breakout presence, including multiple inflamed areas and widespread pimples";
  return "Severe breakout condition with high inflammation and pimples";
}

function getPoresDescriptionFromScore(scoreAny: any) {
  const s = toNumberOrUndefined(scoreAny);
  const score = typeof s === "number" ? Math.round(clamp(s, 0, 100)) : undefined;
  if (score === undefined) return "";
  if (score >= 90) return "No visible pores";
  if (score >= 80) return "Minimal visible pores";
  if (score >= 50) return "Moderate visible pores";
  if (score >= 30) return "Numerous enlarged pores";
  return "Extensive enlarged pores";
}

function getRednessDescriptionFromScore(scoreAny: any) {
  const s = toNumberOrUndefined(scoreAny);
  const score = typeof s === "number" ? Math.round(clamp(s, 0, 100)) : undefined;
  if (score === undefined) return "";
  if (score >= 90) return "Minimal redness, barely noticeable pink tint";
  if (score >= 80) return "Light pink areas or mild flushing";
  if (score >= 50) return "Moderate redness with visible blood vessels";
  if (score >= 30) return "Significant redness with inflammation";
  return "Severe redness with pronounced inflammation";
}

function getSaggingDescriptionFromScore(scoreAny: any) {
  const s = toNumberOrUndefined(scoreAny);
  const score = typeof s === "number" ? Math.round(clamp(s, 0, 100)) : undefined;
  if (score === undefined) return "";
  if (score >= 90) return "No visible skin sagging";
  if (score >= 80) return "Mild sagging in nasolabial area or marionette lines";
  if (score >= 50) return "Moderate sagging in the cheeks or jawline with visible softening of facial contours";
  if (score >= 30) return "Pronounced sagging with deep folds and noticeable loss of definition in facial structure";
  return "Severe sagging with significant drooping, jowls, and extensive volume loss";
}

function getLinesDescriptionFromScore(scoreAny: any) {
  const s = toNumberOrUndefined(scoreAny);
  const score = typeof s === "number" ? Math.round(clamp(s, 0, 100)) : undefined;
  if (score === undefined) return "";
  if (score >= 90) return "Subtle signs of fine lines";
  if (score >= 80) return "Multiple fine lines or a few deep lines";
  if (score >= 50) return "Presence of both deep and fine lines";
  if (score >= 30) return "Presence of severe deep lines";
  return "Presence of severe deep lines";
}

// Biomarkers por métrica
function getBiomarkersForMetric(
  type: MetricHighlight | null,
  raw: any,
  biomarkers: any[] | undefined
): Array<{ label: string; value: string }> {
  if (!type) return [];
  const out: Array<{ label: string; value: string }> = [];
  const push = (label: string, value?: string) => out.push({ label, value: value ?? "—" });

  if (type === "acne") {
    const densityRaw = pickFirst(
      raw?.inflammation?.density,
      raw?.acne_inflammation?.density,
      raw?.breakouts?.inflammation?.density,
      raw?.breakouts?.acne_inflammation?.density,
      raw?.density
    );
    const densityFallback = findFromBiomarkers(biomarkers, ["density", "inflammation"]);
    const density = formatPerMilleOrPercent(densityRaw ?? densityFallback);

    const pimplesRaw = pickFirst(
      raw?.pimples?.amount,
      raw?.pimples?.count,
      raw?.pimples_count,
      raw?.pimples_number,
      raw?.lesions_count,
      raw?.breakouts?.pimples?.amount,
      raw?.breakouts?.pimples?.count,
      raw?.breakouts?.pimples_count
    );
    const pimplesFallback = findFromBiomarkers(biomarkers, [
      "number of pimples",
      "pimples",
      "pimple",
      "lesion",
      "breakout",
    ]);
    const pimples = formatNumber(pimplesRaw ?? pimplesFallback);

    push("Density", density);
    push("Number of pimples", pimples);
    return out;
  }

  if (type === "redness") {
    const irritationRaw = pickFirst(
      raw?.irritation?.score,
      raw?.irritation_score,
      raw?.redness?.irritation?.score,
      raw?.erythema?.score
    );
    const irritationFallback = findFromBiomarkers(biomarkers, ["irritation", "redness", "erythema"]);
    const irritation = formatScore(irritationRaw ?? irritationFallback);
    push("Irritation", irritation);
    return out;
  }

  if (type === "pores") {
    const poresAmountRaw = pickFirst(
      raw?.amount,
      raw?.pores_amount,
      raw?.pores?.amount,
      sumAreasAmount(raw?.areas),
      raw?.pores_count,
      raw?.number_of_pores
    );
    const poresAmountFallback = findFromBiomarkers(biomarkers, [
      "number of pores",
      "pores amount",
      "pores count",
      "pores",
    ]);
    const poresCount = formatNumber(poresAmountRaw ?? poresAmountFallback);

    const enlargedAmountRaw = pickFirst(
      raw?.enlarged_pores?.amount,
      raw?.enlarged_pores_amount,
      raw?.enlarged_pores?.count,
      sumAreasAmount(raw?.enlarged_pores?.areas),
      raw?.enlarged_pores_count,
      raw?.pores?.enlarged_count,
      raw?.pores?.enlarged?.count
    );
    const enlargedFallback = findFromBiomarkers(biomarkers, [
      "enlarged pores",
      "enlarged",
      "large pores",
    ]);
    const enlarged = formatNumber(enlargedAmountRaw ?? enlargedFallback);

    push("Number of pores", poresCount);
    push("Enlarged pores", enlarged);
    return out;
  }

  if (type === "sagging") {
    const jowlsRaw = pickFirst(raw?.jowls?.grade, raw?.jowls_grade, raw?.sagging?.jowls?.grade);
    const jowlsFallback = findFromBiomarkers(biomarkers, ["jowls"]);
    const jowls = formatGrade(jowlsRaw ?? jowlsFallback);

    const lacrimalRaw = pickFirst(
      raw?.lacrimal_grooves?.score,
      raw?.lacrimal_grooves_score,
      raw?.sagging?.lacrimal_grooves?.score,
      raw?.tear_trough?.score,
      raw?.tear_troughs?.score
    );
    const lacrimalFallback = findFromBiomarkers(biomarkers, ["lacrimal", "groove", "tear trough"]);
    const lacrimal = formatScore(lacrimalRaw ?? lacrimalFallback);

    push("Jowls", jowls);
    push("Lacrimal grooves", lacrimal);
    return out;
  }

  if (type === "lines") {
    const deepRaw = pickFirst(
      raw?.deep_lines?.score,
      raw?.deep_lines_score,
      raw?.wrinkles?.deep?.score,
      raw?.lines?.deep?.score,
      raw?.deep_wrinkles?.score
    );
    const deepFallback = findFromBiomarkers(biomarkers, ["deep line", "deep wrinkle"]);
    const deep = formatScore(deepRaw ?? deepFallback);

    const fineRaw = pickFirst(
      raw?.fine_lines?.score,
      raw?.fine_lines_score,
      raw?.wrinkles?.fine?.score,
      raw?.lines?.fine?.score,
      raw?.fine_wrinkles?.score
    );
    const fineFallback = findFromBiomarkers(biomarkers, ["fine line", "fine wrinkle"]);
    const fine = formatScore(fineRaw ?? fineFallback);

    push("Deep lines", deep);
    push("Fine lines", fine);
    return out;
  }

  // dark_circles: por ahora sin biomarkers (como lo tenías)
  return out;
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

  const metricName = String((metric as any)?.name ?? "");
  const metricStatus = String((metric as any)?.status ?? "");
  const highlightType = getMetricHighlightSafe(metricName);

  const isLinesMetric = highlightType === "lines";
  const isPoresMetric = highlightType === "pores";
  const isPigmentationMetric = highlightType === "pigmentation";
  const isAcneMetric = highlightType === "acne";
  const isRednessMetric = highlightType === "redness";
  const isSaggingMetric = highlightType === "sagging";
  const isDarkCirclesMetric = highlightType === "dark_circles";

  const hasDamage = (() => {
    const score =
      typeof (metric as any)?.score === "number" && !Number.isNaN((metric as any).score)
        ? (metric as any).score
        : 0;

    const status = metricStatus.toLowerCase();
    const looksHealthy =
      status.includes("good") ||
      status.includes("healthy") ||
      status.includes("normal") ||
      status.includes("low") ||
      status.includes("excellent") ||
      status.includes("great");

    if (looksHealthy && score >= 85) return false;
    if (score >= 95) return false;
    return true;
  })();

  // ✅ Fuente única de verdad:
  const resolvedMaskUrl: string | undefined =
    (metric as any)?.maskUrl ||
    (isPoresMetric ? hautPoresMaskUrl : undefined) ||
    (isLinesMetric ? hautLinesMaskUrl : undefined) ||
    (isPigmentationMetric ? hautPigmentationMaskUrl : undefined) ||
    (isAcneMetric ? hautAcneMaskUrl : undefined) ||
    (isRednessMetric ? hautRednessMaskUrl : undefined) ||
    (isSaggingMetric ? hautSaggingMaskUrl : undefined) ||
    (isDarkCirclesMetric ? hautDarkCirclesMaskUrl : undefined);

  const hasRealMask = !!resolvedMaskUrl;

  // ✅ Si hay máscara, basePhoto debe ser aligned_face/anonymised para 1:1
  const basePhoto = (hasRealMask ? hautFaceImageUrl : undefined) || hautFaceImageUrl || imageUrl;

  const raw = (metric as any)?.raw ?? {};
  const biomarkerCards = getBiomarkersForMetric(highlightType, raw, (metric as any)?.biomarkers);

  const computedDescription =
    highlightType === "acne"
      ? getAcneDescriptionFromScore((metric as any)?.score)
      : highlightType === "pores"
      ? getPoresDescriptionFromScore((metric as any)?.score)
      : highlightType === "redness"
      ? getRednessDescriptionFromScore((metric as any)?.score)
      : highlightType === "sagging"
      ? getSaggingDescriptionFromScore((metric as any)?.score)
      : highlightType === "lines"
      ? getLinesDescriptionFromScore((metric as any)?.score)
      : highlightType === "pigmentation"
      ? String(raw?.score_description ?? (metric as any)?.description ?? "")
      : String((metric as any)?.description ?? "");

  // ✅ 1:1 (SIN offset) para métricas que ya van perfectas con aligned_face
  const disableOffsetForMask =
    isAcneMetric ||
    isPoresMetric ||
    isSaggingMetric ||
    isLinesMetric ||
    isRednessMetric ||
    isDarkCirclesMetric; // ✅ añadido

  // ✅ Opacity / filter (lines se mantiene como lo dejamos perfecto)
  const overlayOpacity = isLinesMetric
    ? 0.75
    : isRednessMetric
    ? 0.65
    : isPigmentationMetric
    ? 0.8
    : isPoresMetric
    ? 0.75
    : isDarkCirclesMetric
    ? 0.75
    : isSaggingMetric
    ? 0.7
    : 0.7;

  const overlayFilter = isLinesMetric
    ? "brightness(1.15) contrast(1.55) saturate(1.75) drop-shadow(0 0 6px rgba(236,72,153,0.65)) drop-shadow(0 0 12px rgba(236,72,153,0.35))"
    : isPoresMetric
    ? "brightness(1.05) contrast(1.15) saturate(1.15) blur(0.4px)"
    : isPigmentationMetric
    ? "brightness(1.05) contrast(1.15) saturate(1.2)"
    : isAcneMetric
    ? "brightness(1.05) contrast(1.1) saturate(1.1)"
    : isRednessMetric
    ? "brightness(1.0) contrast(1.15) saturate(1.1)"
    : isSaggingMetric
    ? "brightness(1.0) contrast(1.15) saturate(1.05)"
    : isDarkCirclesMetric
    ? "brightness(1.05) contrast(1.2) saturate(1.15)"
    : "brightness(1.05) contrast(1.1) saturate(1.1)";

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
        {/* Columna izquierda */}
        <div className="flex justify-center sm:justify-start sm:w-[46%]">
          {basePhoto && (
            <div className="w-full" style={{ maxWidth: "420px" }}>
              <div
                className="relative rounded-3xl overflow-hidden border border-[#E5E5E5] bg-[#F5F5F5] w-full"
                style={{ aspectRatio: "4 / 5" }}
              >
                <img
                  src={basePhoto}
                  alt="Skin Analysis"
                  className="w-full h-full"
                  style={{
                    background: "#F5F5F5",
                    objectFit: hasRealMask ? "cover" : "contain",
                  }}
                  draggable={false}
                />

                {resolvedMaskUrl && hasDamage && (
                  <img
                    src={resolvedMaskUrl}
                    alt={`${metricName} overlay`}
                    className="absolute inset-0 w-full h-full pointer-events-none mix-blend-screen"
                    style={{
                      objectFit: "cover",
                      transform: disableOffsetForMask
                        ? "translate(0%, 0%)"
                        : `translate(${HAUT_MASK_OFFSET.xPercent}%, ${HAUT_MASK_OFFSET.yPercent}%)`,
                      transformOrigin: "center center",
                      opacity: overlayOpacity,
                      filter: overlayFilter,
                    }}
                    draggable={false}
                  />
                )}
              </div>

              {!hasRealMask && (
                <p className="mt-1 text-center text-[7px] leading-[9px] text-[#9CA3AF] font-['Manrope',sans-serif]">
                  No visible concerns were detected in this area during the analysis
                </p>
              )}
            </div>
          )}
        </div>

        {/* Columna derecha */}
        <div className="flex-1 flex flex-col sm:pr-2">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h2
                className="text-[#18212D] font-['Manrope',sans-serif] mb-3"
                style={{ fontSize: "28px", lineHeight: "34px" }}
              >
                {metricName || "Metric"}
              </h2>

              <div className="flex items-center gap-4">
                <div className="flex items-baseline gap-2">
                  <div
                    className="font-['Manrope',sans-serif]"
                    style={{
                      fontSize: "32px",
                      lineHeight: "36px",
                      color: getScoreColor((metric as any)?.score),
                      fontWeight: 600,
                    }}
                  >
                    {(metric as any)?.score ?? "—"}
                  </div>
                  <div className="text-[11px] text-[#9CA3AF] font-['Manrope',sans-serif]">
                    / 100
                  </div>
                </div>

                <div
                  className={`inline-flex items-center px-3 py-1.5 rounded-full border text-xs font-['Manrope',sans-serif] ${getStatusBadge(
                    metricStatus
                  )}`}
                >
                  {metricStatus || "—"}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-[#6B7280] hover:text-[#18212D] transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="h-px bg-[#E5E5E5] mb-5"></div>

          <div className="mb-6">
            <p className="text-[#6B7280] font-['Manrope',sans-serif] text-[15px] leading-relaxed">
              {computedDescription}
            </p>
          </div>

          {biomarkerCards.length > 0 && (
            <div className="mb-6">
              <h3
                className="text-[#18212D] mb-4 font-['Manrope',sans-serif]"
                style={{ fontSize: "18px", fontWeight: 500 }}
              >
                Key Biomarkers
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {biomarkerCards.map((b, idx) => (
                  <div
                    key={idx}
                    className="bg-[#FAFAFA] rounded-2xl border border-[#E5E5E5] p-4 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="text-[11px] text-[#9CA3AF] mb-2 font-['Manrope',sans-serif] uppercase tracking-wide">
                      {b.label}
                    </div>
                    <div
                      className="text-[#18212D] font-['Manrope',sans-serif]"
                      style={{ fontSize: "22px", fontWeight: 600 }}
                    >
                      {b.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-1">
            <div className="text-[#18212D] mb-2 font-['Manrope',sans-serif] text-[15px] font-medium">
              Recommendation
            </div>
            <p className="text-[#6B7280] font-['Manrope',sans-serif] text-[14px] leading-relaxed">
              {(metric as any)?.recommendation ?? ""}
            </p>
          </div>

          <div className="h-2" />
        </div>
      </div>
    </div>
  );
}
