# Two Travel Nuts - Visual Layout Reference

This document provides detailed visual descriptions of each page layout to complement the design system CSS.

---

## Global Layout Elements

### Navigation Bar (All Pages)
**Position:** Fixed at top, spans full width  
**Height:** 64px  
**Background:** White with subtle bottom shadow  
**Layout:** Horizontal flex container with space-between alignment

**Left Section:**
- Logo: "Two Travel Nuts" logo image (height: 40px, auto width)
- Positioned 32px from left edge

**Center Section (Desktop only):**
- Horizontal menu with links: "Home", "About", "Map"
- Links spaced 32px apart
- Font: 16px, medium weight
- Color: Slate-600 (#475569)
- Active/hover color: Amber-500 (#f59e0b)

**Right Section:**
- "Menu" button on mobile (hamburger icon)
- Full navigation visible on desktop (screens > 768px)

**Mobile Menu (< 768px):**
- Drops down from navigation bar
- Full width
- White background
- Vertical stack of links
- 16px padding on all sides
- Each link has 12px vertical padding

---

## Home Page Layout

### Hero Section
**Dimensions:** Full width × 500px height  
**Background:** Large landscape photo with dark overlay gradient  
**Overlay Gradient:** `linear-gradient(to bottom, rgba(15,23,42,0.7), rgba(15,23,42,0.5) 50%, rgba(15,23,42,0.7))`

**Content (Centered):**
- Main Heading: "Two Travel Nuts"
  - Font size: 72px on desktop, 48px on mobile
  - Weight: Bold (700)
  - Color: White
  - Margin bottom: 16px
  
- Subheading: "Adventures around the world"
  - Font size: 24px on desktop, 20px on mobile
  - Color: Slate-200 (#e2e8f0)
  - Max width: 672px
  - Margin bottom: 32px

- CTA Button: "Explore Trips"
  - Padding: 12px 32px
  - Border radius: Full (9999px)
  - Background: Amber-to-orange gradient
  - Shadow: Large elevation
  - Icon: Arrow right (20px) positioned 8px from text
  - Hover: Lifts up 2px with increased shadow

**Vertical Spacing:** All content vertically centered in hero

---

### Top Destinations Section
**Container:** Max-width 1280px, centered with 32px horizontal padding  
**Vertical Padding:** 80px top and bottom

**Section Header:**
- Heading: "Top Destinations"
  - Font size: 48px on desktop, 36px on tablet, 30px on mobile
  - Weight: Bold (700)
  - Color: Slate-900 (#0f172a)
  - Margin bottom: 8px

- Subheading: "Our most popular adventures"
  - Font size: 20px on desktop, 18px on mobile
  - Color: Slate-600 (#475569)
  - Margin bottom: 48px

**Search and Filter Bar:**
- Height: 40px
- Margin bottom: 32px
- Layout: Horizontal flex on desktop, vertical stack on mobile

**Search Input (Left side on desktop, full width on mobile):**
- Width: 320px on desktop, 100% on mobile
- Height: 40px
- Border: 1px solid slate-200, rounded full
- Padding: 8px 16px 8px 40px (left padding for icon)
- Icon: Search icon (20px) positioned absolute at left 12px
- Focus: Amber-500 border with subtle glow

**Filter Buttons (Right side on desktop, below search on mobile):**
- Display: Horizontal flex with 8px gap
- Each button:
  - Height: 40px
  - Padding: 8px 20px
  - Border: 1px solid slate-200
  - Border radius: Full (9999px)
  - Background: White (inactive), Amber-500 (active)
  - Text color: Slate-700 (inactive), White (active)
  - Font size: 14px, medium weight
- Filters: "All", "Europe", "Asia", "Americas", "Africa"

**Trip Cards Grid:**
- Grid columns: 1 on mobile (< 640px), 2 on tablet (640-1023px), 3 on desktop (≥ 1024px)
- Gap: 32px between cards
- Margin top: 32px

**Individual Trip Card:**
- Background: White
- Border radius: 16px
- Shadow: Medium elevation
- Overflow: Hidden
- Hover: Lifts 8px with increased shadow

**Card Image Section:**
- Height: 256px (fixed)
- Position: Relative (for overlays)
- Overflow: Hidden

**Image:**
- Dimensions: 100% width × 100% height
- Object-fit: Cover
- Hover: Scales to 110% over 700ms

**Image Overlays (2 layers):**
1. Base gradient overlay (always visible):
   - `linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.3) 50%, transparent)`
   
2. Hover gradient overlay (opacity 0 → 1 on hover):
   - `linear-gradient(to top, rgba(217,119,6,0.9), rgba(249,115,22,0.6) 50%, transparent)`

**Image Content (Positioned absolute at bottom):**
- Padding: 24px
- Z-index: 10 (above overlays)
- Color: White

**Title:**
- Font size: 24px
- Weight: Bold (700)
- Margin bottom: 8px
- Hover: Translates up 4px

**Location Line:**
- Display: Flex with 8px gap
- Align items: Center
- Map pin icon (16px) + location text
- Font size: 14px
- Opacity: 0.9

**Card Body (Below Image):**
- Padding: 24px
- Background: White

**Description:**
- Font size: 16px
- Color: Slate-700 (#334155)
- Line height: 1.5
- Margin bottom: 16px
- Max lines: 2 (overflow hidden with ellipsis)

**Metadata Row:**
- Display: Flex with space-between alignment
- Flex wrap on mobile

**Date Badge:**
- Background: Amber-50 (#fef3c7)
- Color: Amber-900 (#92400e)
- Padding: 4px 12px
- Border radius: Full
- Font size: 12px
- Icon: Calendar (16px) with 4px right margin

**Highlight Badge (if applicable):**
- Background: Amber-100
- Color: Amber-900
- Padding: 4px 12px
- Border radius: Full
- Font size: 12px
- Text: "Featured" or "Popular"

---

### Newsletter Section
**Background:** Amber-50 (#fef3c7)  
**Full width:** Spans entire viewport  
**Vertical padding:** 64px

**Container:**
- Max-width: 672px
- Centered horizontally
- Horizontal padding: 32px

**Content (Centered text alignment):**

**Heading:**
- Text: "Get Travel Inspiration"
- Font size: 36px on desktop, 30px on mobile
- Weight: Bold (700)
- Color: Slate-900
- Margin bottom: 16px

**Description:**
- Text: "Subscribe to our newsletter for the latest adventures"
- Font size: 18px
- Color: Slate-600
- Margin bottom: 32px

**Form:**
- Display: Flex (row on desktop, column on mobile)
- Gap: 16px
- Max width: 500px
- Margin: 0 auto (centered)

**Email Input:**
- Flex: 1 (grows to fill space)
- Height: 48px
- Padding: 12px 20px
- Border: 1px solid slate-300
- Border radius: Full (9999px)
- Font size: 16px
- Placeholder: "Enter your email"
- Focus: Amber-500 border with glow

**Subscribe Button:**
- Height: 48px
- Padding: 12px 32px
- Background: Amber-to-orange gradient
- Color: White
- Border radius: Full
- Font weight: Medium (500)
- Shadow: Medium elevation
- Hover: Darker gradient with increased shadow
- Full width on mobile

---

### Footer
**Background:** Slate-900 (#0f172a)  
**Full width:** Spans entire viewport  
**Padding:** 48px 32px 32px

**Container:**
- Max-width: 1280px
- Centered

**Layout (Desktop ≥ 768px):**
- 3 columns with equal width
- Gap: 48px between columns

**Layout (Mobile < 768px):**
- Single column
- 32px gap between sections

**Column 1 - About:**
- Logo: "Two Travel Nuts" (white version, height 40px)
- Margin bottom: 16px
- Description text:
  - Font size: 14px
  - Color: Slate-400
  - Line height: 1.6
  - Max width: 280px

**Column 2 - Quick Links:**
- Heading: "Quick Links"
  - Font size: 16px
  - Weight: Semibold (600)
  - Color: White
  - Margin bottom: 16px
- Links (vertical stack, 12px gap):
  - "Home", "About", "Map", "All Trips"
  - Font size: 14px
  - Color: Slate-400
  - Hover: Amber-500

**Column 3 - Follow Us:**
- Heading: "Follow Us"
  - Font size: 16px
  - Weight: Semibold (600)
  - Color: White
  - Margin bottom: 16px
- Social icons (horizontal flex, 16px gap):
  - Icons: 24px × 24px
  - Color: Slate-400
  - Hover: Amber-500

**Bottom Bar:**
- Border top: 1px solid slate-800
- Margin top: 32px
- Padding top: 24px
- Text: "© 2026 Two Travel Nuts. All rights reserved."
- Font size: 14px
- Color: Slate-400
- Text align: Center

---

## Trip Detail Page Layout

### Hero Section (Image Header)
**Dimensions:** Full width × 400px height on desktop, 300px on mobile  
**Background:** Large trip-specific photo  
**Position:** Relative (for absolutely positioned content)

**Dark Overlay:**
- Position: Absolute, covers entire hero
- Background: `linear-gradient(to bottom, rgba(15,23,42,0.7), rgba(15,23,42,0.5) 50%, rgba(15,23,42,0.7))`

**Content (Positioned absolute, centered):**
- Z-index: 10 (above overlay)
- Padding: 32px
- Max-width: 1024px
- Text align: Center

**Title:**
- Font size: 56px on desktop, 36px on mobile
- Weight: Bold (700)
- Color: White
- Margin bottom: 16px

**Location Line:**
- Display: Flex, centered
- Gap: 8px
- Font size: 20px on desktop, 16px on mobile
- Color: Slate-200
- Map pin icon (24px) + location text

---

### Content Container
**Max-width:** 1024px  
**Centered:** margin 0 auto  
**Horizontal padding:** 32px  
**Vertical padding:** 64px top and bottom

---

### Metadata Bar
**Layout:** Horizontal flex with space-between  
**Flex wrap:** Yes (stacks on mobile)  
**Gap:** 16px  
**Margin bottom:** 48px  
**Padding:** 24px  
**Background:** Slate-50 (#f8fafc)  
**Border radius:** 12px

**Each Metadata Item:**
- Display: Flex
- Align items: Center
- Gap: 8px

**Icon:**
- Size: 20px
- Color: Amber-500

**Text:**
- Font size: 16px
- Color: Slate-700
- Weight: Medium (500)

**Metadata shown:**
- Calendar icon + Date (e.g., "June 2024")
- Star icon + Highlight (e.g., "Featured Trip")

---

### Main Content Section
**Description:**
- Font size: 18px
- Line height: 1.75 (generous line spacing)
- Color: Slate-700
- Margin bottom: 48px
- Multiple paragraphs with 24px gap between

---

### Highlights Section
**Margin bottom:** 48px

**Heading:**
- Text: "Highlights"
- Font size: 32px
- Weight: Bold (700)
- Color: Slate-900
- Margin bottom: 24px

**Highlights List:**
- Display: Grid
- Columns: 2 on desktop (≥ 768px), 1 on mobile
- Gap: 16px

**Each Highlight Item:**
- Display: Flex
- Gap: 12px
- Padding: 16px
- Background: Amber-50
- Border radius: 12px

**Checkmark Icon:**
- Size: 24px
- Color: Amber-600
- Flex-shrink: 0 (doesn't shrink)

**Text:**
- Font size: 16px
- Color: Slate-700
- Line height: 1.5

---

### Photo Gallery Section
**Margin bottom:** 48px

**Section Header:**
- Display: Flex
- Justify: Space-between
- Align items: Center
- Margin bottom: 32px

**Heading:**
- Text: "Photo Gallery"
- Font size: 32px
- Weight: Bold (700)
- Color: Slate-900

**Photo Count Badge:**
- Background: Amber-100
- Color: Amber-900
- Padding: 6px 16px
- Border radius: Full
- Font size: 14px
- Weight: Medium
- Text: e.g., "24 photos"

**Gallery Layout (Masonry):**
- Column count: 1 on mobile (< 640px), 2 on tablet (640-1023px), 3 on desktop (≥ 1024px)
- Column gap: 16px
- Row gap: 16px (via margin-bottom on items)

**Gallery Item:**
- Break-inside: Avoid (keeps in one column)
- Margin bottom: 16px
- Border radius: 12px
- Overflow: Hidden
- Shadow: Medium elevation
- Cursor: Pointer

**Image:**
- Width: 100%
- Height: Auto (maintains aspect ratio)
- Display: Block
- Object-fit: Cover
- Hover: Scales to 110% over 700ms, brightness 75%

**Caption (appears on hover):**
- Position: Absolute, bottom 0
- Padding: 16px
- Background: `linear-gradient(to top, rgba(0,0,0,0.8), transparent)`
- Color: White
- Font size: 14px
- Weight: Medium
- Transform: Slides up from below on hover (300ms)

**Zoom Icon (appears on hover):**
- Position: Absolute, centered
- Size: 48px
- Color: White
- Background: rgba(0,0,0,0.5)
- Border radius: 50%
- Padding: 12px
- Opacity: 0 → 1 on hover

---

### Lightbox (Photo Viewer)
**Position:** Fixed, full screen  
**Z-index:** 9999 (top layer)  
**Background:** rgba(0,0,0,0.95)

**Main Image:**
- Position: Centered (flex center)
- Max width: 90vw
- Max height: 90vh
- Object-fit: Contain
- Shadow: Extra large elevation

**Close Button (Top Right):**
- Position: Absolute, top 16px, right 16px
- Size: 48px circle
- Background: rgba(255,255,255,0.1)
- Color: White
- Border radius: 50%
- X icon (24px)
- Hover: Background brightens to rgba(255,255,255,0.2)

**Previous Button (Left Middle):**
- Position: Absolute, left 16px, vertically centered
- Size: 48px circle
- Background: rgba(255,255,255,0.1)
- Color: White
- Border radius: 50%
- Chevron left icon (32px)
- Hover: Background brightens

**Next Button (Right Middle):**
- Position: Absolute, right 16px, vertically centered
- Size: 48px circle
- Background: rgba(255,255,255,0.1)
- Color: White
- Border radius: 50%
- Chevron right icon (32px)
- Hover: Background brightens

**Counter (Bottom Center):**
- Position: Absolute, bottom 16px, centered horizontally
- Background: rgba(0,0,0,0.5)
- Color: White
- Padding: 8px 16px
- Border radius: Full
- Font size: 14px
- Text: e.g., "3 / 24"

---

### Social Sharing Section
**Margin bottom:** 48px  
**Padding:** 32px  
**Background:** Slate-50  
**Border radius:** 12px

**Heading:**
- Text: "Share This Trip"
- Font size: 24px
- Weight: Bold (700)
- Color: Slate-900
- Margin bottom: 24px

**Share Buttons:**
- Display: Flex
- Gap: 12px
- Flex wrap: Yes (wraps on mobile)

**Each Share Button:**
- Height: 48px
- Padding: 12px 24px
- Border radius: 12px
- Font size: 16px
- Weight: Medium
- Display: Flex
- Align items: Center
- Gap: 8px
- Transition: All 300ms
- Hover: Transform scale(1.05)

**Button Variants:**
1. Facebook:
   - Background: #1877f2
   - Color: White
   - Icon: Facebook logo (20px)

2. Twitter:
   - Background: #1da1f2
   - Color: White
   - Icon: Twitter logo (20px)

3. Pinterest:
   - Background: #e60023
   - Color: White
   - Icon: Pinterest logo (20px)

4. Copy Link:
   - Background: Slate-200
   - Color: Slate-900
   - Icon: Link icon (20px)
   - Hover: Background darkens to Slate-300

---

### Back to Trips Button
**Position:** Below all content  
**Margin top:** 48px

**Button:**
- Display: Inline-flex
- Align items: Center
- Gap: 8px
- Padding: 12px 32px
- Background: White
- Border: 2px solid amber-500
- Color: Amber-600
- Border radius: Full
- Font weight: Medium
- Icon: Arrow left (20px)
- Hover: Background becomes amber-500, color becomes white
- Transition: 300ms

---

## About Page Layout

### Hero Section
**Same dimensions and structure as Home page hero**

**Heading:** "About Two Travel Nuts"  
**Subheading:** "Our story and passion for travel"

---

### Content Section
**Container:** Max-width 800px, centered  
**Padding:** 64px 32px

**Structure:** Multiple paragraphs of text

**Typography:**
- Font size: 18px
- Line height: 1.75
- Color: Slate-700
- Paragraph spacing: 24px

**Images (if any):**
- Full width within container
- Border radius: 16px
- Margin: 48px 0
- Shadow: Large elevation

---

## Map Page Layout

### Hero Section (Shorter)
**Height:** 300px (smaller than home hero)  
**Same overlay gradient structure**

**Heading:** "Trip Map"  
**Subheading:** "Explore our adventures around the world"

---

### Map Container
**Height:** 600px on desktop, 500px on mobile  
**Width:** Full width (with 32px container padding)  
**Max-width:** 1280px, centered  
**Border radius:** 16px  
**Overflow:** Hidden  
**Shadow:** Extra large elevation  
**Margin:** 48px auto

**Interactive Map (Leaflet):**
- Default zoom level: World view
- Markers: Custom amber-colored pins
- Popup on marker click:
  - Trip name (bold, 18px)
  - Location (14px)
  - Thumbnail image (if available)
  - "View Trip" link (amber color)
  - Padding: 12px
  - Border radius: 8px

---

## Responsive Breakpoints Summary

**Mobile:** < 640px
- Single column layouts
- Stacked navigation
- Smaller text sizes
- Full-width buttons
- Hero height: 300-400px

**Tablet:** 640px - 1023px
- 2-column grids
- Horizontal navigation (if space)
- Medium text sizes
- Hero height: 400-500px

**Desktop:** ≥ 1024px
- 3-column grids
- Full horizontal navigation
- Largest text sizes
- Hero height: 500px
- Max container width: 1280px

---

## Animation Patterns

**Page Load:**
- Hero content: Fades in + slides up (500ms)
- Cards: Stagger animation (100ms delay per card)
- Sections: Fade in as they enter viewport

**Hover States:**
- Cards: Lift 8px + increase shadow (300ms)
- Images: Scale 110% + brightness adjust (700ms)
- Buttons: Lift 2px + increase shadow (300ms)
- Links: Color change to amber (150ms)

**Click/Tap:**
- Buttons: Brief scale down (0.95) then bounce back
- Cards: Navigate with no animation
- Gallery images: Fade to lightbox (200ms)

**Transitions:**
- Page navigation: Instant (React Router)
- Lightbox: Fade in background + scale in image (300ms)
- Mobile menu: Slide down (200ms)

---

## Z-Index Hierarchy

1. **Navigation bar:** z-index: 50
2. **Dropdown menus:** z-index: 60
3. **Image overlays (on cards):** z-index: 1
4. **Text content over images:** z-index: 10
5. **Lightbox modal:** z-index: 9999
6. **Lightbox controls:** z-index: 10000

---

## Spacing Conventions

**Section Vertical Padding:**
- Hero sections: No padding (content positioned absolutely)
- Main sections: 80px top and bottom on desktop, 64px on mobile
- Newsletter: 64px top and bottom
- Footer: 48px top, 32px bottom

**Container Horizontal Padding:**
- Desktop: 32px
- Tablet: 24px
- Mobile: 16px

**Card Internal Padding:**
- Image content: 24px
- Card body: 24px
- Metadata sections: 24px

**Element Spacing:**
- Between heading and subheading: 8-16px
- Between text and button: 24-32px
- Between sections: 48-64px
- Grid gaps: 32px (desktop), 24px (mobile)

---

This layout reference should give you everything needed to recreate the visual design in your static site generator!
