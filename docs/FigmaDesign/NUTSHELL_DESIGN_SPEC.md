# "In a Nutshell" Design Specification
**Two Travel Nuts Brand Language**

## Overview
This document specifies the consistent design system for "nutshell" summary sections across the Two Travel Nuts static site.

---

## 1. Component Types

### A. Trip Overview: "At a Glance" 
**Used on:** Trip overview pages (e.g., "Andalusia Road Trip")  
**Purpose:** Quick city-by-city comparison for prioritization  
**Format:** Grid of compact cards

### B. Location Detail: "In a Nutshell"
**Used on:** Individual city/location pages  
**Purpose:** Comprehensive verdict and recommendations  
**Format:** Full-width detailed component

---

## 2. Shared Brand Elements

✅ **All "nutshell" sections must include:**

1. **🥜 Peanut emoji** - Brand signature
2. **Amber/orange gradient palette** - Signature colors
3. **Verdict badge system** - Consistent levels and styling
4. **Lucide React icons** - For all data fields
5. **Motion animations** - Fade-in and hover effects
6. **Rounded corners** - 16px+ border radius
7. **Gradient accents** - Colored strips/borders

---

## 3. Location "In a Nutshell" - Detailed Spec

### Visual Structure (Top to Bottom):

```
┌─────────────────────────────────────────────┐
│ 🥜 [City] in a Nutshell    [VERDICT BADGE] │ ← Header Row
│ Two Travel Nuts Verdict                     │
├─────────────────────────────────────────────┤
│ Overall Rating: ⭐⭐⭐⭐⭐ 5/5              │ ← Star Rating
├─────────────────────────────────────────────┤
│ [ICON] Stay Overnight? | [ICON] Return?    │ ← 2-Column Grid
├─────────────────────────────────────────────┤
│ [ICON] Don't Miss (HIGHLIGHTED)             │ ← Full Width Highlight
├─────────────────────────────────────────────┤
│ [ICON] Best Time of Day                     │ ← Full Width
├─────────────────────────────────────────────┤
│ [ICON] Worth the Splurge                    │ ← Full Width
└─────────────────────────────────────────────┘
█████████████████████████████████████████████ ← Bottom Accent Strip
```

### Color Palette:

```css
Background: gradient from-amber-50 to-orange-50
Left Border: 4px solid #f59e0b (amber-500)
Shadow: lg
Pattern: Subtle radial-gradient dots (5% opacity)
Bottom Strip: gradient from-amber-400 via-orange-400 to-amber-400 (8px height)
```

### Verdict Badge Levels:

| Level | Text | Icon | Gradient | Use Case |
|-------|------|------|----------|----------|
| must-visit | Must Visit | 🔥 | amber-600 → orange-600 | 5-star destinations |
| high | Would Plan Around | ⭐ | amber-500 → orange-500 | 4-star highlights |
| worth-a-stop | Worth a Stop | ✅ | amber-400 → orange-400 | 3-star solid choices |
| nice-if-nearby | Nice if Nearby | 🤷 | gray-400 → gray-500 | 2-star optional |

### Icon Mapping:

```jsx
import { 
  Users,      // Best For
  Bed,        // Stay Overnight
  MapPin,     // Don't Miss
  Clock,      // Best Time of Day
  Sparkles,   // Worth the Splurge
  RotateCcw,  // Return Visit
  CheckCircle, XCircle, // Yes/No indicators
  Star        // Rating stars
} from 'lucide-react';
```

### Field Specifications:

**1. Header Section:**
- H2 heading: "text-3xl font-bold"
- Peanut emoji: "text-4xl"
- Subtitle: "text-sm text-gray-600"
- Verdict badge: Positioned top-right, hover scale 1.05

**2. Star Rating Row:**
- Label: "Overall Rating:"
- 5 stars (filled based on rating)
- Number display: "[rating]/5"
- Bottom border: "border-b-2 border-amber-200"

**3. Data Fields:**

Each field uses this structure:
```jsx
<motion.div whileHover={{ x: 4 }}>
  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500">
    <ICON className="w-5 h-5 text-white" />
  </div>
  <div>
    <div className="font-semibold text-gray-900">{label}</div>
    <div className="text-gray-700">{content}</div>
  </div>
</motion.div>
```

**Layout Variations:**
- **2-Column:** `grid md:grid-cols-2 gap-6`
  - Stay Overnight? | Return Visit?
- **Full Width:** `col-span-full`
  - Best For, Don't Miss, Best Time of Day, Worth the Splurge
- **Highlighted:** `bg-amber-100 px-4 py-3 rounded-lg`
  - Don't Miss (always highlighted)

