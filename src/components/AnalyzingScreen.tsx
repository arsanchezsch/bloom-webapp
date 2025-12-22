// ============================================
// ANALYZING SCREEN
// Proper inner spacing – matches RadarOverview card logic (p-6)
// + extra top padding above the icon
// ============================================

import { Sparkles } from "lucide-react";
import bloomLogo from "figma:asset/73a8a80abf64277705c5d856c147464ec33b1a04.png";

interface AnalyzingScreenProps {
  imageUrl?: string | null;
}

export function AnalyzingScreen({ imageUrl }: AnalyzingScreenProps) {
  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      {/* Compact Header */}
      <div className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-3 flex justify-end">
          <img src={bloomLogo} alt="Bloom" className="h-9 md:h-10" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 md:px-8 py-6">
        {/* Card (no padding here, like a shell) */}
        <div className="max-w-2xl w-full bg-white rounded-3xl border border-[#E5E5E5] shadow-lg">
          {/* Inner padding EXACTLY like RadarOverview: p-6 */}
          <div className="p-6 md:p-8 text-center">
            {/* Extra top breathing space ABOVE icon */}
            <div className="pt-2 md:pt-3" />

            {/* Icon */}
            <div className="w-16 h-16 md:w-[72px] md:h-[72px] rounded-full bg-gradient-to-br from-[#FF6B4A] to-[#FFA94D] flex items-center justify-center mx-auto mb-4 md:mb-5 animate-pulse">
              <Sparkles className="w-8 h-8 md:w-9 md:h-9 text-white" />
            </div>

            {/* Title */}
            <h2
              className="text-[#18212D] mb-2 font-['Manrope',sans-serif]"
              style={{ fontSize: "26px", lineHeight: "34px" }}
            >
              Analyzing your skin...
            </h2>

            {/* Subtitle */}
            <p className="text-[#6B7280] mb-5 md:mb-6 font-['Manrope',sans-serif]">
              Our AI is processing your image and generating personalized insights.
            </p>

            {/* Image – NEVER CROPS */}
            {imageUrl && (
              <div className="mx-auto w-full max-w-md">
                <div className="relative w-full rounded-2xl overflow-hidden border border-[#E5E5E5] bg-[#FBFAF9] shadow-sm">
                  <div className="w-full max-h-[56vh] md:max-h-[52vh] flex items-center justify-center">
                    <img
                      src={imageUrl}
                      alt="Analyzing"
                      className="w-full h-full object-contain"
                      draggable={false}
                    />
                  </div>

                  {/* Subtle scanning overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FF6B4A]/10 to-transparent animate-pulse" />
                  </div>
                </div>

                {/* Tiny reassurance text */}
                <p className="mt-2 text-center text-[11px] leading-[14px] text-[#9CA3AF] font-['Manrope',sans-serif]">
                  This usually takes a few seconds.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
