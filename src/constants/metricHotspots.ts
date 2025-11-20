// src/constants/metricHotspots.ts

export interface MetricHotspot {
  id: string;
  metricId: string; // acne | redness | pores | hydration | pigmentation | translucency | ...
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const metricHotspots: MetricHotspot[] = [
  // ===== HYDRATION =====
  { id: "hydration-forehead", metricId: "hydration", label: "Forehead", x: 30, y: 18, width: 40, height: 20 },
  { id: "hydration-cheek-left", metricId: "hydration", label: "Left Cheek", x: 22, y: 40, width: 24, height: 28 },
  { id: "hydration-cheek-right", metricId: "hydration", label: "Right Cheek", x: 54, y: 40, width: 24, height: 28 },
  { id: "hydration-nose", metricId: "hydration", label: "Nose", x: 42, y: 38, width: 16, height: 18 },
  { id: "hydration-chin", metricId: "hydration", label: "Chin", x: 36, y: 64, width: 28, height: 16 },

  // ===== REDNESS =====
  { id: "redness-cheek-left", metricId: "redness", label: "Left Cheek", x: 30, y: 44, width: 20, height: 20 },
  { id: "redness-cheek-right", metricId: "redness", label: "Right Cheek", x: 50, y: 44, width: 20, height: 20 },
  { id: "redness-nose", metricId: "redness", label: "Nose", x: 43, y: 40, width: 14, height: 16 },

  // ===== PIGMENTATION =====
  { id: "pigmentation-forehead", metricId: "pigmentation", label: "Forehead", x: 32, y: 22, width: 36, height: 16 },
  { id: "pigmentation-cheek-left", metricId: "pigmentation", label: "Left Cheek", x: 30, y: 46, width: 18, height: 22 },
  { id: "pigmentation-cheek-right", metricId: "pigmentation", label: "Right Cheek", x: 52, y: 46, width: 18, height: 22 },

  // ===== TRANSLUCENCY =====
  { id: "translucency-forehead", metricId: "translucency", label: "Forehead", x: 32, y: 18, width: 34, height: 22 },
  { id: "translucency-cheek-left", metricId: "translucency", label: "Left Cheek", x: 30, y: 44, width: 20, height: 24 },
  { id: "translucency-cheek-right", metricId: "translucency", label: "Right Cheek", x: 50, y: 44, width: 20, height: 24 },
];