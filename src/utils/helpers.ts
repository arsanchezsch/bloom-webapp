// ============================================
// UTILITY HELPER FUNCTIONS
// ============================================

/**
 * Returns color based on skin metric score
 * @param score - Skin metric score (0-100)
 * @returns Hex color code
 */
export const getScoreColor = (score: number): string => {
  if (score >= 75) return "#10B981"; // Green - Excellent
  if (score >= 60) return "#FFA94D"; // Orange - Good
  return "#FF6B4A"; // Red - Needs attention
};

/**
 * Returns Tailwind classes for status badge styling
 * @param status - Metric status string
 * @returns Tailwind CSS classes
 */
export const getStatusBadge = (status: string): string => {
  const styles: Record<string, string> = {
    "Needs Attention": "bg-[#FFE5DD] text-[#FF6B4A] border-[#FF6B4A]/20",
    "Moderate": "bg-[#FFF4E5] text-[#FFA94D] border-[#FFA94D]/20",
    "Good": "bg-[#D1FAE5] text-[#10B981] border-[#10B981]/20",
    "Excellent": "bg-[#D1FAE5] text-[#10B981] border-[#10B981]/20",
  };
  return styles[status] || styles["Good"];
};

/**
 * Formats date to readable string
 * @param date - Date object
 * @returns Formatted date string
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

/**
 * Formats time to readable string
 * @param date - Date object
 * @returns Formatted time string
 */
export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};
