# Documentation

This directory contains all project documentation organised by topic.

## Quick Links

### 🚀 Getting Started
- [README](../README.md) - Main project overview (in root)
- [Quick Start Guide](QUICKSTART.md) - Get up and running quickly

### 📦 Deployment
- [Deployment Guide](deployment/DEPLOYMENT.md) - GitHub Pages, Netlify, Cloudflare, and more
- [Custom Domain Setup](deployment/CUSTOM_DOMAIN_DEPLOYMENT.md) - Set up twotravelnuts.com

### 🏗️ Implementation
- [Smart Build](implementation/SMART_BUILD.md) - Incremental build system
- [Testing Guide](implementation/TESTING_GUIDE.md) - Pre-deploy checklist
- [Image Optimization](implementation/IMAGE-OPTIMIZATION.md) - Automated image optimization for web delivery

### 🎨 Design
- [Design System](FigmaDesign/FIGMA_SYSTEM_DESIGN.md) - Colour palette and component styles
- [Visual Layout Reference](FigmaDesign/FIGMA_VISUAL_LAYOUT_REFERENCE.md) - Page layout descriptions
- [Remaining Design Work](FigmaDesign/REMAINING.md) - Deferred features from Figma mockups

### 📚 Reference
- [File Structure](FILES.md) - **Primary reference**: every file, directory, npm script, page type, and build chain
- [Quick Start](QUICKSTART.md) - Setup and daily workflows
- [Contributing](CONTRIBUTING.md) - Path management rules and contributor guidelines
- [Creative Commons](reference/CREATIVE_COMMONS.md) - License details

## Directory Structure

```
docs/
├── README.md                         # This file
├── FILES.md                          # ⭐ Primary reference (file structure, scripts, build chain)
├── QUICKSTART.md                     # Getting started
├── CONTRIBUTING.md                   # Contributor guidelines & path management
├── deployment/
│   ├── DEPLOYMENT.md                 # Multi-platform deployment guide
│   └── CUSTOM_DOMAIN_DEPLOYMENT.md   # Custom domain options
├── implementation/
│   ├── IMAGE-OPTIMIZATION.md         # Automated image optimization
│   ├── SMART_BUILD.md                # Incremental build system
│   └── TESTING_GUIDE.md              # Pre-deploy test checklist
├── reference/
│   ├── CREATIVE_COMMONS.md           # License
│   └── CreativeCommonsFooter.html    # Footer snippet
└── FigmaDesign/                      # Design mockups & references
    ├── FIGMA_SYSTEM_DESIGN.md
    ├── FIGMA_VISUAL_LAYOUT_REFERENCE.md
    ├── REMAINING.md
    └── *.png                         # Mockup screenshots
```

## Most Useful Documents

### For Reference
1. **[FILES.md](FILES.md)** - Where everything lives; npm scripts; page types; build chain

### For Deployment
1. **[deployment/DEPLOYMENT.md](deployment/DEPLOYMENT.md)** - Multi-platform deployment guide
2. **[deployment/CUSTOM_DOMAIN_DEPLOYMENT.md](deployment/CUSTOM_DOMAIN_DEPLOYMENT.md)** - Custom domain setup

### For Development
1. **[CONTRIBUTING.md](CONTRIBUTING.md)** - Path management rules; how to add scripts
2. **[implementation/SMART_BUILD.md](implementation/SMART_BUILD.md)** - Incremental build system
3. **[implementation/IMAGE-OPTIMIZATION.md](implementation/IMAGE-OPTIMIZATION.md)** - Automated image optimization (90-95% size reduction)

## Contributing

When adding new documentation:
- Place in the appropriate subdirectory
- Update this README with a link
- Use clear, descriptive filenames
- Include examples where helpful
