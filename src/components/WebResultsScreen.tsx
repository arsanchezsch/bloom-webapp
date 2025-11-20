// ============================================
// WEB RESULTS SCREEN
// Main screen showing skin analysis results
// ============================================

import { useState } from "react";
import { Button } from "./ui/button";
import { Calendar, LayoutDashboard, Share2, Download } from "lucide-react";
import bloomLogo from "figma:asset/73a8a80abf64277705c5d856c147464ec33b1a04.png";
import exampleImage from "figma:asset/dab1c1df3e9d3b8d3a4ac9926dcfb3acb1003b4a.png";

// Data & types
import {
  skinMetrics,
  overallHealth,
  recommendations,
} from "../constants/skinAnalysis";
import { formatDate } from "../utils/helpers";
import type { SkinMetric } from "../types";

// Sub-components
import { AnalyzedPhoto } from "./results/AnalyzedPhoto";
import { RadarOverview } from "./results/RadarOverview";
import { MetricCard } from "./results/MetricCard";
import { MetricDetailModal } from "./results/MetricDetailModal";
import { ShareModal } from "./results/ShareModal";
import { RoutineCard } from "./results/RoutineCard";

interface WebResultsScreenProps {
  capturedImage: string | null;
  onViewDashboard?: () => void;
}

const SKIN_TYPE_ID = "skin_type";

export function WebResultsScreen({
  capturedImage,
  onViewDashboard,
}: WebResultsScreenProps) {
  const [selectedMetric, setSelectedMetric] = useState<SkinMetric | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // métrica activa SOLO para la foto (dropdown)
  const [activeMetricId, setActiveMetricId] = useState<string | null>(null);

  // 🔥 Opciones para el dropdown de la foto (SIN skin_type)
  const metricOptionsForPhoto = skinMetrics
    .filter((m) => m.id !== SKIN_TYPE_ID)
    .map((m) => ({
      id: m.id,
      name: m.name,
      // por si tienes label adicional
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      label: (m as any).label,
    }));

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <div className="bg-white border-b border-[#E5E5E5] px-8 py-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1
                className="text-[#18212D] font-['Manrope',sans-serif]"
                style={{ fontSize: "32px", lineHeight: "40px" }}
              >
                Your Skin Analysis Results
              </h1>
              <p className="text-[#6B7280] mt-1 font-['Manrope',sans-serif] flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Analyzed on {formatDate(new Date())}
              </p>
            </div>
            <img src={bloomLogo} alt="Bloom" className="h-12" />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-3">
            <Button
              type="button"
              onClick={() => onViewDashboard?.()}
              className="h-12 px-6 bg-white hover:bg-gradient-to-r hover:from-[#FFF5F3] hover:to-[#FFE5DD] text-[#18212D] hover:text-[#FF6B4A] rounded-full border border-[#E5E5E5] hover:border-[#FF6B4A]/30 font-['Manrope',sans-serif] transition-all duration-300"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
            <Button
              onClick={() => setShowShareModal(true)}
              className="h-12 px-6 bg-white hover:bg-gradient-to-r hover:from-[#FFF5F3] hover:to-[#FFE5DD] text-[#18212D] hover:text-[#FF6B4A] rounded-full border border-[#E5E5E5] hover:border-[#FF6B4A]/30 font-['Manrope',sans-serif] transition-all duration-300"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              className="h-12 px-6 bg-white hover:bg-gradient-to-r hover:from-[#FFF5F3] hover:to-[#FFE5DD] text-[#18212D] hover:text-[#FF6B4A] rounded-full border border-[#E5E5E5] hover:border-[#FF6B4A]/30 font-['Manrope',sans-serif] transition-all duration-300"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Photo + Radar */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnalyzedPhoto
              imageUrl={capturedImage || exampleImage}
              selectedMetricId={activeMetricId}
              metrics={metricOptionsForPhoto}
              onMetricChange={(id) => setActiveMetricId(id)}
            />
            <RadarOverview metrics={skinMetrics} overallHealth={overallHealth} />
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="mb-8">
          <h2
            className="text-[#18212D] mb-6 font-['Manrope',sans-serif]"
            style={{ fontSize: "24px", lineHeight: "32px" }}
          >
            Detailed Analysis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {skinMetrics.map((metric) => (
              <MetricCard
                key={metric.id}
                metric={metric}
                onClick={(m) => {
                  // solo abrimos modal; la foto la controla el dropdown
                  setSelectedMetric(m);
                }}
              />
            ))}
          </div>
        </div>

        {/* Personalized Recommendations */}
        <div className="mb-8">
          <h2
            className="text-[#18212D] mb-6 font-['Manrope',sans-serif]"
            style={{ fontSize: "24px", lineHeight: "32px" }}
          >
            Personalized Skincare Routine
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {recommendations.map((routine, idx) => (
              <RoutineCard key={idx} routine={routine} />
            ))}
          </div>
        </div>

        {/* CTA Dashboard */}
        {onViewDashboard && (
          <div className="bg-gradient-to-br from-white to-orange-50/30 rounded-3xl border border-[#E5E5E5] p-12 text-center shadow-lg">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF6B4A] to-[#FFA94D] flex items-center justify-center mx-auto mb-6">
              <LayoutDashboard className="w-10 h-10 text-white" />
            </div>
            <h2
              className="text-[#18212D] mb-3 font-['Manrope',sans-serif]"
              style={{ fontSize: "28px", lineHeight: "36px" }}
            >
              Ready to Track Your Progress?
            </h2>
            <p className="text-[#6B7280] mb-8 max-w-2xl mx-auto font-['Manrope',sans-serif]">
              Access your personalized dashboard to chat with your AI assistant,
              monitor your skin improvements over time, and view your complete
              scan history.
            </p>
            <Button
              type="button"
              onClick={() => onViewDashboard?.()}
              className="h-14 px-12 bg-gradient-to-r from-[#FF6B4A] to-[#FFA94D] hover:from-[#E74C3C] hover:to-[#FF8C42] text-white rounded-full shadow-xl border-0 font-['Manrope',sans-serif] text-lg"
            >
              Go to Dashboard
            </Button>
          </div>
        )}
      </div>

      {/* Modals */}
      <MetricDetailModal
        metric={selectedMetric}
        onClose={() => setSelectedMetric(null)}
        imageUrl={capturedImage || exampleImage}
      />
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
}
