// ============================================
// ANALYZED PHOTO COMPONENT
// Displays the user's analyzed photo with dropdown to highlight different face areas
// ============================================

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatDate, formatTime } from "../../utils/helpers";

interface AnalyzedPhotoProps {
  imageUrl: string;
}

type MetricHighlight = 
  | "none" 
  | "acne" 
  | "pores" 
  | "pigmentation" 
  | "redness" 
  | "hydration"
  | "translucency"
  | "lines";

const METRIC_OPTIONS = [
  { value: "none" as const, label: "No Highlighting" },
  { value: "acne" as const, label: "Acne" },
  { value: "pores" as const, label: "Pores" },
  { value: "pigmentation" as const, label: "Pigmentation" },
  { value: "redness" as const, label: "Redness" },
  { value: "hydration" as const, label: "Hydration" },
  { value: "translucency" as const, label: "Translucency" },
  { value: "lines" as const, label: "Lines" }
];

export function AnalyzedPhoto({ imageUrl }: AnalyzedPhotoProps) {
  const now = new Date();
  const [selectedMetric, setSelectedMetric] = useState<MetricHighlight>("none");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getHighlightColor = (metric: MetricHighlight): string => {
    switch (metric) {
      case "acne": return "rgba(255, 107, 74, 0.35)";
      case "pores": return "rgba(255, 169, 77, 0.35)";
      case "pigmentation": return "rgba(255, 193, 7, 0.35)";
      case "redness": return "rgba(239, 68, 68, 0.35)";
      case "hydration": return "rgba(59, 130, 246, 0.35)";
      case "translucency": return "rgba(168, 85, 247, 0.35)";
      case "lines": return "rgba(107, 114, 128, 0.35)";
      default: return "transparent";
    }
  };

  const renderHighlightAreas = () => {
    if (selectedMetric === "none") return null;

    // Define different face area overlays for each metric
    const overlays = {
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

    const areas = overlays[selectedMetric] || [];
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
          border: `2px solid ${color.replace('0.35', '0.8')}`,
          boxShadow: `0 0 20px ${color}`,
          pointerEvents: "none"
        }}
      />
    ));
  };

  const selectedOption = METRIC_OPTIONS.find(opt => opt.value === selectedMetric);

  return (
    <div className="bg-white rounded-3xl border border-[#E5E5E5] p-6 shadow-sm">
      {/* Header with Dropdown */}
      <div className="flex items-center justify-between mb-4">
        <h3 
          className="text-[#18212D] font-['Manrope',sans-serif]" 
          style={{ fontSize: '20px', lineHeight: '28px' }}
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
              className={`w-4 h-4 text-[#FF6B4A] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
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
                      ? 'bg-[#FFF5F3] text-[#FF6B4A]' 
                      : 'text-[#18212D]'
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
      <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-[#E5E5E5] bg-[#F5F5F5]">
        <img 
          src={imageUrl} 
          alt="Your analyzed photo" 
          className="w-full h-full object-cover" 
        />
        
        {/* Highlight Overlays */}
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
            ✨ Highlighted areas show detected {selectedOption?.label.toLowerCase()} on your face
          </p>
        </div>
      )}
    </div>
  );
}