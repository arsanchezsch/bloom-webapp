// ============================================
// ANALYZED PHOTO COMPONENT
// Displays the user's analyzed photo with timestamp
// ============================================

import { formatDate, formatTime } from "../../utils/helpers";

interface AnalyzedPhotoProps {
  imageUrl: string;
}

export function AnalyzedPhoto({ imageUrl }: AnalyzedPhotoProps) {
  const now = new Date();

  return (
    <div className="bg-white rounded-3xl border border-[#E5E5E5] p-6 shadow-sm">
      <h3 
        className="text-[#18212D] mb-4 font-['Manrope',sans-serif]" 
        style={{ fontSize: '20px', lineHeight: '28px' }}
      >
        Analyzed Photo
      </h3>
      
      <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-[#E5E5E5] bg-[#F5F5F5]">
        <img 
          src={imageUrl} 
          alt="Your analyzed photo" 
          className="w-full h-full object-cover" 
        />
      </div>
      
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-[#6B7280] font-['Manrope',sans-serif]">
          {formatDate(now)}
        </p>
        <p className="text-sm text-[#6B7280] font-['Manrope',sans-serif]">
          {formatTime(now)}
        </p>
      </div>
    </div>
  );
}
