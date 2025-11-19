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
}

export function MetricDetailModal({ metric, onClose }: MetricDetailModalProps) {
  if (!metric) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl border border-[#E5E5E5] p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
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
        <div className={`inline-flex items-center px-4 py-2 rounded-full border text-sm font-['Manrope',sans-serif] mb-4 ${getStatusBadge(metric.status)}`}>
          {metric.status}
        </div>

        <p className="text-[#6B7280] mb-6 font-['Manrope',sans-serif]">
          {metric.description}
        </p>
        
        {/* Biomarkers */}
        {metric.biomarkers && metric.biomarkers.length > 0 && (
          <div className="mb-6">
            <h3 
              className="text-[#18212D] mb-3 font-['Manrope',sans-serif]" 
              style={{ fontSize: '18px' }}
            >
              Key Biomarkers
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {metric.biomarkers.map((bio, idx) => (
                <div key={idx} className="bg-[#F5F5F5] rounded-xl p-4">
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
        <div className="bg-[#F5F5F5] rounded-xl p-4 mb-4">
          <div className="text-[#18212D] mb-2 font-['Manrope',sans-serif]">
            Recommendation:
          </div>
          <p className="text-[#6B7280] font-['Manrope',sans-serif]">
            {metric.recommendation}
          </p>
        </div>
      </div>
    </div>
  );
}
