// ============================================
// METRIC CARD COMPONENT
// Individual skin metric display card
// ============================================

import { LineChart, Line, ResponsiveContainer } from "recharts";
import type { SkinMetric } from "../../types";
import { getScoreColor, getStatusBadge } from "../../utils/helpers";

interface MetricCardProps {
  metric: SkinMetric;
  onClick: (metric: SkinMetric) => void;
}

export function MetricCard({ metric, onClick }: MetricCardProps) {
  const Icon = metric.icon;

  return (
    <div
      onClick={() => onClick(metric)}
      className="bg-white rounded-2xl border border-[#E5E5E5] p-6 hover:border-[#FF6B4A] hover:shadow-lg transition-all cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B4A] to-[#FFA94D] flex items-center justify-center group-hover:scale-110 transition-transform">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div
          className="text-2xl font-['Manrope',sans-serif]"
          style={{ color: getScoreColor(metric.score) }}
        >
          {metric.score}
        </div>
      </div>
      
      <h3 className="text-[#18212D] mb-2 font-['Manrope',sans-serif]">
        {metric.name}
      </h3>
      
      {/* Status Badge */}
      <div className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-['Manrope',sans-serif] mb-3 ${getStatusBadge(metric.status)}`}>
        {metric.status}
      </div>
      
      {/* Mini trend chart */}
      <div className="mt-3 h-8">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={metric.trend.map((v) => ({ value: v }))}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={getScoreColor(metric.score)}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
