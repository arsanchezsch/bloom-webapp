// ============================================
// ANALYZING SCREEN
// Pantalla de loading mientras Bloom analiza la piel
// ============================================

import { Sparkles } from "lucide-react";
import bloomLogo from "figma:asset/73a8a80abf64277705c5d856c147464ec33b1a04.png";

interface AnalyzingScreenProps {
  imageUrl?: string | null;
}

export function AnalyzingScreen({ imageUrl }: AnalyzingScreenProps) {
  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      {/* Header with logo */}
      <div className="bg-white border-b border-[#E5E5E5] px-8 py-6">
        <div className="max-w-7xl mx-auto flex justify-end">
          <img src={bloomLogo} alt="Bloom" className="h-12" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 md:px-8">
        <div className="max-w-2xl w-full bg-white rounded-3xl border border-[#E5E5E5] p-8 md:p-12 shadow-lg text-center">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-[#FF6B4A] to-[#FFA94D] flex items-center justify-center mx-auto mb-6 md:mb-8 animate-pulse">
            <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-white" />
          </div>
          <h2
            className="text-[#18212D] mb-3 md:mb-4 font-['Manrope',sans-serif]"
            style={{ fontSize: "28px", lineHeight: "36px" }}
          >
            Analyzing your skin...
          </h2>
          <p className="text-[#6B7280] mb-6 md:mb-8 font-['Manrope',sans-serif]">
            Our AI is processing your image and generating personalized insights.
          </p>

          {imageUrl && (
            <div className="relative w-full max-w-md mx-auto aspect-[4/5] rounded-2xl overflow-hidden border-4 border-[#FF6B4A]">
              <img
                src={imageUrl}
                alt="Analyzing"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FF6B4A]/20 to-transparent animate-pulse" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
