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
  | "hydration"
  | "translucency"
  | "lines";

interface MetricDetailModalProps {
  metric: SkinMetric | null;
  onClose: () => void;
  imageUrl: string;
  // Imagen de cara generada por Haut (anonymised / aligned_face)
  hautFaceImageUrl?: string;
  // Máscara de líneas de Haut (aligned_face_lines.svg)
  hautLinesMaskUrl?: string;
}

export function MetricDetailModal({
  metric,
  onClose,
  imageUrl,
  hautFaceImageUrl,
  hautLinesMaskUrl,
}: MetricDetailModalProps) {
  if (!metric) return null;

  // Map metric names to highlight types
  const getMetricHighlight = (metricName: string): MetricHighlight | null => {
    const name = metricName.toLowerCase();
    if (name.includes("acne")) return "acne";
    if (name.includes("pore")) return "pores";
    if (name.includes("pigment")) return "pigmentation";
    if (name.includes("redness")) return "redness";
    if (name.includes("hydration")) return "hydration";
    if (name.includes("translucency")) return "translucency";
    if (name.includes("line") || name.includes("wrinkle")) return "lines";
    return null;
  };

  const highlightType = getMetricHighlight(metric.name);
  const isLinesMetric = highlightType === "lines";

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
      case "hydration":
        return "rgba(59, 130, 246, 0.35)";
      case "translucency":
        return "rgba(168, 85, 247, 0.35)";
      case "lines":
        return "rgba(107, 114, 128, 0.35)";
    }
  };

  const renderHighlightAreas = () => {
    if (!highlightType) return null;
    // Para "lines" usamos la máscara real de Haut si existe
    if (isLinesMetric && hautLinesMaskUrl) {
      return null;
    }

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
      hydration: [
        { top: "40%", left: "22%", width: "18%", height: "20%" },
        { top: "40%", left: "60%", width: "18%", height: "20%" },
        { top: "25%", left: "35%", width: "30%", height: "10%" },
      ],
      translucency: [
        { top: "22%", left: "35%", width: "30%", height: "5%" },
        { top: "52%", left: "35%", width: "12%", height: "8%" },
        { top: "52%", left: "53%", width: "12%", height: "8%" },
        { top: "36%", left: "32%", width: "8%", height: "4%" },
        { top: "36%", left: "60%", width: "8%", height: "4%" },
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

  // ⚠️ SIEMPRE la misma foto base: la alineada si existe,
  // así Lines, Pores, etc. usan el mismo zoom/proporción
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
              {/* Cara base (misma para todas las métricas) */}
              <img
                src={basePhoto}
                alt="Skin Analysis"
                className="w-full h-full object-contain"
                style={{ background: "#F5F5F5" }}
              />

              {/* Para Lines & Wrinkles: máscara real de Haut encima */}
              {isLinesMetric && hautLinesMaskUrl && (
                <img
                  src={hautLinesMaskUrl}
                  alt="Lines overlay"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none mix-blend-screen opacity-35"
                  style={{
                    filter:
                      "brightness(0.9) contrast(1.15) saturate(1.2) blur(0.5px)",
                  }}
                />
              )}

              {/* Para el resto de métricas, usamos las áreas falsas */}
              {renderHighlightAreas()}
            </div>
          )}
        </div>

        {/* Columna derecha: info (igual que ya tenías) */}
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