**4. Special Field - Return Visit:**
```jsx
{returnVisit ? (
  <><CheckCircle className="w-5 h-5 text-green-600" />
  <span className="font-semibold text-green-700">Yes</span></>
) : (
  <><XCircle className="w-5 h-5 text-gray-500" />
  <span className="font-semibold text-gray-600">No</span></>
)}
```

---

## 4. Trip Overview "At a Glance" - Card Grid Spec

### Visual Structure:

```
Grid: md:grid-cols-2 lg:grid-cols-3
Gap: 24px
```

**Individual City Card:**
```
┌──────────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ ← Top colored strip (6px)
│ 📍 City Name        [🔥] │ ← Name + icon badge
│ ⭐⭐⭐⭐⭐ 5/5         │ ← Rating
│                          │
│ Quick take text (2-3     │ ← Short summary
│ sentences, line-clamped) │
│                          │
│ 🕐 2-3 days              │ ← Quick facts
│ 👥 History buffs         │
│                          │
│ Full Details →           │ ← Link (hover: arrow moves)
└──────────────────────────┘
```

### Card Styling:

```css
Background: white
Border: 2px solid [varies by verdict level]
Border Radius: 12px
Shadow: md (hover: xl)
Hover: translateY(-4px)
Padding: 20px
```

### Verdict-Specific Card Borders:

- **Must Visit:** `border-amber-300` + `bg-amber-50` on hover
- **Would Plan Around:** `border-amber-300`
- **Worth a Stop:** `border-orange-300`
- **Nice if Nearby:** `border-gray-300`

---

## 5. Motion Animations

**Component Load:**
```jsx
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.6 }}
```

**Hover Effects:**
- Verdict badge: `whileHover={{ scale: 1.05 }}`
- Info items: `whileHover={{ x: 4 }}`
- City cards: `whileHover={{ y: -4 }}`

**Stagger for grids:**
```jsx
transition={{ duration: 0.5, delay: index * 0.1 }}
```

---

## 6. Responsive Behavior

**Breakpoints:**
- Mobile: Single column, stacked layout
- Tablet (md): 2-column grids activate
- Desktop (lg): 3-column for city cards

**Mobile Adjustments:**
- Reduce padding: 16px → 24px → 32px
- Stack header elements vertically
- Reduce font sizes by 1 step
- Maintain icon sizes (accessibility)

---

## 7. Content Guidelines

### "In a Nutshell" Fields:

1. **Best For:** Describe ideal traveler types (2-3 categories)
2. **Stay Overnight?:** Duration recommendation with reasoning
3. **Don't Miss:** Top 2-4 experiences (comma-separated)
4. **Best Time of Day:** When to visit + why
5. **Worth the Splurge:** One premium experience recommendation
6. **Return Visit?:** Boolean + optional context

### "At a Glance" Quick Take:
- 2-3 sentences maximum
- Lead with strongest verdict point
- Include 1 specific highlight
- End with who it's best for

---

## 8. Implementation Checklist

**For Static Site Generator:**

- [ ] Create reusable `InANutshell` component
- [ ] Create reusable `CityCard` component  
- [ ] Import Lucide icons package
- [ ] Import Motion from 'motion/react'
- [ ] Add verdict level data to frontmatter
- [ ] Add rating (1-5) to location data
- [ ] Map icons to field names
- [ ] Implement responsive grid layouts
- [ ] Add hover animations
- [ ] Add background pattern CSS
- [ ] Test all verdict levels render correctly
- [ ] Ensure accessibility (icon alt text, focus states)

---

## 9. Code Snippets for Quick Reference

### Icon Container (Reusable):
```jsx
<div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white">
  {icon}
</div>
```

### Background Pattern:
```jsx
<div className="absolute inset-0 opacity-5">
  <div className="absolute inset-0" style={{
    backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(251 191 36) 1px, transparent 0)',
    backgroundSize: '32px 32px'
  }} />
</div>
```

### Star Rating Display:
```jsx
{[...Array(5)].map((_, i) => (
  <Star 
    key={i} 
    className={`w-5 h-5 ${i < rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} 
  />
))}
```

### Bottom Accent Strip:
```jsx
<div className="h-2 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400" />
```

---

## 10. Visual Hierarchy Rules

**Importance Levels:**
1. **Critical:** Verdict badge, city name, rating
2. **High:** Don't Miss (highlighted), Best For
3. **Medium:** Stay duration, Return visit
4. **Supporting:** Best time, Worth the splurge

**Implement via:**
- Size: 3xl → xl → base
- Color: gray-900 → gray-700 → gray-600  
- Weight: bold → semibold → normal
- Background: highlighted → default → subtle

---

**Last Updated:** Created for Two Travel Nuts static site generator  
**Design Version:** 1.0  
**Framework:** React + Tailwind CSS + Motion
