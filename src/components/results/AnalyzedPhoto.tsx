// ============================================
// ANALYZED PHOTO COMPONENT
// Displays the user's analyzed photo with dropdown to highlight different face areas
// ============================================

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatDate, formatTime } from "../../utils/helpers";

interface AnalyzedPhotoProps {
  imageUrl: string;
  // Foto alineada de Haut (mismo zoom que Lines en el modal)
  hautFaceImageUrl?: string;
  // Máscara real de líneas de Haut
  hautLinesMaskUrl?: string;
  // Máscara real de poros de Haut
  hautPoresMaskUrl?: string;
  // Máscara real de pigmentación
  hautPigmentationMaskUrl?: string;
  // Máscara real de acné / breakouts
  hautAcneMaskUrl?: string;
  // Máscara real de redness
  hautRednessMaskUrl?: string;
  // Máscara real de sagging
  hautSaggingMaskUrl?: string;
  // Máscara real de dark circles
  hautDarkCirclesMaskUrl?: string;
}

type MetricHighlight =
  | "none"
  | "acne"
  | "pores"
  | "pigmentation"
  | "redness"
  | "sagging"
  | "dark_circles"
  | "lines";

const METRIC_OPTIONS = [
  { value: "none" as const, label: "No Highlighting" },
  { value: "acne" as const, label: "Acne" },
  { value: "pores" as const, label: "Pores" },
  { value: "pigmentation" as const, label: "Pigmentation" },
  { value: "redness" as const, label: "Redness" },
  { value: "sagging" as const, label: "Sagging" },
  { value: "dark_circles" as const, label: "Dark Circles" },
  { value: "lines" as const, label: "Lines & Wrinkles" },
];

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
}: AnalyzedPhotoProps) {
  const now = new Date();
  const [selectedMetric, setSelectedMetric] = useState<MetricHighlight>("none");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const isLinesMetric = selectedMetric === "lines";
  const isPoresMetric = selectedMetric === "pores";
  const isPigmentationMetric = selectedMetric === "pigmentation";
  const isAcneMetric = selectedMetric === "acne";
  const isRednessMetric = selectedMetric === "redness";
  const isSaggingMetric = selectedMetric === "sagging";
  const isDarkCirclesMetric = selectedMetric === "dark_circles";

  // ⚠️ Igual que en el modal: siempre usamos la foto alineada si existe
  const basePhoto = hautFaceImageUrl || imageUrl;

  const getHighlightColor = (metric: MetricHighlight): string => {
    switch (metric) {
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
      default:
        return "transparent";
    }
  };

  const renderHighlightAreas = () => {
    if (selectedMetric === "none") return null;

    // Si estamos en métricas con máscara real, no mostramos fake overlays
    if (selectedMetric === "lines" && hautLinesMaskUrl) return null;
    if (selectedMetric === "pores" && hautPoresMaskUrl) return null;
    if (selectedMetric === "pigmentation" && hautPigmentationMaskUrl) return null;
    if (selectedMetric === "acne" && hautAcneMaskUrl) return null;
    if (selectedMetric === "redness" && hautRednessMaskUrl) return null;
    if (selectedMetric === "sagging" && hautSaggingMaskUrl) return null;
    if (selectedMetric === "dark_circles" && hautDarkCirclesMaskUrl) return null;

    const overlays = {
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

    const areas =
      overlays[selectedMetric as Exclude<MetricHighlight, "none">] || [];
    const color = getHighlightColor(selectedMetric);

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

  const selectedOption = METRIC_OPTIONS.find(
    (opt) => opt.value === selectedMetric
  );

  return (
    <div className="bg-white rounded-3xl border border-[#E5E5E5] p-6 shadow-sm">
      {/* Header with Dropdown */}
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-[#18212D] font-['Manrope',sans-serif]"
          style={{ fontSize: "20px", lineHeight: "28px" }}
        >
          Analyzed Photo
        </h3>

        {/* Metric Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E5E5] rounded-xl hover:border-[#FF6B4A] transition-all text-sm font-['Manrope',sans-serif]"
          >
            <span className="text-[#FF6B4A]">
              Highlighting: {selectedOption?.label}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-[#FF6B4A] transition-transform ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-[#E5E5E5] rounded-xl shadow-lg z-10 overflow-hidden">
              {METRIC_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSelectedMetric(option.value);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-[#FFF5F3] transition-colors font-['Manrope',sans-serif] text-sm ${
                    selectedMetric === option.value
                      ? "bg-[#FFF5F3] text-[#FF6B4A]"
                      : "text-[#18212D]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Photo Container with Highlights */}
      <div
        className="relative rounded-2xl overflow-hidden border-2 border-[#E5E5E5] bg-[#F5F5F5]"
        style={{ aspectRatio: "4 / 5" }} // mismo ratio que el modal
      >
        {/* Foto base */}
        <img
          src={basePhoto}
          alt="Your analyzed photo"
          className="w-full h-full object-contain"
        />

        {/* Lines */}
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

        {/* Pores */}
        {isPoresMetric && hautPoresMaskUrl && (
          <img
            src={hautPoresMaskUrl}
            alt="Pores overlay"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none mix-blend-screen opacity-85"
            style={{
              filter: "brightness(1.1) contrast(1.3)",
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
              filter: "brightness(1.05) contrast(1.15) saturate(1.2)",
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
              filter: "brightness(1.05) contrast(1.2) saturate(1.15)",
            }}
          />
        )}

        {/* Overlays fake para el resto de métricas */}
        {renderHighlightAreas()}
      </div>

      {/* Timestamp */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-[#6B7280] font-['Manrope',sans-serif]">
          {formatDate(now)}
        </p>
        <p className="text-sm text-[#6B7280] font-['Manrope',sans-serif]">
          {formatTime(now)}
        </p>
      </div>

      {/* Info Text */}
      {selectedMetric !== "none" && (
        <div className="mt-3 p-3 bg-[#FFF5F3] rounded-xl">
          <p className="text-xs text-[#FF6B4A] font-['Manrope',sans-serif]">
            ✨ Highlighted areas show detected{" "}
            {selectedOption?.label.toLowerCase()} on your face
          </p>
        </div>
      )}
    </div>
  );
}
