# Documentation

This directory contains all project documentation organised by topic.

## Quick Links

### 🚀 Getting Started
- [README](../README.md) - Main project overview (in root)
- [Quick Start Guide](reference/QUICKSTART.md) - Get up and running quickly

### 📦 Deployment
- [Deployment Guide](deployment/DEPLOYMENT.md) - GitHub Pages, Netlify, Cloudflare, and more
- [Custom Domain Setup](deployment/CUSTOM_DOMAIN_DEPLOYMENT.md) - Set up twotravelnuts.com

### 🏗️ Implementation
- [Smart Build](implementation/SMART_BUILD.md) - Incremental build system
- [Testing Guide](implementation/TESTING_GUIDE.md) - Pre-deploy checklist
- [Image Optimization](IMAGE-OPTIMIZATION.md) - Automated image optimization for web delivery

### 🎨 Design
- [Design System](FigmaDesign/FIGMA_SYSTEM_DESIGN.md) - Colour palette and component styles
- [Visual Layout Reference](FigmaDesign/FIGMA_VISUAL_LAYOUT_REFERENCE.md) - Page layout descriptions
- [Remaining Design Work](FigmaDesign/REMAINING.md) - Deferred features from Figma mockups

### 📚 Reference
- [File Structure](reference/FILES.md) - Every file and directory explained
- [Project Overview](reference/PROJECT.md) - Architecture, data flow, page types
- [Creative Commons](reference/CREATIVE_COMMONS.md) - License details

## Directory Structure

```
docs/
├── README.md                         # This file
├── ARCHITECTURE.md                   # Config management & config-paths.js
├── CONTRIBUTING.md                   # Development guidelines
├── IMAGE-OPTIMIZATION.md             # Automated image optimization
├── deployment/
│   ├── DEPLOYMENT.md                 # Multi-platform deployment guide
│   └── CUSTOM_DOMAIN_DEPLOYMENT.md   # Custom domain options
├── implementation/
│   ├── SMART_BUILD.md                # Incremental build system
│   └── TESTING_GUIDE.md              # Pre-deploy test checklist
├── reference/
│   ├── FILES.md                      # File & directory reference
│   ├── PROJECT.md                    # Architecture overview
│   ├── QUICKSTART.md                 # Getting started
│   ├── CREATIVE_COMMONS.md           # License
│   └── CreativeCommonsFooter.html    # Footer snippet
└── FigmaDesign/                      # Design mockups & references
    ├── FIGMA_SYSTEM_DESIGN.md
    ├── FIGMA_VISUAL_LAYOUT_REFERENCE.md
    ├── REMAINING.md
    └── *.png                         # Mockup screenshots
```

## Most Useful Documents

### For Deployment
1. **[deployment/DEPLOYMENT.md](deployment/DEPLOYMENT.md)** - Multi-platform deployment guide
2. **[deployment/CUSTOM_DOMAIN_DEPLOYMENT.md](deployment/CUSTOM_DOMAIN_DEPLOYMENT.md)** - Custom domain setup

### For Development
1. **[ARCHITECTURE.md](ARCHITECTURE.md)** - How config-paths.js keeps everything in sync
2. **[implementation/SMART_BUILD.md](implementation/SMART_BUILD.md)** - Incremental build system
3. **[IMAGE-OPTIMIZATION.md](IMAGE-OPTIMIZATION.md)** - Automated image optimization (90-95% size reduction)

### For Reference
1. **[reference/FILES.md](reference/FILES.md)** - Where everything lives
2. **[reference/PROJECT.md](reference/PROJECT.md)** - Technical overview and data flow

## Contributing

When adding new documentation:
- Place in the appropriate subdirectory
- Update this README with a link
- Use clear, descriptive filenames
- Include examples where helpful
