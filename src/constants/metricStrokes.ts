// src/constants/metricStrokes.ts

export const LINES_METRIC_ID = "lines_wrinkles";

export interface MetricStroke {
  id: string;
  metricId: string; // <--- este campo es fundamental
  x: number;
  y: number;
  length: number;
  rotation: number;
  color?: string;
  thickness?: number;
}

export const metricStrokes: MetricStroke[] = [
  // ===== Frente =====
  {
    id: "lines-forehead-1",
    metricId: LINES_METRIC_ID,  // <--- este campo DEBE aparecer
    x: 50,
    y: 26,
    length: 28,
    rotation: 0,
    thickness: 0.6,
  },
  {
    id: "lines-forehead-2",
    metricId: LINES_METRIC_ID,
    x: 50,
    y: 30,
    length: 26,
    rotation: 0,
    thickness: 0.5,
  },
  {
    id: "lines-forehead-3",
    metricId: LINES_METRIC_ID,
    x: 50,
    y: 34,
    length: 22,
    rotation: 0,
    thickness: 0.4,
  },
  // ===== Patas de gallo izquierda =====
  {
    id: "lines-crows-left-1",
    metricId: LINES_METRIC_ID,
    x: 36,
    y: 43,
    length: 9,
    rotation: -28,
    thickness: 0.4,
  },
  {
    id: "lines-crows-left-2",
    metricId: LINES_METRIC_ID,
    x: 37,
    y: 46,
    length: 10,
    rotation: -18,
    thickness: 0.4,
  },
  // ===== Patas de gallo derecha =====
  {
    id: "lines-crows-right-1",
    metricId: LINES_METRIC_ID,
    x: 64,
    y: 43,
    length: 9,
    rotation: 28,
    thickness: 0.4,
  },
  {
    id: "lines-crows-right-2",
    metricId: LINES_METRIC_ID,
    x: 63,
    y: 46,
    length: 10,
    rotation: 18,
    thickness: 0.4,
  },
  // ===== Líneas de sonrisa / surcos nasolabiales =====
  {
    id: "lines-smile-left-1",
    metricId: LINES_METRIC_ID,
    x: 44,
    y: 63,
    length: 14,
    rotation: 72,
    thickness: 0.6,
  },
  {
    id: "lines-smile-right-1",
    metricId: LINES_METRIC_ID,
    x: 56,
    y: 63,
    length: 14,
    rotation: -72,
    thickness: 0.6,
  },
];