# Two Travel Nuts - Design System Export

## Color Palette

### Primary Colors
```css
--color-amber-500: #f59e0b;
--color-amber-600: #d97706;
--color-orange-500: #f97316;
--color-orange-600: #ea580c;
```

### Neutral Colors
```css
--color-slate-50: #f8fafc;
--color-slate-100: #f1f5f9;
--color-slate-200: #e2e8f0;
--color-slate-600: #475569;
--color-slate-700: #334155;
--color-slate-900: #0f172a;
--color-white: #ffffff;
--color-black: #000000;
```

### Gradients
```css
/* Primary gradient (used for buttons and CTAs) */
background: linear-gradient(to right, #f59e0b, #ea580c);

/* Hover gradient */
background: linear-gradient(to right, #d97706, #c2410c);

/* Image overlay gradients */
background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, transparent 100%);

/* Hover overlay on images */
background: linear-gradient(to top, rgba(217,119,6,0.9) 0%, rgba(249,115,22,0.6) 50%, transparent 100%);

/* Hero background overlay */
background: linear-gradient(to bottom, rgba(15,23,42,0.7) 0%, rgba(15,23,42,0.5) 50%, rgba(15,23,42,0.7) 100%);
```

## Typography

### Font Family
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
```

### Font Sizes
```css
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-5xl: 3rem;        /* 48px */
--text-7xl: 4.5rem;      /* 72px */
```

### Font Weights
```css
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

## Spacing Scale
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
```

## Border Radius
```css
--radius-lg: 0.5rem;      /* 8px */
--radius-xl: 0.75rem;     /* 12px */
--radius-2xl: 1rem;       /* 16px */
--radius-full: 9999px;    /* Fully rounded */
```

## Shadows
```css
--shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
--shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
--shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
--shadow-2xl: 0 25px 50px -12px rgba(0,0,0,0.25);
```

## Transitions
```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-normal: 300ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 500ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slower: 700ms cubic-bezier(0.4, 0, 0.2, 1);
```

## Component Styles

### Navigation Bar
```css
.nav-bar {
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 50;
}

.nav-link {
  color: #475569;
  font-weight: 500;
  padding: 0.5rem 1rem;
  transition: color 150ms;
}

.nav-link:hover {
  color: #f59e0b;
}

.nav-link.active {
  color: #f59e0b;
}
```

### Primary Button
```css
.btn-primary {
  background: linear-gradient(to right, #f59e0b, #ea580c);
  color: white;
  padding: 0.75rem 2rem;
  border-radius: 9999px;
  font-weight: 500;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
  transition: all 300ms;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
  cursor: pointer;
}

.btn-primary:hover {
  background: linear-gradient(to right, #d97706, #c2410c);
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}
```

### Trip Card
```css
.trip-card {
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
  transition: all 300ms;
  cursor: pointer;
}

.trip-card:hover {
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
  transform: translateY(-8px);
}

.trip-card-image-wrapper {
  position: relative;
  height: 16rem;
  overflow: hidden;
}

.trip-card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 700ms;
}

.trip-card:hover .trip-card-image {
  transform: scale(1.1);
}

.trip-card-image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, transparent 100%);
}

.trip-card-hover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(217,119,6,0.9) 0%, rgba(249,115,22,0.6) 50%, transparent 100%);
  opacity: 0;
  transition: opacity 300ms;
}

.trip-card:hover .trip-card-hover-overlay {
  opacity: 1;
}

.trip-card-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1.5rem;
  color: white;
}

.trip-card-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  transition: transform 300ms;
}

.trip-card:hover .trip-card-title {
  transform: translateY(-4px);
}

.trip-card-body {
  padding: 1.5rem;
}

