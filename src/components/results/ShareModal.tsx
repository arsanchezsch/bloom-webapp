// ============================================
// SHARE MODAL COMPONENT
// Modal for sharing skin analysis results
// con 2 pasos: opciones + email / whatsapp
// ============================================

import React, { useState, useEffect } from "react";
import { X, Mail, MessageCircle, ArrowLeft } from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
  reportUrl?: string;
}

type ShareStep = "options" | "email" | "whatsapp";

export function ShareModal({
  isOpen,
  onClose,
  defaultEmail,
  reportUrl,
}: ShareModalProps) {
  const [step, setStep] = useState<ShareStep>("options");
  const [email, setEmail] = useState(defaultEmail || "");
  const [phone, setPhone] = useState("");

  // Cuando se abre la modal, volvemos siempre al primer paso
  useEffect(() => {
    if (isOpen) {
      setStep("options");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const urlToShare = reportUrl || window.location.href;

  const handleSend = () => {
    if (step === "email" && email.trim()) {
      const subject = encodeURIComponent("Your Bloom Skin Report");
      const body = encodeURIComponent(
        `Here is your Bloom skin report: ${urlToShare}`
      );
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
      onClose();
    }

    if (step === "whatsapp" && phone.trim()) {
      const text = encodeURIComponent(
        `Your Bloom skin report: ${urlToShare}`
      );
      window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
      onClose();
    }
  };

  const canSend =
    (step === "email" && !!email.trim()) ||
    (step === "whatsapp" && !!phone.trim());

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-[#E5E5E5] p-8 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {step !== "options" && (
              <button
                onClick={() => setStep("options")}
                className="mr-1 rounded-full p-1 text-[#6B7280] hover:bg-[#F5F5F5]"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2
              className="text-[#18212D] font-['Manrope',sans-serif]"
              style={{ fontSize: "24px", lineHeight: "32px" }}
            >
              {step === "options" && "Share Your Results"}
              {step === "email" && "Send via Email"}
              {step === "whatsapp" && "Share on WhatsApp"}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#18212D]"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* PASO 1: opciones (tu modal original) */}
        {step === "options" && (
          <div className="space-y-4">
            {/* Email */}
            <div
              className="bg-[#F5F5F5] rounded-xl p-4 hover:bg-[#FFE5DD] transition-colors cursor-pointer group"
              onClick={() => setStep("email")}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-[#FF6B4A] group-hover:to-[#FFA94D] transition-all">
                  <Mail className="w-6 h-6 text-[#FF6B4A] group-hover:text-white transition-colors" />
                </div>
                <div>
                  <div className="text-[#18212D] font-['Manrope',sans-serif]">
                    Email
                  </div>
                  <div className="text-sm text-[#6B7280] font-['Manrope',sans-serif]">
                    Send via email
                  </div>
                </div>
              </div>
            </div>

            {/* WhatsApp */}
            <div
              className="bg-[#F5F5F5] rounded-xl p-4 hover:bg-[#FFE5DD] transition-colors cursor-pointer group"
              onClick={() => setStep("whatsapp")}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-[#FF6B4A] group-hover:to-[#FFA94D] transition-all">
                  <MessageCircle className="w-6 h-6 text-[#FF6B4A] group-hover:text-white transition-colors" />
                </div>
                <div>
                  <div className="text-[#18212D] font-['Manrope',sans-serif]">
                    WhatsApp
                  </div>
                  <div className="text-sm text-[#6B7280] font-['Manrope',sans-serif]">
                    Share on WhatsApp
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PASO 2: Email */}
        {step === "email" && (
          <div className="space-y-4">
            <p className="text-sm text-[#6B7280] font-['Manrope',sans-serif]">
              Enter the email where you want to receive your Bloom skin report.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full h-12 bg-[#F5F5F5] rounded-xl px-4 text-sm text-[#18212D] border border-[#E5E5E5] focus:outline-none focus:border-[#FF6B4A] font-['Manrope',sans-serif]"
            />
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="w-full h-12 bg-gradient-to-r from-[#FF6B4A] to-[#FFA94D] hover:from-[#E74C3C] hover:to-[#FF8C42] text-white rounded-xl text-sm font-['Manrope',sans-serif] disabled:opacity-50"
            >
              Send report
            </button>
          </div>
        )}

        {/* PASO 2: WhatsApp */}
        {step === "whatsapp" && (
          <div className="space-y-4">
            <p className="text-sm text-[#6B7280] font-['Manrope',sans-serif]">
              Enter the phone number (with country code) to receive your report
              on WhatsApp.
            </p>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 123 4567"
              className="w-full h-12 bg-[#F5F5F5] rounded-xl px-4 text-sm text-[#18212D] border border-[#E5E5E5] focus:outline-none focus:border-[#FF6B4A] font-['Manrope',sans-serif]"
            />
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="w-full h-12 bg-gradient-to-r from-[#FF6B4A] to-[#FFA94D] hover:from-[#E74C3C] hover:to-[#FF8C42] text-white rounded-xl text-sm font-['Manrope',sans-serif] disabled:opacity-50"
            >
              Send report
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
