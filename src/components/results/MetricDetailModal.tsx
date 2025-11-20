// ============================================
// METRIC DETAIL MODAL COMPONENT
// Detailed view of a specific skin metric
// ============================================

import { X } from "lucide-react";
import type { SkinMetric } from "../../types";
import { getStatusBadge } from "../../utils/helpers";

interface MetricDetailModalProps {
  metric: SkinMetric | null;
  onClose: () => void;
  imageUrl?: string;
}

type MetricHighlight = 
  | "acne" 
  | "pores" 
  | "pigmentation" 
  | "redness" 
  | "hydration"
  | "translucency"
  | "lines";

export function MetricDetailModal({ metric, onClose, imageUrl }: MetricDetailModalProps) {
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

  const getHighlightColor = (type: MetricHighlight): string => {
    switch (type) {
      case "acne": return "rgba(255, 107, 74, 0.35)";
      case "pores": return "rgba(255, 169, 77, 0.35)";
      case "pigmentation": return "rgba(255, 193, 7, 0.35)";
      case "redness": return "rgba(239, 68, 68, 0.35)";
      case "hydration": return "rgba(59, 130, 246, 0.35)";
      case "translucency": return "rgba(168, 85, 247, 0.35)";
      case "lines": return "rgba(107, 114, 128, 0.35)";
    }
  };

  const renderHighlightAreas = () => {
    if (!highlightType) return null;

    // Define different face area overlays for each metric
    const overlays: Record<MetricHighlight, Array<{top: string, left: string, width: string, height: string}>> = {
      "acne": [
        { top: "25%", left: "30%", width: "15%", height: "8%" }, // Forehead
        { top: "40%", left: "20%", width: "12%", height: "10%" }, // Left cheek
        { top: "42%", left: "68%", width: "10%", height: "8%" }, // Right cheek
        { top: "55%", left: "42%", width: "8%", height: "6%" }, // Nose
      ],
      "pores": [
        { top: "45%", left: "40%", width: "20%", height: "15%" }, // T-zone center
        { top: "38%", left: "25%", width: "15%", height: "12%" }, // Left T-zone
        { top: "38%", left: "60%", width: "15%", height: "12%" }, // Right T-zone
      ],
      "pigmentation": [
        { top: "40%", left: "22%", width: "18%", height: "20%" }, // Left cheek area
        { top: "40%", left: "60%", width: "18%", height: "20%" }, // Right cheek area
        { top: "25%", left: "35%", width: "30%", height: "10%" }, // Forehead
      ],
      "redness": [
        { top: "42%", left: "24%", width: "16%", height: "18%" }, // Left cheek
        { top: "42%", left: "60%", width: "16%", height: "18%" }, // Right cheek
        { top: "48%", left: "42%", width: "16%", height: "12%" }, // Nose area
      ],
      "hydration": [
        { top: "40%", left: "22%", width: "18%", height: "20%" }, // Left cheek area
        { top: "40%", left: "60%", width: "18%", height: "20%" }, // Right cheek area
        { top: "25%", left: "35%", width: "30%", height: "10%" }, // Forehead
      ],
      "translucency": [
        { top: "22%", left: "35%", width: "30%", height: "5%" }, // Forehead lines
        { top: "52%", left: "35%", width: "12%", height: "8%" }, // Nasolabial left
        { top: "52%", left: "53%", width: "12%", height: "8%" }, // Nasolabial right
        { top: "36%", left: "32%", width: "8%", height: "4%" }, // Crow's feet left
        { top: "36%", left: "60%", width: "8%", height: "4%" }, // Crow's feet right
      ],
      "lines": [
        { top: "22%", left: "35%", width: "30%", height: "5%" }, // Forehead lines
        { top: "52%", left: "35%", width: "12%", height: "8%" }, // Nasolabial left
        { top: "52%", left: "53%", width: "12%", height: "8%" }, // Nasolabial right
        { top: "36%", left: "32%", width: "8%", height: "4%" }, // Crow's feet left
        { top: "36%", left: "60%", width: "8%", height: "4%" }, // Crow's feet right
      ]
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
          border: `2px solid ${color.replace('0.35', '0.8')}`,
          boxShadow: `0 0 20px ${color}`,
          pointerEvents: "none"
        }}
      />
    ));
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl border border-[#E5E5E5] p-6 max-w-lg w-[98vw] shadow-2xl flex flex-col gap-6 overflow-y-auto"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 
            className="text-[#18212D] font-['Manrope',sans-serif]" 
            style={{ fontSize: '28px', lineHeight: '36px' }}
          >
            {metric.name}
          </h2>
          <button 
            onClick={onClose} 
            className="text-[#6B7280] hover:text-[#18212D]"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Status Badge */}
        <div className="flex items-start gap-3">
          <div className={`inline-flex items-center px-3 py-1.5 rounded-full border text-xs font-['Manrope',sans-serif] ${getStatusBadge(metric.status)}`}>
            {metric.status}
          </div>
        </div>

        <p className="text-[#6B7280] font-['Manrope',sans-serif] text-sm">
          {metric.description}
        </p>

        {/* Analyzed Photo with Overlay */}
        {imageUrl && highlightType && (
          <div>
            <h3 
              className="text-[#18212D] mb-3 font-['Manrope',sans-serif]" 
              style={{ fontSize: '18px' }}
            >
              Visual Analysis
            </h3>
            <div
              className="relative rounded-2xl overflow-hidden border-2 border-[#E5E5E5] bg-[#F5F5F5] mx-auto"
              style={{
                width: "320px",
                height: "320px",
                maxWidth: "90vw",
                maxHeight: "50vw"
              }}
            >
              <img 
                src={imageUrl} 
                alt="Skin Analysis" 
                className="w-full h-full object-cover"
                style={{ maxWidth: "100%", maxHeight: "100%" }}
              />
              {renderHighlightAreas()}
            </div>
            <div className="mt-3 p-3 bg-[#FFF5F3] rounded-xl mx-auto" style={{ maxWidth: "320px" }}>
              <p className="text-xs text-[#FF6B4A] font-['Manrope',sans-serif] text-center">
                ✨ Highlighted areas show detected {metric.name.toLowerCase()}
              </p>
            </div>
          </div>
        )}

        {/* Biomarkers */}
        {metric.biomarkers && metric.biomarkers.length > 0 && (
          <div>
            <h3 
              className="text-[#18212D] mb-3 font-['Manrope',sans-serif]" 
              style={{ fontSize: '18px' }}
            >
              Key Biomarkers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {metric.biomarkers.map((bio, idx) => (
                <div key={idx} className="bg-[#F5F5F5] rounded-xl p-3">
                  <div className="text-xs text-[#6B7280] font-['Manrope',sans-serif] mb-1">
                    {bio.label}
                  </div>
                  <div 
                    className="text-[#18212D] font-['Manrope',sans-serif]" 
                    style={{ fontSize: '16px' }}
                  >
                    {bio.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendation */}
        <div className="bg-[#F5F5F5] rounded-xl p-4">
          <div className="text-[#18212D] mb-2 font-['Manrope',sans-serif] text-sm">
            Recommendation:
          </div>
          <p className="text-[#6B7280] font-['Manrope',sans-serif] text-sm">
            {metric.recommendation}
          </p>
        </div>
      </div>
    </div>
  );
}