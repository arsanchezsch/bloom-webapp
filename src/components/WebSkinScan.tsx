// src/components/WebSkinScan.tsx
import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Camera, Upload, QrCode, CheckCircle2 } from "lucide-react";
import bloomLogo from "figma:asset/73a8a80abf64277705c5d856c147464ec33b1a04.png";
import { AnalyzingScreen } from "./AnalyzingScreen";
import { LiqaCamera } from "./LiqaCamera";

interface WebSkinScanProps {
  onComplete: (imageData: string, source: "camera" | "upload") => void;
  forceCameraMode?: boolean;
}

export function WebSkinScan({
  onComplete,
  forceCameraMode = false,
}: WebSkinScanProps) {
  const [selectedOption, setSelectedOption] = useState<
    "camera" | "upload" | "qr" | null
  >(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Si venimos desde /capture, entrar directamente en modo cámara (LIQA)
  useEffect(() => {
    if (forceCameraMode) {
      setSelectedOption("camera");
      setUploadedImage(null);
      setIsScanning(false);
    }
  }, [forceCameraMode]);

  // ==========================
  // HELPERS
  // ==========================
  const startAnalysis = (imageData: string, source: "camera" | "upload") => {
    setIsScanning(true);
    setTimeout(() => {
      onComplete(imageData, source);
    }, 3000);
  };

  const resetSelection = () => {
    setSelectedOption(null);
    setUploadedImage(null);
    setIsScanning(false);
  };

  // ==========================
  // HANDLERS
  // ==========================
  const handleTakePhoto = () => {
    setSelectedOption("camera");
    setUploadedImage(null);
    setIsScanning(false);
  };

  const handleUploadPhoto = () => {
    setSelectedOption("upload");
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const imageData = reader.result as string;
      setUploadedImage(imageData);
      startAnalysis(imageData, "upload");
    };
    reader.readAsDataURL(file);
  };

  const handleScanQR = () => {
    setSelectedOption("qr");
    setUploadedImage(null);
    setIsScanning(false);
    setShowQRModal(true);
  };

  // ==========================
  // PANTALLA ANALYZING
  // ==========================
  if (isScanning && uploadedImage) {
    return <AnalyzingScreen imageUrl={uploadedImage} />;
  }

  // ==========================
// PANTALLA CÁMARA (LIQA)
// ==========================
if (selectedOption === "camera" && !uploadedImage) {
  return (
    <div className="min-h-screen bg-[#F7F7F7] flex flex-col">
      {/* HEADER */}
      <header className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-5xl mx-auto px-6 md:px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-[#18212D] font-semibold text-[26px] leading-[34px]">
              Take a Photo
            </h1>
            <p className="text-[#6B7280] text-[15px] mt-1">
              Follow the on-screen guidance for the most accurate analysis.
            </p>
          </div>
          <img src={bloomLogo} alt="Bloom" className="h-10" />
        </div>
      </header>

      {/* SOLO CÁMARA, SIN TEXTOS EXTRA */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <LiqaCamera
          onImageData={(imageData) => {
            setUploadedImage(imageData);
            startAnalysis(imageData, "camera");
          }}
          onCancel={resetSelection}
        />
      </main>
    </div>
  );
}

  // ==========================
  // PANTALLA OPCIONES INICIO
  // ==========================
  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-6xl mx-auto px-6 md:px-8 py-4 md:py-6 flex items-start justify-between">
          <div>
            <h1
              className="text-[#18212D] font-['Manrope',sans-serif]"
              style={{ fontSize: "28px", lineHeight: "36px" }}
            >
              Skin Analysis
            </h1>
            <p className="text-[#6B7280] mt-1 md:mt-2 font-['Manrope',sans-serif]">
              Choose how you'd like to capture your photo for analysis
            </p>
          </div>
          <img src={bloomLogo} alt="Bloom" className="h-12" />
        </div>
      </header>

      {/* Options */}
      <main className="flex-1 flex items-center justify-center px-4 md:px-8 py-8 md:py-12">
        <div className="max-w-6xl w-full space-y-8">
          {/* Photo Guidelines */}
          <div className="bg-white rounded-3xl border border-[#E5E5E5] p-6 md:p-8 shadow-sm">
            <h2
              className="text-[#18212D] mb-3 md:mb-4 font-['Manrope',sans-serif]"
              style={{ fontSize: "24px", lineHeight: "32px" }}
            >
              Facial Image Capture
            </h2>
            <p className="text-[#6B7280] mb-4 md:mb-6 font-['Manrope',sans-serif]">
              Please ensure good lighting and remove any makeup or accessories
              for the most accurate analysis.
            </p>

            <div className="bg-[#F5F5F5] rounded-2xl p-4 md:p-6">
              <h3
                className="text-[#18212D] mb-3 md:mb-4 font-['Manrope',sans-serif]"
                style={{ fontSize: "18px", lineHeight: "24px" }}
              >
                Photo Guidelines:
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                  <span className="text-[#6B7280] font-['Manrope',sans-serif]">
                    Face the camera directly with a neutral expression
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                  <span className="text-[#6B7280] font-['Manrope',sans-serif]">
                    Ensure even, natural lighting on your face
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                  <span className="text-[#6B7280] font-['Manrope',sans-serif]">
                    Remove glasses, makeup, and accessories
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                  <span className="text-[#6B7280] font-['Manrope',sans-serif]">
                    Keep hair away from your face
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Capture Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Take Photo (LIQA) */}
            <div
              onClick={handleTakePhoto}
              className="bg-white rounded-3xl border-2 border-[#E5E5E5] hover:border-[#FF6B4A] p-8 md:p-12 text-center cursor-pointer transition-all hover:shadow-xl group"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-[#FF6B4A] to-[#FFA94D] flex items-center justify-center mx-auto mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                <Camera className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
              <h3
                className="text-[#18212D] mb-2 md:mb-3 font-['Manrope',sans-serif]"
                style={{ fontSize: "22px", lineHeight: "30px" }}
              >
                Take a Photo
              </h3>
              <p className="text-[#6B7280] font-['Manrope',sans-serif]">
                Use Bloom smart camera to capture a new photo
              </p>
            </div>

            {/* Upload Photo */}
            <div
              onClick={handleUploadPhoto}
              className="bg-white rounded-3xl border-2 border-[#E5E5E5] hover:border-[#FF6B4A] p-8 md:p-12 text-center cursor-pointer transition-all hover:shadow-xl group"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-[#FF6B4A] to-[#FFA94D] flex items-center justify-center mx-auto mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
              <h3
                className="text-[#18212D] mb-2 md:mb-3 font-['Manrope',sans-serif]"
                style={{ fontSize: "22px", lineHeight: "30px" }}
              >
                Upload a Photo
              </h3>
              <p className="text-[#6B7280] font-['Manrope',sans-serif]">
                Choose an existing photo from your device
              </p>
            </div>

            {/* Scan QR */}
            <div
              onClick={handleScanQR}
              className="bg-white rounded-3xl border-2 border-[#E5E5E5] hover:border-[#FF6B4A] p-8 md:p-12 text-center cursor-pointer transition-all hover:shadow-xl group"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-[#FF6B4A] to-[#FFA94D] flex items-center justify-center mx-auto mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                <QrCode className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
              <h3
                className="text-[#18212D] mb-2 md:mb-3 font-['Manrope',sans-serif]"
                style={{ fontSize: "22px", lineHeight: "30px" }}
              >
                Scan QR Code
              </h3>
              <p className="text-[#6B7280] font-['Manrope',sans-serif]">
                Use your mobile device to upload a photo via QR
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* QR MODAL */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="relative bg-white rounded-3xl border border-[#E5E5E5] p-6 md:p-8 pt-10 md:pt-12 max-w-sm w-full text-center shadow-xl">
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 text-[#9CA3AF] hover:text-[#111827] text-xl leading-none"
              aria-label="Close QR modal"
            >
              ×
            </button>

            <h2
              className="text-[#18212D] font-['Manrope',sans-serif] mb-2"
              style={{ fontSize: "22px", lineHeight: "30px" }}
            >
              Scan this QR code on your phone
            </h2>

            <p className="text-[#6B7280] mb-4 font-['Manrope',sans-serif]">
              Open your camera, scan it, and continue the analysis on your
              mobile.
            </p>

            {(() => {
              const qrLink = "https://bapp-swart.vercel.app/capture";
              return (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
                    qrLink,
                  )}`}
                  alt="Bloom QR code"
                  className="mx-auto rounded-2xl mb-4"
                />
              );
            })()}

            <button
              onClick={() => setShowQRModal(false)}
              className="mt-3 w-full h-11 px-6 bg-[#18212D] hover:bg-[#111827] text-white rounded-full font-['Manrope',sans-serif]"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
