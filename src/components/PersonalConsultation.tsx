import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { User, Droplet, Target, Sparkles, FileText } from "lucide-react";
import bloomLogo from "figma:asset/73a8a80abf64277705c5d856c147464ec33b1a04.png";

interface PersonalConsultationProps {
  onComplete: (data: Record<string, any>) => void;
}

export function PersonalConsultation({ onComplete }: PersonalConsultationProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    age: "",
    gender: "",
    skinType: "",
    skinConcerns: [] as string[],
    currentProducts: "",
    medicalHistory: "",
  });

  const genderOptions = ["Male", "Female", "Other", "Prefer not to answer"];
  const skinTypeOptions = ["Dry", "Oily", "Combination", "Sensitive", "Normal"];
  const skinConcernsOptions = [
    "Acne",
    "Dark spots",
    "Wrinkles",
    "Dullness",
    "Redness",
    "Large pores",
    "Texture",
    "Dehydration",
  ];

  const handleConcernToggle = (concern: string) => {
    setFormData(prev => ({
      ...prev,
      skinConcerns: prev.skinConcerns.includes(concern)
        ? prev.skinConcerns.filter(c => c !== concern)
        : [...prev.skinConcerns, concern]
    }));
  };

  const handleSubmit = () => {
    if (!formData.fullName || !formData.email || !formData.skinType || formData.skinConcerns.length === 0) {
      return;
    }
    onComplete(formData);
  };

  const isValid = formData.fullName && formData.email && formData.skinType && formData.skinConcerns.length > 0;

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-[#E5E5E5] px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-start justify-between">
          <div>
            <h1 className="text-[#18212D] font-['Manrope',sans-serif]" style={{ fontSize: '32px', lineHeight: '40px' }}>
              Personal Consultation
            </h1>
            <p className="text-[#6B7280] mt-2 font-['Manrope',sans-serif]">
              Tell us about yourself to personalize your skin analysis
            </p>
          </div>
          <img src={bloomLogo} alt="Bloom" className="h-12" />
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto py-12 px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Personal Information */}
          <div className="bg-white rounded-2xl border border-[#E5E5E5] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B4A] to-[#FFA94D] flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-[#18212D] font-['Manrope',sans-serif]" style={{ fontSize: '24px', lineHeight: '32px' }}>
                Personal Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm text-[#6B7280] font-['Manrope',sans-serif]">
                  Full Name <span className="text-[#FF6B4A]">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="h-12 bg-white border border-[#E5E5E5] focus:border-[#FF6B4A] rounded-xl px-4 placeholder:text-[#9CA3AF] text-[#18212D]"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-[#6B7280] font-['Manrope',sans-serif]">
                  Email <span className="text-[#FF6B4A]">*</span>
                </label>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-12 bg-white border border-[#E5E5E5] focus:border-[#FF6B4A] rounded-xl px-4 placeholder:text-[#9CA3AF] text-[#18212D]"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-[#6B7280] font-['Manrope',sans-serif]">
                  Age (Optional)
                </label>
                <Input
                  type="number"
                  placeholder="25"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="h-12 bg-white border border-[#E5E5E5] focus:border-[#FF6B4A] rounded-xl px-4 placeholder:text-[#9CA3AF] text-[#18212D]"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-[#6B7280] font-['Manrope',sans-serif]">
                  Gender (Optional)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {genderOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => setFormData({ ...formData, gender: option })}
                      className={`h-10 px-4 bg-white rounded-lg border text-sm transition-all font-['Manrope',sans-serif] ${
                        formData.gender === option
                          ? "border-[#FF6B4A] bg-[#FFF5F3]"
                          : "border-[#E5E5E5] hover:border-[#FFA94D] hover:bg-[#FFF5F3]"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Skin Type */}
          <div className="bg-white rounded-2xl border border-[#E5E5E5] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B4A] to-[#FFA94D] flex items-center justify-center">
                <Droplet className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-[#18212D] font-['Manrope',sans-serif]" style={{ fontSize: '24px', lineHeight: '32px' }}>
                Skin Type <span className="text-[#FF6B4A]">*</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {skinTypeOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setFormData({ ...formData, skinType: option })}
                  className={`h-14 px-6 bg-white rounded-xl border transition-all font-['Manrope',sans-serif] ${
                    formData.skinType === option
                      ? "border-[#FF6B4A] bg-[#FFF5F3] shadow-md"
                      : "border-[#E5E5E5] hover:border-[#FFA94D] hover:bg-[#FFF5F3]"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Skin Concerns */}
          <div className="bg-white rounded-2xl border border-[#E5E5E5] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B4A] to-[#FFA94D] flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-[#18212D] font-['Manrope',sans-serif]" style={{ fontSize: '24px', lineHeight: '32px' }}>
                Skin Concerns <span className="text-[#FF6B4A]">*</span>
              </h2>
            </div>
            <p className="text-sm text-[#6B7280] mb-4 font-['Manrope',sans-serif]">Select all that apply</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {skinConcernsOptions.map((concern) => (
                <div
                  key={concern}
                  onClick={() => handleConcernToggle(concern)}
                  className={`h-14 px-4 bg-white rounded-xl border transition-all flex items-center gap-3 cursor-pointer font-['Manrope',sans-serif] ${
                    formData.skinConcerns.includes(concern)
                      ? "border-[#FF6B4A] bg-[#FFF5F3] shadow-md"
                      : "border-[#E5E5E5] hover:border-[#FFA94D] hover:bg-[#FFF5F3]"
                  }`}
                >
                  <Checkbox
                    checked={formData.skinConcerns.includes(concern)}
                    className="data-[state=checked]:bg-[#FF6B4A] data-[state=checked]:border-[#FF6B4A]"
                  />
                  <span className="text-[#18212D]">{concern}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Current Products */}
          <div className="bg-white rounded-2xl border border-[#E5E5E5] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B4A] to-[#FFA94D] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-[#18212D] font-['Manrope',sans-serif]" style={{ fontSize: '24px', lineHeight: '32px' }}>
                Current Skincare Products (Optional)
              </h2>
            </div>

            <Textarea
              placeholder="List any skincare products you currently use (e.g., cleansers, serums, moisturizers, etc.)"
              value={formData.currentProducts}
              onChange={(e) => setFormData({ ...formData, currentProducts: e.target.value })}
              className="min-h-[120px] bg-white border border-[#E5E5E5] focus:border-[#FF6B4A] rounded-xl p-4 placeholder:text-[#9CA3AF] text-[#18212D]"
            />
          </div>

          {/* Medical History */}
          <div className="bg-white rounded-2xl border border-[#E5E5E5] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B4A] to-[#FFA94D] flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-[#18212D] font-['Manrope',sans-serif]" style={{ fontSize: '24px', lineHeight: '32px' }}>
                Medical History (Optional)
              </h2>
            </div>

            <Textarea
              placeholder="Any skin conditions, allergies, or medical history we should know about?"
              value={formData.medicalHistory}
              onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
              className="min-h-[120px] bg-white border border-[#E5E5E5] focus:border-[#FF6B4A] rounded-xl p-4 placeholder:text-[#9CA3AF] text-[#18212D]"
            />
          </div>
        </div>
      </div>

      {/* Footer with Submit Button */}
      <div className="bg-white border-t border-[#E5E5E5] px-8 py-6">
        <div className="max-w-4xl mx-auto flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!isValid}
            className="h-14 px-12 bg-gradient-to-r from-[#FF6B4A] to-[#FFA94D] hover:from-[#E74C3C] hover:to-[#FF8C42] text-white rounded-full shadow-lg transition-all duration-300 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed border-0 font-['Manrope',sans-serif]"
          >
            Continue to Skin Analysis
          </Button>
        </div>
      </div>
    </div>
  );
}