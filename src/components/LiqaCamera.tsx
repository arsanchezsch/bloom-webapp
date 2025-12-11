// src/components/LiqaCamera.tsx
import { useEffect, useRef, useState } from "react";

const LIQA_SOURCE_URL = import.meta.env.VITE_LIQA_SOURCE_URL as
  | string
  | undefined;

// Soportamos BOTH: VITE_LIQA_LICENSE_KEY (prod) y VITE_LIQA_CLIENT_KEY (local)
const LIQA_LICENSE_KEY =
  (import.meta.env.VITE_LIQA_LICENSE_KEY as string | undefined) ??
  (import.meta.env.VITE_LIQA_CLIENT_KEY as string | undefined);

interface LiqaCameraProps {
  onImageData: (imageData: string) => void;
  onCancel?: () => void;
}

// Helper: Blob -> base64
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function LiqaCamera({ onImageData, onCancel }: LiqaCameraProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Cargar liqa.js una sola vez
  useEffect(() => {
    if (!LIQA_SOURCE_URL) {
      console.error("VITE_LIQA_SOURCE_URL is not defined");
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-liqa="true"]',
    );

    if (existing) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.type = "module";
    script.src = `${LIQA_SOURCE_URL.replace(/\/$/, "")}/liqa.js`;
    script.async = true;
    script.dataset.liqa = "true";

    script.onload = () => {
      console.log("[LIQA] script loaded");
      setScriptLoaded(true);
    };
    script.onerror = () => {
      console.error("[LIQA] failed to load script");
    };

    document.body.appendChild(script);
  }, []);

  // Escuchar evento "captures"
  useEffect(() => {
    if (!scriptLoaded) return;
    if (!containerRef.current) return;

    const liqaElement = containerRef.current.querySelector(
      "hautai-liqa",
    ) as HautaiLiqaElement | null;
    if (!liqaElement) return;

    const handleCaptures = async (
      event: CustomEvent<LiqaImageCapture[]>,
    ) => {
      try {
        const captures = event.detail || [];
        if (!captures.length) return;

        // Pedimos todos los blobs
        const blobs = await Promise.all(
          captures.map((capture) => capture.blob()),
        );
        if (!blobs.length) return;

        // 🟢 Elegimos SIEMPRE el blob de mayor tamaño (mejor calidad)
        let bestBlob = blobs[0];
        for (const blob of blobs) {
          if (blob.size > bestBlob.size) {
            bestBlob = blob;
          }
        }

        console.log(
          "[LIQA] captures:",
          blobs.length,
          "chosen blob size:",
          bestBlob.size,
        );

        const imageData = await blobToBase64(bestBlob);
        onImageData(imageData);
      } catch (err) {
        console.error("[LIQA] error processing captures", err);
      }
    };

    liqaElement.addEventListener("captures", handleCaptures as any);

    return () => {
      liqaElement.removeEventListener("captures", handleCaptures as any);
    };
  }, [scriptLoaded, onImageData]);

  // Si falta la key o la URL, no montamos la cámara
  if (!LIQA_LICENSE_KEY || !LIQA_SOURCE_URL) {
    console.warn(
      "[LIQA] Missing license key or source URL",
      { LIQA_SOURCE_URL, LIQA_LICENSE_KEY: !!LIQA_LICENSE_KEY },
    );
    return null;
  }

  // ✅ Misma UX que en tu screenshot (tarjeta centrada)
  return (
    <div className="w-full flex flex-col items-center mt-10">
      {/* Cámara */}
      <div ref={containerRef}>
        <hautai-liqa
          license={LIQA_LICENSE_KEY}
          style={{
            width: "400px", // mantenemos la “tarjeta” visual
            height: "600px",
            display: "block",
            borderRadius: "22px",
            overflow: "hidden",
          }}
        ></hautai-liqa>
      </div>

      {/* Botón Cancel */}
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="
            mt-6
            px-6
            py-2.5
            bg-white
            text-[#18212D]
            text-sm
            rounded-full
            border border-[#E5E7EB]
            shadow-sm
            hover:bg-[#F9FAFB]
            transition
          "
        >
          Cancel
        </button>
      )}
    </div>
  );
}
