// ============================================
// SKIN ANALYSIS DATA CONSTANTS
// ============================================

import {
  Circle,
  Droplets,
  Waves,
  Palette,
  Cloud,
  Activity,
  Sun,
  User,
  Sparkles,
} from "lucide-react";
import type {
  SkinMetric,
  OverallHealth,
  RecommendationCategory,
} from "../types";

// Mock data for skin metrics - In production, this would come from AI analysis
export const skinMetrics: SkinMetric[] = [
  {
    id: "acne",
    name: "Acne",
    icon: Circle,
    score: 65,
    strengthScore: 30,
    concernScore: 75,
    status: "Needs Attention",
    color: "#FF6B4A",
    gradient: "from-[#FFF5F3] to-[#FFE5DD]",
    description:
      "Active breakouts and inflammation detected primarily in T-zone area.",
    insight: "Moderate inflammatory response with some comedonal acne",
    biomarkers: [
      { label: "Number of acne regions", value: "12" },
      { label: "Average intensity", value: "Medium" },
    ],
    recommendation:
      "Use salicylic acid 2% cleanser daily and benzoyl peroxide spot treatment",
    trend: [55, 58, 62, 65],
    zones: {
      forehead: 72,
      leftCheek: 58,
      rightCheek: 60,
      nose: 75,
      chin: 68,
    },
  },

  {
    id: "redness",
    name: "Redness",
    icon: Activity,
    score: 68,
    strengthScore: 55,
    concernScore: 52,
    status: "Moderate",
    color: "#FF6B4A",
    gradient: "from-[#FFF5F3] to-[#FFE5DD]",
    description:
      "Mild erythema present, possibly due to sensitivity or mild rosacea.",
    insight: "Increased vascularity in central facial areas",
    biomarkers: [
      { label: "Local score", value: "72" },
      { label: "Global score", value: "68" },
    ],
    recommendation:
      "Use fragrance-free products and azelaic acid to reduce redness",
    trend: [65, 66, 67, 68],
    zones: {
      forehead: 65,
      leftCheek: 72,
      rightCheek: 70,
      nose: 75,
      chin: 62,
    },
  },

  {
    id: "pores",
    name: "Pores",
    icon: Cloud,
    score: 55,
    strengthScore: 40,
    concernScore: 70,
    status: "Needs Attention",
    color: "#FF6B4A",
    gradient: "from-[#FFF5F3] to-[#FFE5DD]",
    description: "Enlarged pores visible in T-zone with moderate congestion.",
    insight: "Moderate pore visibility with some congestion",
    biomarkers: [
      { label: "Number of pores", value: "2,845" },
      { label: "Density", value: "High" },
    ],
    recommendation: "Niacinamide 10% + retinol for pore refinement",
    trend: [52, 53, 54, 55],
    zones: {
      forehead: 58,
      leftCheek: 50,
      rightCheek: 52,
      nose: 70,
      chin: 55,
    },
  },

  // 🔁 HYDRATION -> SAGGING
  {
    id: "sagging",
    name: "Sagging",
    icon: Droplets,
    score: 78,
    strengthScore: 85,
    concernScore: 40,
    status: "Good",
    color: "#FF6B4A",
    gradient: "from-[#FFF5F3] to-[#FFE5DD]",
    description:
      "Mild loss of firmness with early signs of skin laxity in lower face.",
    insight: "Overall good firmness with localized areas starting to lose tone",
    biomarkers: [
      { label: "Sagging index", value: "Moderate" },
    ],
    recommendation:
      "Peptides + retinoids to support collagen and improve firmness",
    trend: [72, 75, 76, 78],
    zones: {
      forehead: 80,
      leftCheek: 72,
      rightCheek: 75,
      nose: 82,
      chin: 78,
    },
  },

  {
    id: "pigmentation",
    name: "Pigmentation",
    icon: Palette,
    score: 72,
    strengthScore: 65,
    concernScore: 45,
    status: "Good",
    color: "#FF6B4A",
    gradient: "from-[#FFF5F3] to-[#FFE5DD]",
    description: "Even skin tone with minor dark spots.",
    insight: "Localized hyperpigmentation in sun-exposed zones",
    biomarkers: [
      { label: "Number of spots", value: "18" },
      { label: "Average size", value: "2.3 mm" },
    ],
    recommendation: "SPF 50 daily + Vitamin C serum",
    trend: [68, 70, 71, 72],
    zones: {
      forehead: 75,
      leftCheek: 68,
      rightCheek: 70,
      nose: 72,
      chin: 75,
    },
  },

  // 🔁 TRANSLUCENCY -> DARK CIRCLES
  {
    id: "dark_circles",
    name: "Dark Circles",
    icon: Waves,
    score: 82,
    strengthScore: 88,
    concernScore: 30,
    status: "Excellent",
    color: "#FF6B4A",
    gradient: "from-[#FFF5F3] to-[#FFE5DD]",
    description:
      "Mild under-eye darkness with generally bright and rested appearance.",
    insight:
      "Good microcirculation with slight pigment and vascular visibility under the eyes",
    biomarkers: [
      { label: "Under-eye intensity", value: "Low to Moderate" },
      { label: "Coverage area", value: "Localized" },
    ],
    recommendation:
      "Caffeine + brightening eye serum and consistent sun protection",
    trend: [78, 79, 81, 82],
    zones: {
      forehead: 85,
      leftCheek: 80,
      rightCheek: 82,
      nose: 78,
      chin: 84,
    },
  },

  {
    id: "lines_wrinkles",
    name: "Lines & Wrinkles",
    icon: Activity,
    score: 75,
    strengthScore: 70,
    concernScore: 38,
    status: "Good",
    color: "#FF6B4A",
    gradient: "from-[#FFF5F3] to-[#FFE5DD]",
    description: "Mild expression lines around forehead and eyes.",
    insight: "Early signs of loss of elasticity",
    biomarkers: [
      { label: "Fine line depth", value: "Low" },
      { label: "Elasticity loss", value: "Mild" },
    ],
    recommendation: "Retinol + peptide cream",
    trend: [73, 74, 74, 75],
    zones: {
      forehead: 72,
      leftCheek: 78,
      rightCheek: 77,
      nose: 80,
      chin: 76,
    },
  },
];

