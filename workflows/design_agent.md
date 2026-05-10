# Workflow: Design Agent

## Objective
Generate a complete visual identity and design system for a Thai sports companion-finding app.

## Trigger
Run first in the pipeline before any other agent.
`python tools/design_agent.py`

## Required Inputs
- App concept: Thai sports/fitness companion-finding app with GPS
- Target audience: Thai adults 18-35, urban, fitness-conscious
- Sport types: running, cycling, football, badminton, muay thai, gym, yoga, hiking

## Expected Output
File: `.tmp/design_output.json`

Keys returned:
- `brand_name` — creative app name (Thai-friendly, can mix Thai/English)
- `brand_name_thai` — Thai script subtitle
- `tagline` — short punchy Thai tagline
- `primary_color` — hex (NOT blue/indigo family)
- `secondary_color` — hex, complementary
- `accent_color` — hex, for CTAs
- `background_color` — hex, page background
- `surface_color` — hex, card/panel surfaces
- `text_primary` — hex
- `text_secondary` — hex
- `heading_font` — Google Fonts name (must support Thai)
- `body_font` — Google Fonts name (must support Thai, different from heading)
- `design_mood` — 3-5 adjectives
- `border_radius` — e.g. "16px"
- `section_order` — array of section names
- `hero_style` — hero visual description
- `color_rationale` — why these colors fit Thai fitness audience

## Validation
- primary_color must NOT be in blue (#3B82F6) or indigo (#4F46E5) family
- All colors: valid hex codes (#RRGGBB)
- heading_font and body_font must be different fonts
- Fonts must be from Thai-compatible list: Noto Sans Thai, Sarabun, Prompt, Kanit, IBM Plex Sans Thai
- section_order must include: hero, features, how_it_works, testimonials, cta

## Edge Cases
- Strip markdown fences (```json ... ```) before JSON parse
- If API rate limit: wait 60s, retry once
- If primary_color is blue/indigo: re-run with explicit constraint

## Output Consumed By
- `tools/content_agent.py`
- `tools/ad_agent.py`
- `tools/build_website.py`
