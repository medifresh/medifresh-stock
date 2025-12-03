# Medifresh Stock v1 - Design Guidelines

## Design Approach
**System-Based Approach**: Following Material Design principles adapted for medical/enterprise data management, drawing inspiration from Linear (data density + clarity) and Notion (intuitive editing patterns).

**Key Principles**:
- Data-first clarity: Information hierarchy optimized for quick scanning
- Touch-friendly targets: Minimum 44px tap areas for mobile PWA
- Inline editing fluidity: Seamless transition between view and edit states
- Professional restraint: Clean, focused interface without visual distractions

---

## Typography System

**Font Stack**: 
- Primary: Inter or System UI (-apple-system, BlinkMacSystemFont)
- Monospace: JetBrains Mono for numerical data

**Hierarchy**:
- Page Titles: text-2xl font-semibold (24px)
- Section Headers: text-lg font-medium (18px)
- Table Headers: text-sm font-semibold uppercase tracking-wide (14px)
- Body/Table Data: text-base (16px)
- Helper Text: text-sm text-opacity-60 (14px)
- Numerical Data: tabular-nums for alignment

---

## Layout & Spacing System

**Spacing Scale**: Use Tailwind units of **2, 4, 6, 8, 12, 16** as primary spacing primitives
- Component padding: p-4 to p-6
- Section gaps: gap-6 to gap-8
- Table cell padding: px-4 py-3
- Modal padding: p-8
- Page margins: px-4 md:px-8

**Container Strategy**:
- Full-width application (no max-w constraint)
- Content padding: p-4 md:p-6 lg:p-8
- Responsive breakpoints: sm:640px, md:768px, lg:1024px, xl:1280px

---

## Component Library

### Authentication Screen
- Centered card: max-w-md mx-auto mt-32
- Logo placement: mb-8 (centered)
- Input field: h-12 with rounded-lg
- Submit button: w-full h-12 font-medium

### Main Dashboard Layout
**Top Navigation Bar**:
- Fixed header: h-16 with shadow-sm
- Logo + title (left), search bar (center), user/actions (right)
- z-index: z-50

**Stock Management Table**:
- Responsive table with horizontal scroll on mobile
- Row height: min-h-14 for comfortable touch targets
- Alternating row treatment for scannability
- Sticky header: sticky top-16
- Column structure:
  - Product Name: flex-1 min-w-48
  - Stock quantities: w-24 text-right tabular-nums
  - Status indicators: w-32
  - Actions: w-24

**Inline Editing**:
- Click-to-edit pattern
- Input appears seamlessly in cell
- Focus ring: ring-2 ring-offset-1
- Auto-save on blur
- Visual feedback via subtle pulse animation

**Search & Filters**:
- Sticky toolbar below header: h-14
- Search input: flex-1 max-w-md with icon (Heroicons: MagnifyingGlass)
- Filter chips: inline-flex gap-2

### Stock Arrival Modal
- Overlay: backdrop-blur-sm bg-opacity-50
- Modal container: max-w-2xl mx-4 rounded-xl shadow-2xl
- Form layout: grid grid-cols-2 gap-4 for paired inputs
- Footer actions: flex justify-end gap-3

### Status Indicators
- Pill badges: inline-flex px-3 py-1 rounded-full text-sm font-medium
- Stock levels: Low (outline), Adequate (subtle fill), High (stronger fill)
- Icons: 16px from Heroicons (ExclamationTriangle, CheckCircle)

### Action Buttons
**Primary Actions**: 
- px-6 py-2.5 rounded-lg font-medium
- Icons: 20px left-aligned with gap-2

**Secondary/Icon Buttons**:
- p-2 rounded-lg (ghost style)
- Icons only: 20px (Heroicons: PencilSquare, TrashCan, DocumentArrowDown)

### Mobile PWA Optimizations
- Bottom navigation: fixed bottom-0 h-16 with safe-area-inset-bottom
- Large tap targets: min 44px height
- Pull-to-refresh visual indicator
- Offline banner: top-0 h-10 with slide-down animation

---

## Icon System
**Library**: Heroicons (outline for navigation, solid for status)
- Navigation: 24px outline
- Table actions: 20px outline
- Status indicators: 16px solid
- Form fields: 20px outline

---

## Data Visualization
**Color Coding System** (described structurally, not by color):
- Critical/Low: High contrast treatment with icon
- Warning/Medium: Medium contrast with subtle icon
- Safe/High: Low contrast, minimal visual weight
- Neutral/Default: Base text treatment

**Numerical Displays**:
- Right-aligned with tabular-nums
- Delta indicators: inline arrows (↑↓) or Heroicons (ArrowUp/ArrowDown)
- Percentage: text-sm opacity-75 suffix

---

## Animations (Minimal)
- Page transitions: None (instant for data app)
- Modal: fade-in duration-200
- Inline editing: Scale focus ring only
- Loading states: Subtle spinner (20px) or skeleton screens
- Success feedback: Brief checkmark animation (500ms)

---

## Responsive Behavior
**Mobile (< 768px)**:
- Single column layouts
- Horizontal scroll tables with sticky first column
- Bottom sheet modals instead of centered
- Collapsed navigation to hamburger menu

**Tablet (768px - 1024px)**:
- Maintain table structure
- Side drawer for filters/actions
- 2-column modal forms

**Desktop (> 1024px)**:
- Full table visibility
- Sidebar navigation (if multi-page)
- 3-column dense layouts for forms

---

## Images
**No hero images** - This is a utility application focused on data management.

**Icon/Logo Usage**:
- Application logo: 40px height in header
- PWA splash screen: Centered logo on solid background
- Empty states: Illustrative icons (96px) for "No results" or "No data"