.trip-card-description {
  color: #334155;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

### Highlight Badge
```css
.badge {
  font-size: 0.75rem;
  background: #fef3c7;
  color: #92400e;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  display: inline-block;
}
```

### Search Input
```css
.search-input {
  padding: 0.5rem 1rem 0.5rem 2.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 9999px;
  font-size: 0.875rem;
  transition: all 150ms;
}

.search-input:focus {
  outline: none;
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245,158,11,0.1);
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.25rem;
  height: 1.25rem;
  color: #64748b;
}
```

### Photo Gallery (Masonry Layout)
```css
.gallery-masonry {
  column-count: 1;
  column-gap: 1rem;
}

@media (min-width: 640px) {
  .gallery-masonry {
    column-count: 2;
  }
}

@media (min-width: 1024px) {
  .gallery-masonry {
    column-count: 3;
  }
}

.gallery-item {
  position: relative;
  break-inside: avoid;
  margin-bottom: 1rem;
  overflow: hidden;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
  transition: box-shadow 300ms;
  cursor: pointer;
}

.gallery-item:hover {
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
}

.gallery-item img {
  width: 100%;
  height: auto;
  display: block;
  transition: all 700ms;
}

.gallery-item:hover img {
  transform: scale(1.1);
  filter: brightness(0.75);
}

.gallery-item-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 50%, transparent 100%);
  opacity: 0;
  transition: opacity 300ms;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gallery-item:hover .gallery-item-overlay {
  opacity: 1;
}

.gallery-caption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  transform: translateY(100%);
  transition: transform 300ms;
}

.gallery-item:hover .gallery-caption {
  transform: translateY(0);
}
```

### Lightbox Modal
```css
.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.95);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-image {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
}

.lightbox-close,
.lightbox-prev,
.lightbox-next {
  position: absolute;
  background: rgba(255,255,255,0.1);
  color: white;
  border: none;
  border-radius: 50%;
  padding: 0.75rem;
  cursor: pointer;
  transition: background 300ms;
}

.lightbox-close:hover,
.lightbox-prev:hover,
.lightbox-next:hover {
  background: rgba(255,255,255,0.2);
}

.lightbox-close {
  top: 1rem;
  right: 1rem;
}

.lightbox-prev {
  left: 1rem;
}

.lightbox-next {
  right: 1rem;
}

.lightbox-counter {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.5);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
}
```

## Animation Keyframes

### Fade In
```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

### Slide Up
```css
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Scale In
```css
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

### Usage Example
```css
.animated-element {
  animation: slideUp 500ms ease-out;
}

/* With delay for stagger effect */
.animated-element:nth-child(1) { animation-delay: 0ms; }
.animated-element:nth-child(2) { animation-delay: 100ms; }
.animated-element:nth-child(3) { animation-delay: 200ms; }
```

## Layout Patterns

### Container
```css
.container {
  max-width: 80rem; /* 1280px */
  margin: 0 auto;
  padding: 0 1rem;
}

@media (min-width: 640px) {
  .container {
    padding: 0 1.5rem;
  }
}

@media (min-width: 1024px) {
  .container {
    padding: 0 2rem;
  }
}
```

### Grid Layout
```css
.grid {
  display: grid;
  gap: 2rem;
}

.grid-cols-1 {
  grid-template-columns: repeat(1, 1fr);
}

@media (min-width: 768px) {
  .grid-cols-md-2 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid-cols-lg-3 {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Hero Section
```css
.hero {
  position: relative;
  height: 500px;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(15,23,42,0.7) 0%, rgba(15,23,42,0.5) 50%, rgba(15,23,42,0.7) 100%);
}

.hero-content {
  position: relative;
  z-index: 10;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 1rem;
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1rem;
}

@media (min-width: 768px) {
  .hero-title {
    font-size: 4.5rem;
  }
}

.hero-subtitle {
  font-size: 1.25rem;
  color: #e2e8f0;
  max-width: 42rem;
}

@media (min-width: 768px) {
  .hero-subtitle {
    font-size: 1.5rem;
  }
}
```

## Icons (Lucide Icons Alternative)

Since you won't have access to lucide-react, here are SVG alternatives for key icons:

### Search Icon
```html
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="11" cy="11" r="8"></circle>
  <path d="m21 21-4.35-4.35"></path>
</svg>
```

### Calendar Icon
```html
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
  <line x1="16" y1="2" x2="16" y2="6"></line>
  <line x1="8" y1="2" x2="8" y2="6"></line>
  <line x1="3" y1="10" x2="21" y2="10"></line>
</svg>
```

### Map Pin Icon
```html
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
  <circle cx="12" cy="10" r="3"></circle>
</svg>
```

### Camera Icon
```html
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
  <circle cx="12" cy="13" r="4"></circle>
</svg>
```

### Arrow Right Icon
```html
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <line x1="5" y1="12" x2="19" y2="12"></line>
  <polyline points="12 5 19 12 12 19"></polyline>
</svg>
```

### Star Icon (filled)
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="2">
  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
</svg>
```

### Zoom In Icon
```html
<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="11" cy="11" r="8"></circle>
  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  <line x1="11" y1="8" x2="11" y2="14"></line>
  <line x1="8" y1="11" x2="14" y2="11"></line>
</svg>
```

### Close (X) Icon
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <line x1="18" y1="6" x2="6" y2="18"></line>
  <line x1="6" y1="6" x2="18" y2="18"></line>
</svg>
```

### Chevron Left Icon
```html
<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <polyline points="15 18 9 12 15 6"></polyline>
</svg>
```

### Chevron Right Icon
```html
<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <polyline points="9 18 15 12 9 6"></polyline>
</svg>
```

## Responsive Breakpoints
```css
/* Mobile first approach */
/* Default: Mobile (< 640px) */

/* Small tablets and up */
@media (min-width: 640px) { /* sm */ }

/* Tablets and up */
@media (min-width: 768px) { /* md */ }

/* Desktop and up */
@media (min-width: 1024px) { /* lg */ }

/* Large desktop */
@media (min-width: 1280px) { /* xl */ }
```

## Usage Notes

1. **Color System**: The amber/orange gradient is the signature of this design. Use it sparingly for primary actions and accents.

2. **Hover Effects**: Most interactive elements should have:
   - A smooth transition (300ms is standard)
   - A transform effect (scale or translateY)
   - A shadow increase
   - Optional color/gradient overlay

3. **Images**: All images should:
   - Have `object-fit: cover` for consistent sizing
   - Scale to 110% on hover over 700ms
   - Have a gradient overlay for text readability

4. **Animations**: Stagger animations by 100ms delay per item for a polished entrance effect.

5. **Spacing**: Use consistent spacing from the scale. The most common values are 4, 8, 16, 24, and 32.

6. **Typography**: Keep font sizes consistent. Body text is 1rem, headings scale up, small text/badges use 0.75-0.875rem.