export const overallHealth: OverallHealth = {
  score: 72,
  skinTone: "Fair to Light",
  itaAngle: "22.5°",
  perceivedAge: 28,
  actualAge: 30,
  ageAdvantage: "+2 years younger",
  skinType: "Combination",
};

export const recommendations: RecommendationCategory[] = [
  {
    category: "Morning Routine",
    icon: Sun,
    products: [
      { name: "Gentle Cleanser", reason: "Maintain barrier function" },
      {
        name: "Vitamin C Serum 15%",
        reason: "Antioxidant protection & brightening",
      },
      {
        name: "Niacinamide 10%",
        reason: "Pore refinement & oil control",
      },
      {
        name: "Broad Spectrum SPF 50+",
        reason: "UV protection essential",
      },
    ],
  },
  {
    category: "Evening Routine",
    icon: Circle,
    products: [
      { name: "Oil Cleanser", reason: "Remove sunscreen & impurities" },
      {
        name: "Salicylic Acid 2%",
        reason: "Acne control & pore care",
      },
      {
        name: "Retinol 0.5%",
        reason: "Anti-aging & texture improvement",
      },
      {
        name: "Ceramide Moisturizer",
        reason: "Barrier repair overnight",
      },
    ],
  },
  {
    category: "Weekly Treatments",
    icon: Sparkles,
    products: [
      { name: "AHA/BHA Peel Mask", reason: "Deep exfoliation for texture" },
      {
        name: "Hydrating Sheet Mask",
        reason: "Boost hydration levels",
      },
      {
        name: "Clay Mask (T-zone)",
        reason: "Oil control & pore cleansing",
      },
    ],
  },
];
