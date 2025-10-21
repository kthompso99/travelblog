# Creative Commons License

This site is licensed under **Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)**.

## License Details

**Full License**: https://creativecommons.org/licenses/by-nc-nd/4.0/

### You are free to:

- **Share** — copy and redistribute the material in any medium or format

The licensor cannot revoke these freedoms as long as you follow the license terms.

### Under the following terms:

- **Attribution** — You must give appropriate credit, provide a link to the license, and indicate if changes were made.

- **NonCommercial** — You may not use the material for commercial purposes.

- **NoDerivatives** — If you remix, transform, or build upon the material, you may not distribute the modified material.

- **No additional restrictions** — You may not apply legal terms or technological measures that legally restrict others from doing anything the license permits.

## Footer Implementation

The Creative Commons footer appears on all pages of this site:

```html
<a href="http://twotravelnuts.com">Two Travel Nuts</a> © 2025 by
<a href="https://creativecommons.org">Kevin Thompson</a> is licensed under
<a href="https://creativecommons.org/licenses/by-nc-nd/4.0/">CC BY-NC-ND 4.0</a>
```

Plus CC license icons (BY, NC, ND).

### Pages with Footer

The Creative Commons footer is included on:

- ✅ Homepage (`index.html`)
- ✅ All trip pages (`trips/*/index.html`)
- ✅ Map page (`map/index.html`)
- ✅ About page (`about/index.html`)

The footer is defined in the base template ([templates/base.html](../../templates/base.html)) so it automatically appears on all generated pages.

## Source HTML

The original Creative Commons HTML is stored in:
- [docs/reference/CreativeCommonsFooter.html](CreativeCommonsFooter.html)

This is the exact HTML provided by Creative Commons when generating the license.

## License Icons

The footer includes four Creative Commons icon images:

1. **CC** - Creative Commons logo
2. **BY** - Attribution required
3. **NC** - NonCommercial use only
4. **ND** - No derivatives allowed

Icons are served from: `https://mirrors.creativecommons.org/presskit/icons/`

## Updating the License

If you need to change the license in the future:

1. Generate new license at: https://creativecommons.org/choose/
2. Save HTML to `docs/reference/CreativeCommonsFooter.html`
3. Update footer in `templates/base.html`
4. Rebuild: `npm run build`
5. Commit and deploy

## What This Means for Your Content

### Allowed:
- ✅ Others can share your travel photos and stories
- ✅ Can share on social media, blogs, etc.
- ✅ Must credit you as the author

### Not Allowed:
- ❌ Cannot use for commercial purposes (e.g., in ads, for profit)
- ❌ Cannot modify your content
- ❌ Cannot create derivatives (translations, adaptations, etc.)

## Questions?

See the official Creative Commons FAQ: https://creativecommons.org/faq/

---

**Your Content, Your Rights** — This license protects your travel stories while allowing others to share them with proper attribution.
