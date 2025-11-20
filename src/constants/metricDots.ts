// src/constants/metricDots.ts

export interface MetricDot {
  id: string;
  metricId: string; // 'acne' | 'pores'
  x: number;
  y: number;
}

export const metricDots: MetricDot[] = [
  // ==== ACNE (rojo) ====
  { id: "acne-forehead-1", metricId: "acne", x: 50, y: 30 },
  { id: "acne-forehead-2", metricId: "acne", x: 42, y: 28 },
  { id: "acne-forehead-3", metricId: "acne", x: 58, y: 28 },
  { id: "acne-cheek-left-1", metricId: "acne", x: 39, y: 50 },
  { id: "acne-cheek-left-2", metricId: "acne", x: 36, y: 55 },
  { id: "acne-cheek-left-3", metricId: "acne", x: 41, y: 58 },
  { id: "acne-cheek-right-1", metricId: "acne", x: 61, y: 50 },
  { id: "acne-cheek-right-2", metricId: "acne", x: 64, y: 55 },
  { id: "acne-cheek-right-3", metricId: "acne", x: 59, y: 58 },
  { id: "acne-chin-1", metricId: "acne", x: 50, y: 72 },
  { id: "acne-chin-2", metricId: "acne", x: 47, y: 74 },

  // ==== PORES (negro / gris oscuro) ====
  { id: "pores-forehead-1", metricId: "pores", x: 48, y: 32 },
  { id: "pores-forehead-2", metricId: "pores", x: 52, y: 34 },
  { id: "pores-forehead-3", metricId: "pores", x: 45, y: 36 },
  { id: "pores-forehead-4", metricId: "pores", x: 55, y: 36 },
  { id: "pores-nose-1", metricId: "pores", x: 50, y: 48 },
  { id: "pores-nose-2", metricId: "pores", x: 48, y: 50 },
  { id: "pores-nose-3", metricId: "pores", x: 52, y: 52 },
  { id: "pores-cheek-left-1", metricId: "pores", x: 42, y: 52 },
  { id: "pores-cheek-left-2", metricId: "pores", x: 40, y: 55 },
  { id: "pores-cheek-left-3", metricId: "pores", x: 43, y: 57 },
  { id: "pores-cheek-right-1", metricId: "pores", x: 58, y: 52 },
  { id: "pores-cheek-right-2", metricId: "pores", x: 60, y: 55 },
  { id: "pores-cheek-right-3", metricId: "pores", x: 57, y: 57 },
];