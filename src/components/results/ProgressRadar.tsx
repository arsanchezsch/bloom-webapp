// src/components/results/ProgressRadar.tsx
// ============================================
// PROGRESS RADAR
// Muestra el promedio de las últimas 3 scans
// con el mismo estilo que RadarOverview
// ============================================

import React from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import type { ScanRecord } from "../../services/fakeBackend";
import { skinMetrics as defaultSkinMetrics } from "../../constants/skinAnalysis";

interface ProgressRadarProps {
  scans: ScanRecord[];
}

// IDs que usamos en el radar principal de resultados
const METRIC_IDS = [
  "acne",
  "redness",
  "pores",
  "hydration",
  "pigmentation",
  "lines_wrinkles",
];

export const ProgressRadar: React.FC<ProgressRadarProps> = ({ scans = [] }) => {
  // Nos quedamos solo con las últimas 3 scans
  const recentScans = scans.slice(0, 3);

  const radarData = METRIC_IDS.map((metricId) => {
    // nombre bonito desde skinAnalysis
    const fallbackMetric = defaultSkinMetrics.find((m) => m.id === metricId);
    const label = fallbackMetric?.name ?? metricId;

    // recogemos el score de esa métrica en cada scan
    const scores: number[] = [];

    recentScans.forEach((scan) => {
      const metricsFromScan =
        (scan as any).analysis?.skinMetrics ?? defaultSkinMetrics;

      const metric = metricsFromScan.find((m: any) => m.id === metricId);
      if (metric?.score != null) {
        scores.push(metric.score);
      }
    });

    const avgScore =
      scores.length > 0
        ? Math.round(
            scores.reduce((sum, value) => sum + value, 0) / scores.length
          )
        : 0;

    return {
      metric: label,
      score: avgScore,
    };
  });

  const hasData = radarData.some((d) => d.score > 0);

  return (
    <div className="bg-white rounded-2xl border border-[#E5E5E5] p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3
          className="text-[#18212D] font-['Manrope',sans-serif]"
          style={{ fontSize: "20px", lineHeight: "28px" }}
        >
          Key Metrics – Last 3 Scans
        </h3>
        <p className="text-xs text-[#6B7280] font-['Manrope',sans-serif]">
          Average score per metric · 0–100
        </p>
      </div>

      {hasData ? (
        <div className="w-full h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="#E5E5E5" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fill: "#6B7280", fontSize: 11 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: "#9CA3AF", fontSize: 10 }}
                stroke="#E5E5E5"
              />
              <RechartsTooltip
                formatter={(value: any) => [`${value} / 100`, "Score"]}
                labelFormatter={(label: string) => `${label}`}
              />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#FF6B4A"
                fill="#FF6B4A"
                fillOpacity={0.25} // igual que RadarOverview
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-sm text-[#6B7280] font-['Manrope',sans-serif]">
          We’ll show your progress radar once you have at least one completed
          scan.
        </p>
      )}
    </div>
  );
};