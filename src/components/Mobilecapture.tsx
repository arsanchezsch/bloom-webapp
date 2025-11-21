import React, { useEffect } from "react";
import { WebSkinScan } from "./WebSkinScan";

export default function MobileCapture() {
  // Modo foto directamente
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#FBFAF9]">
      <WebSkinScan forceCameraMode={true} />
    </div>
  );
}
