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
  Zap,
  User,
  Sparkles
} from "lucide-react";
import type { SkinMetric, OverallHealth, RecommendationCategory } from "../types";

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
    description: "Active breakouts and inflammation detected primarily in T-zone area. Comedonal and inflammatory acne present.",
    insight: "Moderate inflammatory response with some comedonal acne",
    biomarkers: [
      { label: "Number of acne regions", value: "12" },
      { label: "Average intensity", value: "Medium" }
    ],
    recommendation: "Use salicylic acid 2% cleanser daily and benzoyl peroxide spot treatment",
    trend: [55, 58, 62, 65],
    zones: {
      forehead: 72,
      leftCheek: 58,
      rightCheek: 60,
      nose: 75,
      chin: 68
    }
  },
  { 
    id: "redness",
    name: "Redness",
    icon: Zap,
    score: 68,
    strengthScore: 55,
    concernScore: 52,
    status: "Moderate",
    color: "#FF6B4A",
    gradient: "from-[#FFF5F3] to-[#FFE5DD]",
    description: "Mild erythema present, possibly due to sensitivity or mild rosacea. Some capillary visibility.",
    insight: "Increased vascularity in central facial areas",
    biomarkers: [
      { label: "Local score", value: "72" },
      { label: "Global score", value: "68" }
    ],
    recommendation: "Gentle, fragrance-free products and azelaic acid for redness control",
    trend: [65, 66, 67, 68],
    zones: {
      forehead: 65,
      leftCheek: 72,
      rightCheek: 70,
      nose: 75,
      chin: 62
    }
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
    description: "Enlarged pores visible in T-zone due to increased sebum production and genetic factors.",
    insight: "Moderate pore visibility with some congestion detected",
    biomarkers: [
      { label: "Number of pores", value: "2,845" },
      { label: "Density", value: "High" }
    ],
    recommendation: "Use niacinamide 10% serum and retinol for pore refinement",
    trend: [52, 53, 54, 55],
    zones: {
      forehead: 58,
      leftCheek: 50,
      rightCheek: 52,
      nose: 70,
      chin: 55
    }
  },
  { 
    id: "hydration",
    name: "Hydration",
    icon: Droplets,
    score: 78,
    strengthScore: 85,
    concernScore: 40,
    status: "Good",
    color: "#FF6B4A",
    gradient: "from-[#FFF5F3] to-[#FFE5DD]",
    description: "Skin maintains adequate moisture levels with some localized dry patches in cheek areas.",
    insight: "Strong moisture barrier function in most facial zones",
    biomarkers: [
      { label: "Hydration level", value: "78%" }
    ],
    recommendation: "Continue with hyaluronic acid serum and ceramide-rich moisturizer",
    trend: [72, 75, 76, 78],
    zones: {
      forehead: 80,
      leftCheek: 72,
      rightCheek: 75,
      nose: 82,
      chin: 78
    }
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
    description: "Even skin tone with minor hyperpigmentation in sun-exposed areas. No significant melasma detected.",
    insight: "Melanin distribution generally uniform with localized darkening",
    biomarkers: [
      { label: "Number of pigmentation spots", value: "18" },
      { label: "Average size", value: "2.3 mm" }
    ],
    recommendation: "Daily SPF 50+ and vitamin C serum for brightening",
    trend: [68, 70, 71, 72],
    zones: {
      forehead: 75,
      leftCheek: 68,
      rightCheek: 70,
      nose: 72,
      chin: 75
    }
  },
  { 
    id: "translucency",
    name: "Translucency",
    icon: Waves,
    score: 82,
    strengthScore: 88,
    concernScore: 30,
    status: "Excellent",
    color: "#FF6B4A",
    gradient: "from-[#FFF5F3] to-[#FFE5DD]",
    description: "High skin translucency indicating healthy, youthful skin structure with good collagen density.",
    insight: "Excellent light scattering properties and dermal density",
    biomarkers: [
      { label: "Translucency index", value: "82%" },
      { label: "Collagen density", value: "High" }
    ],
    recommendation: "Maintain with vitamin C and peptide serums for collagen support",
    trend: [78, 79, 81, 82],
    zones: {
      forehead: 85,
      leftCheek: 80,
      rightCheek: 82,
      nose: 78,
      chin: 84
    }
  },
  { 
    id: "lines",
    name: "Lines & Wrinkles",
    icon: Activity,
    score: 75,
    strengthScore: 70,
    concernScore: 38,
    status: "Good",
    color: "#FF6B4A",
    gradient: "from-[#FFF5F3] to-[#FFE5DD]",
    description: "Minimal fine lines with some expression lines beginning to form around eyes and forehead.",
    insight: "Early signs of photoaging with maintained elasticity",
    biomarkers: [
      { label: "Sagging score", value: "25" },
      { label: "Jowls grade", value: "Low" }
    ],
    recommendation: "Retinol 0.5% at night and peptide eye cream",
    trend: [73, 74, 74, 75],
    zones: {
      forehead: 72,
      leftCheek: 78,
      rightCheek: 77,
      nose: 80,
      chin: 76
    }
  },
  { 
    id: "skintype",
    name: "Skin Type",
    icon: User,
    score: 70,
    strengthScore: 68,
    concernScore: 42,
    status: "Good",
    color: "#FF6B4A",
    gradient: "from-[#FFF5F3] to-[#FFE5DD]",
    description: "Combination skin with oily T-zone and normal to dry U-zone. Balanced sebum distribution across different facial areas.",
    insight: "Well-maintained surface topology with minor irregularities",
    biomarkers: [
      { label: "U-zone skin type", value: "Normal-Dry" },
      { label: "T-zone skin type", value: "Oily" }
    ],
    recommendation: "Weekly chemical exfoliation with AHA/BHA combination",
    trend: [67, 68, 69, 70],
    zones: {
      forehead: 72,
      leftCheek: 68,
      rightCheek: 70,
      nose: 65,
      chin: 73
    }
  }
];

export const overallHealth: OverallHealth = {
  score: 72,
  skinTone: "Fair to Light",
  itaAngle: "22.5°",
  perceivedAge: 28,
  actualAge: 30,
  ageAdvantage: "+2 years younger",
  skinType: "Combination"
};

export const recommendations: RecommendationCategory[] = [
  {
    category: "Morning Routine",
    icon: Sun,
    products: [
      { name: "Gentle Cleanser", reason: "Maintain barrier function" },
      { name: "Vitamin C Serum 15%", reason: "Antioxidant protection & brightening" },
      { name: "Niacinamide 10%", reason: "Pore refinement & oil control" },
      { name: "Broad Spectrum SPF 50+", reason: "UV protection essential" }
    ]
  },
  {
    category: "Evening Routine",
    icon: Circle,
    products: [
      { name: "Oil Cleanser", reason: "Remove sunscreen & impurities" },
      { name: "Salicylic Acid 2%", reason: "Acne control & pore care" },
      { name: "Retinol 0.5%", reason: "Anti-aging & texture improvement" },
      { name: "Ceramide Moisturizer", reason: "Barrier repair overnight" }
    ]
  },
  {
    category: "Weekly Treatments",
    icon: Sparkles,
    products: [
      { name: "AHA/BHA Peel Mask", reason: "Deep exfoliation for texture" },
      { name: "Hydrating Sheet Mask", reason: "Boost hydration levels" },
      { name: "Clay Mask (T-zone)", reason: "Oil control & pore cleansing" }
    ]
  }
];
