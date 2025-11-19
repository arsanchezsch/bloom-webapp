# Bloom Skin Analysis - Project Structure

## 📁 Directory Structure

```
/
├── App.tsx                          # Main app router and state management
├── types/
│   └── index.ts                     # TypeScript type definitions
├── constants/
│   └── skinAnalysis.ts              # Mock data for skin metrics and recommendations
├── utils/
│   └── helpers.ts                   # Utility functions (colors, formatting, etc.)
├── components/
│   ├── PersonalConsultation.tsx     # Initial consultation screen
│   ├── WebSkinScan.tsx              # Camera/upload photo screen
│   ├── WebResultsScreen.tsx         # Main results display screen
│   ├── WebDashboard.tsx             # Dashboard with chat, progress, calendar
│   ├── results/                     # Sub-components for results screen
│   │   ├── AnalyzedPhoto.tsx        # User's analyzed photo display
│   │   ├── RadarOverview.tsx        # Radar chart with key metrics
│   │   ├── MetricCard.tsx           # Individual metric card
│   │   ├── MetricDetailModal.tsx    # Detailed metric modal
│   │   ├── ShareModal.tsx           # Share results modal
│   │   └── RoutineCard.tsx          # Skincare routine recommendation card
│   ├── ui/                          # ShadCN UI components (DO NOT MODIFY)
│   └── figma/                       # Figma-specific components (PROTECTED)
├── imports/                         # SVG imports from Figma
└── styles/
    └── globals.css                  # Global styles and design tokens
```

## 🧩 Component Architecture

### Main Screens
- **App.tsx**: Central router managing screen navigation and state
- **PersonalConsultation**: Collects user information before analysis
- **WebSkinScan**: Handles photo capture (webcam/upload/QR)
- **WebResultsScreen**: Displays comprehensive skin analysis results
- **WebDashboard**: Post-analysis dashboard with AI chat and tracking

### Results Sub-Components
All located in `/components/results/`:
- Modular, reusable components
- Each handles a specific section of the results screen
- Easy to test and maintain independently

## 📊 Data Flow

```
1. User completes consultation → WebSkinScan
2. User captures/uploads photo → Analyzing screen (3s)
3. Photo data passed to App.tsx state → WebResultsScreen
4. Results displayed with captured image
5. User navigates to → WebDashboard
```

## 🎨 Design System

### Colors
- **Primary Orange**: `#FF6B4A` to `#FFA94D` (gradient)
- **Background**: `#F5F5F5`
- **Text Dark**: `#18212D`
- **Text Gray**: `#6B7280`
- **Success Green**: `#10B981`

### Typography
- **Font**: Manrope Regular (weight 400)
- **Sizes**: Defined in component styles (no Tailwind font classes)

### Spacing
- Generous padding for calm, spacious feel
- Consistent border-radius: `rounded-2xl`, `rounded-3xl`

## 🔧 Key Utilities

### `/utils/helpers.ts`
- `getScoreColor(score)`: Returns color based on metric score
- `getStatusBadge(status)`: Returns Tailwind classes for status badges
- `formatDate(date)`: Formats dates consistently
- `formatTime(date)`: Formats times consistently

### `/constants/skinAnalysis.ts`
- `skinMetrics[]`: Array of 8 skin analysis metrics
- `overallHealth{}`: Overall skin health data
- `recommendations[]`: Personalized routine recommendations

## 🚀 Scaling Guidelines

### Adding New Metrics
1. Add metric definition to `/constants/skinAnalysis.ts`
2. Ensure it follows the `SkinMetric` type in `/types/index.ts`
3. Component will automatically render it

### Adding New Screens
1. Add screen type to `/types/index.ts`
2. Create component in `/components/`
3. Add route case in `App.tsx`
4. Update navigation logic

### Creating New Components
1. Keep components small and focused (single responsibility)
2. Extract reusable logic to `/utils/helpers.ts`
3. Define types in `/types/index.ts`
4. Use constants from `/constants/` folder

## 📝 Code Style

- **TypeScript**: All new code should use proper typing
- **Comments**: Add section headers for clarity
- **Naming**: Descriptive function/variable names
- **Organization**: Group related logic together
- **Imports**: Organize by: React → UI → Types → Utils → Constants

## ⚠️ Protected Files

**DO NOT MODIFY:**
- `/components/ui/*` - ShadCN components
- `/components/figma/ImageWithFallback.tsx` - Protected system file

## 🧪 Testing New Features

1. Test with both captured and uploaded photos
2. Verify responsive design on different screen sizes
3. Check all navigation flows work correctly
4. Ensure modals close properly
5. Verify data displays correctly in all components

## 📦 Dependencies

- **React**: UI framework
- **Recharts**: Charts and graphs
- **Lucide React**: Icon library
- **Tailwind CSS**: Utility-first styling
- **ShadCN UI**: Pre-built component library

---

**Last Updated**: 2025
**Version**: 1.0
**Design System**: Bloom - Premium Skin Analysis App
