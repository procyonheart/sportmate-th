# Workflow: Build Website

## Objective
Assemble the complete index.html landing page from all three agent JSON outputs.

## Trigger
Run AFTER all three agents complete successfully.
`python tools/build_website.py`

## Required Inputs
- `.tmp/design_output.json`
- `.tmp/content_output.json`
- `.tmp/ads_output.json`

## Expected Output
File: `index.html` (in project root)

## Sections Generated (in order)
1. `<head>` — Tailwind CDN, Google Fonts (heading + body, Thai subset), Tailwind config with brand colors, custom CSS
2. Nav — fixed, backdrop-blur, logo + brand name + CTA button
3. Hero — full-viewport gradient, mock GPS phone mockup, headline + CTAs + stats badges
4. Stats Bar — 3 stats in horizontal band
5. GPS Feature Section — larger map UI, browser Geolocation API, animated activity pins
6. Features — 5 feature cards in responsive grid
7. Sports Categories — 8 sport chips with emoji
8. How It Works — 3-step flow
9. Testimonials — 3 user quote cards
10. Ads Showcase — tabbed UI: Facebook | Google Display | TikTok
11. CTA Section — strong gradient call-to-action
12. Footer — tagline, links, social icons
13. `<script>` — geolocation, tab switching, scroll animations

## Design Rules (CLAUDE.md)
- Tailwind CDN must come BEFORE tailwind.config block
- No `transition-all` — use `transition-transform` or `transition-opacity` only
- No flat `shadow-md` — use custom layered shadows with color tint
- Thai font line-height: 1.8 for legibility
- Heading font: tight tracking (-0.03em)
- Noise grain texture via SVG filter
- Every button: hover + focus-visible + active states

## Post-Build Verification
1. File size > 20KB
2. Contains brand name from design output
3. Contains Tailwind CDN script tag
4. Contains meta charset UTF-8 before any Thai text

## Serving & Screenshot
```
node serve.mjs          # Start server on localhost:3000
node screenshot.mjs http://localhost:3000
```
Read screenshot and verify: colors, Thai text, GPS mock, all sections visible.
Do at least 2 comparison rounds.
