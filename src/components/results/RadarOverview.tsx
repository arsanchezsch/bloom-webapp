// ============================================
// RADAR OVERVIEW COMPONENT
// Displays radar chart with key metrics
// ============================================

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer
} from "recharts";
import type { SkinMetric, OverallHealth } from "../../types";
import { getScoreColor } from "../../utils/helpers";

interface RadarOverviewProps {
  metrics: SkinMetric[];
  overallHealth: OverallHealth;
}

export function RadarOverview({ metrics, overallHealth }: RadarOverviewProps) {
  const radarData = metrics.slice(0, 5).map(m => ({
    metric: m.name,
    value: m.score,
    fullMark: 100
  }));

  return (
    <div className="bg-white rounded-3xl border border-[#E5E5E5] p-6 shadow-sm">
      <h3 
        className="text-[#18212D] mb-4 font-['Manrope',sans-serif]" 
        style={{ fontSize: '20px', lineHeight: '28px' }}
      >
        Key Metrics Overview
      </h3>
      
      <div className="flex items-center justify-center">
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#E5E5E5" strokeWidth={1.5} />
            <PolarAngleAxis 
              dataKey="metric" 
              tick={{ fill: '#6B7280', fontSize: 13, fontFamily: 'Manrope, sans-serif' }}
            />
            <Radar
              dataKey="value"
              stroke="#FF6B4A"
              fill="#FF6B4A"
              fillOpacity={0.25}
              strokeWidth={3}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-6">
        {/* Overall Health Score */}
        <div className="flex items-center justify-between bg-[#F5F5F5] rounded-xl px-5 py-5">
          <span className="text-[#6B7280] font-['Manrope',sans-serif]" style={{ fontSize: '16px' }}>
            Overall Health
          </span>
          <span 
            className="font-['Manrope',sans-serif]" 
            style={{ fontSize: '26px', color: getScoreColor(overallHealth.score) }}
          >
            {overallHealth.score}
          </span>
        </div>
        
        {/* Skin Type */}
        <div className="flex items-center justify-between bg-[#F5F5F5] rounded-xl px-5 py-5">
          <span className="text-[#6B7280] font-['Manrope',sans-serif]" style={{ fontSize: '16px' }}>
            Skin Type
          </span>
          <span className="font-['Manrope',sans-serif] text-[#18212D]" style={{ fontSize: '20px' }}>
            {overallHealth.skinType}
          </span>
        </div>
        
        {/* Skin Age */}
        <div className="flex items-center justify-between bg-[#F5F5F5] rounded-xl px-5 py-5">
          <span className="text-[#6B7280] font-['Manrope',sans-serif]" style={{ fontSize: '16px' }}>
            Skin Age
          </span>
          <span className="font-['Manrope',sans-serif] text-[#10B981]" style={{ fontSize: '26px' }}>
            {overallHealth.perceivedAge} yrs
          </span>
        </div>
        
        {/* Skin Tone */}
        <div className="bg-[#F5F5F5] rounded-xl px-5 py-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#6B7280] font-['Manrope',sans-serif]" style={{ fontSize: '16px' }}>
              Skin Tone
            </span>
            <span className="font-['Manrope',sans-serif] text-[#18212D]" style={{ fontSize: '17px' }}>
              {overallHealth.skinTone}
            </span>
          </div>
          {/* Color gradient bar */}
          <div className="h-2.5 rounded-full bg-gradient-to-r from-[#F5D6C6] via-[#D4A373] to-[#6B4423]" />
        </div>
      </div>
    </div>
  );
}
