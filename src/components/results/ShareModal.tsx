// ============================================
// SHARE MODAL COMPONENT
// Modal for sharing skin analysis results
// ============================================

import { X, Mail, MessageCircle } from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ isOpen, onClose }: ShareModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl border border-[#E5E5E5] p-8 max-w-md w-full" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 
            className="text-[#18212D] font-['Manrope',sans-serif]" 
            style={{ fontSize: '24px', lineHeight: '32px' }}
          >
            Share Your Results
          </h2>
          <button 
            onClick={onClose} 
            className="text-[#6B7280] hover:text-[#18212D]"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Email */}
          <div className="bg-[#F5F5F5] rounded-xl p-4 hover:bg-[#FFE5DD] transition-colors cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-[#FF6B4A] group-hover:to-[#FFA94D] transition-all">
                <Mail className="w-6 h-6 text-[#FF6B4A] group-hover:text-white transition-colors" />
              </div>
              <div>
                <div className="text-[#18212D] font-['Manrope',sans-serif]">Email</div>
                <div className="text-sm text-[#6B7280] font-['Manrope',sans-serif]">
                  Send via email
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp */}
          <div className="bg-[#F5F5F5] rounded-xl p-4 hover:bg-[#FFE5DD] transition-colors cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-[#FF6B4A] group-hover:to-[#FFA94D] transition-all">
                <MessageCircle className="w-6 h-6 text-[#FF6B4A] group-hover:text-white transition-colors" />
              </div>
              <div>
                <div className="text-[#18212D] font-['Manrope',sans-serif]">WhatsApp</div>
                <div className="text-sm text-[#6B7280] font-['Manrope',sans-serif]">
                  Share on WhatsApp
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
