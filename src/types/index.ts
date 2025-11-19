// ============================================
// TYPE DEFINITIONS FOR BLOOM SKIN ANALYSIS
// ============================================

export type Screen = 
  | "web-consultation"
  | "web-scan"
  | "web-results"
  | "web-dashboard";

export interface SkinMetric {
  id: string;
  name: string;
  icon: any;
  score: number;
  strengthScore: number;
  concernScore: number;
  status: "Needs Attention" | "Moderate" | "Good" | "Excellent";
  color: string;
  gradient: string;
  description: string;
  insight: string;
  biomarkers: Array<{
    label: string;
    value: string;
  }>;
  recommendation: string;
  trend: number[];
  zones: {
    forehead: number;
    leftCheek: number;
    rightCheek: number;
    nose: number;
    chin: number;
  };
}

export interface OverallHealth {
  score: number;
  skinTone: string;
  itaAngle: string;
  perceivedAge: number;
  actualAge: number;
  ageAdvantage: string;
  skinType: string;
}

export interface RecommendationCategory {
  category: string;
  icon: any;
  products: Array<{
    name: string;
    reason: string;
  }>;
}
