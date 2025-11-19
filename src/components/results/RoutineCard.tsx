// ============================================
// ROUTINE CARD COMPONENT
// Displays skincare routine recommendations
// ============================================

import type { RecommendationCategory } from "../../types";

interface RoutineCardProps {
  routine: RecommendationCategory;
}

export function RoutineCard({ routine }: RoutineCardProps) {
  const Icon = routine.icon;

  return (
    <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B4A] to-[#FFA94D] flex items-center justify-center">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 
          className="text-[#18212D] font-['Manrope',sans-serif]" 
          style={{ fontSize: '18px', lineHeight: '24px' }}
        >
          {routine.category}
        </h3>
      </div>

      <div className="space-y-4">
        {routine.products.map((product, idx) => (
          <div key={idx} className="bg-[#F5F5F5] rounded-xl p-4">
            <div className="text-[#18212D] mb-1 font-['Manrope',sans-serif]">
              {product.name}
            </div>
            <div className="text-sm text-[#6B7280] font-['Manrope',sans-serif]">
              {product.reason}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
