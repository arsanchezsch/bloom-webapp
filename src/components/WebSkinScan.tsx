import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Camera, Upload, QrCode, Sparkles, CheckCircle2 } from "lucide-react";
import bloomLogo from "figma:asset/73a8a80abf64277705c5d856c147464ec33b1a04.png";

interface WebSkinScanProps {
  onComplete: (imageData: string, source: "camera" | "upload") => void;
}

export function WebSkinScan({ onComplete }: WebSkinScanProps) {
  const [selectedOption, setSelectedOption] = useState<"camera" | "upload" | "qr" | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const handleTakePhoto = async () => {
    setSelectedOption("camera");
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Camera access is not supported in your browser. Please try uploading a photo instead.");
        setSelectedOption(null);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
      });
      
      setCameraStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video to be ready
        await videoRef.current.play();
      }
    } catch (error: any) {
      // Silently handle the error without console logging
      let errorMessage = "Could not access camera. ";
      
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        errorMessage += "Please allow camera permissions in your browser settings and try again.";
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        errorMessage += "No camera found on your device. Please try uploading a photo instead.";
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        errorMessage += "Camera is already in use by another application.";
      } else if (error.name === "OverconstrainedError") {
        errorMessage += "Camera doesn't meet the required specifications.";
      } else {
        errorMessage += "Please check your camera and browser settings.";
      }
      
      alert(errorMessage);
      setSelectedOption(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL("image/png");
        setUploadedImage(imageData);
        stopCamera();
        startAnalysis(imageData);
      }
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  const handleUploadPhoto = () => {
    setSelectedOption("upload");
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        setUploadedImage(imageData);
        // Start analysis with the image data directly
        setIsScanning(true);
        setTimeout(() => {
          onComplete(imageData, "upload");
        }, 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScanQR = () => {
    setSelectedOption("qr");
    alert("QR scanning feature - scan the QR code from your mobile device to upload a photo");
    setSelectedOption(null);
  };

  const startAnalysis = (imageData: string) => {
    setIsScanning(true);
    setTimeout(() => {
      onComplete(imageData, "camera");
    }, 3000);
  };

  const resetSelection = () => {
    setSelectedOption(null);
    setUploadedImage(null);
    setIsScanning(false);
    stopCamera();
  };

  // ==========================
  // PANTALLA DE "ANALYZING"
  // ==========================
  if (isScanning && uploadedImage) {
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
              Our AI is processing your image and generating personalized insights
            </p>
            <div className="relative w-full max-w-md mx-auto aspect-[4/5] rounded-2xl overflow-hidden border-4 border-[#FF6B4A]">
              <img src={uploadedImage} alt="Analyzing" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FF6B4A]/20 to-transparent animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================
  // PANTALLA "TAKE A PHOTO"
  // ==========================
  if (selectedOption === "camera" && !uploadedImage) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
        {/* HEADER */}
        <header className="bg-white border-b border-[#E5E5E5]">
          <div className="max-w-5xl mx-auto px-6 md:px-8 py-4 md:py-6 flex items-start justify-between">
            <div>
              <h1
                className="text-[#18212D] font-['Manrope',sans-serif]"
                style={{ fontSize: "28px", lineHeight: "36px" }}
              >
                Take a Photo
              </h1>
              <p className="text-[#6B7280] mt-1 md:mt-2 font-['Manrope',sans-serif]">
                Position your face in the frame for best results
              </p>
            </div>
            <img src={bloomLogo} alt="Bloom" className="h-12" />
          </div>
        </header>

        {/* CONTENIDO */}
        <main className="flex-1 flex items-center justify-center px-4 md:px-8 py-8 md:py-12">
          <div className="w-full max-w-5xl flex flex-col items-center">
            {/* Caja de cámara */}
            <div className="relative w-full max-w-md md:max-w-lg aspect-[4/5] rounded-3xl overflow-hidden bg-black shadow-lg">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* borde exterior suave */}
              <div className="absolute inset-0 border border-white/20 rounded-3xl pointer-events-none" />
              {/* círculo guía como en la captura */}
              <div className="absolute inset-[18%] md:inset-[20%] border-[2px] border-[#FF6B4A]/70 rounded-full pointer-events-none" />
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
              <Button
                onClick={resetSelection}
                className="h-12 md:h-14 px-8 bg-white hover:bg-[#F5F5F5] text-[#18212D] rounded-full shadow-md border border-[#E5E5E5] font-['Manrope',sans-serif]"
              >
                Cancel
              </Button>
              <Button
                onClick={capturePhoto}
                className="h-12 md:h-14 px-10 md:px-12 bg-gradient-to-r from-[#FF6B4A] to-[#FFA94D] hover:from-[#E74C3C] hover:to-[#FF8C42] text-white rounded-full shadow-md border-0 font-['Manrope',sans-serif]"
              >
                Capture Photo
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ==========================
  // PANTALLA DE OPCIONES (INICIO)
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
              Please ensure good lighting and remove any makeup or accessories for the most accurate
              analysis.
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
                    Face the camera directly with neutral expression
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
            {/* Take Photo */}
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
                Use your webcam to capture a photo right now
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