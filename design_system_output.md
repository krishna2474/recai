## Design System: RECAI

### Pattern
- **Name:** Storytelling + Feature-Rich
- **CTA Placement:** Above fold
- **Sections:** Hero > Features > CTA

### Style
- **Name:** Liquid Glass
- **Keywords:** Flowing glass, morphing, smooth transitions, fluid effects, translucent, animated blur, iridescent, chromatic aberration
- **Best For:** Premium SaaS, high-end e-commerce, creative platforms, branding experiences, luxury portfolios
- **Performance:** ΓÜá Moderate-Poor | **Accessibility:** ΓÜá Text contrast

### Colors
| Role | Hex |
|------|-----|
| Primary | #1C1917 |
| Secondary | #44403C |
| CTA | #CA8A04 |
| Background | #FAFAF9 |
| Text | #0C0A09 |

*Notes: Black + Gold (#FFD700) + White + Minimal accent*

### Typography
- **Heading:** Satoshi
- **Body:** General Sans
- **Mood:** premium, modern, clean, sophisticated, versatile, balanced
- **Best For:** Premium brands, modern agencies, SaaS, portfolios, startups
- **Google Fonts:** https://fonts.google.com/share?selection.family=DM+Sans:wght@400;500;700
- **CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');
```

### Key Effects
Morphing elements (SVG/CSS), fluid animations (400-600ms curves), dynamic blur (backdrop-filter), color transitions

### Avoid (Anti-patterns)
- Cheap visuals
- Fast animations

### Pre-Delivery Checklist
- [ ] No emojis as icons (use SVG: Heroicons/Lucide)
- [ ] cursor-pointer on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard nav
- [ ] prefers-reduced-motion respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px

