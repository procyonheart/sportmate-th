# Workflow: Content Agent

## Objective
Generate all Thai-language copy and content for the sports companion landing page.

## Trigger
Run AFTER design_agent completes successfully.
`python tools/content_agent.py`

## Required Inputs
File: `.tmp/design_output.json` (must exist)

## Expected Output
File: `.tmp/content_output.json`

Keys returned:
- `brand_name` — echoed from design output
- `brand_name_thai` — Thai script name
- `hero_headline` — max 8 words, powerful Thai headline
- `hero_subheadline` — 1-2 sentence Thai subheadline
- `hero_cta_primary` — primary CTA button text (Thai)
- `hero_cta_secondary` — secondary CTA button text (Thai)
- `features` — array of 5: { icon (emoji), title (Thai), description (Thai) }
- `sports_categories` — array of 8 Thai sport names
- `how_it_works` — array of 3: { step (int), title (Thai), description (Thai) }
- `testimonials` — array of 3: { name (Thai), age (int), sport (str), quote (Thai), location (Bangkok district) }
- `stats` — array of 3: { number (str e.g. "50,000+"), label (Thai) }
- `gps_section_headline` — GPS feature section headline (Thai)
- `gps_section_description` — GPS feature description (Thai)
- `section_cta_headline` — mid-page CTA headline (Thai)
- `section_cta_text` — supporting CTA text (Thai)
- `footer_tagline` — footer brand tagline (Thai)
- `meta_description` — SEO meta 120-160 chars (Thai)

## Validation
- All text values must be in Thai
- features array: exactly 5 items
- sports_categories: exactly 8 items
- how_it_works: exactly 3 steps
- testimonials: exactly 3 items with Thai names and Bangkok districts

## Edge Cases
- Strip markdown fences before JSON parse
- max_tokens=2048 — content is verbose, needs more tokens than design agent
- If design_output.json missing: exit with error message

## Output Consumed By
- `tools/ad_agent.py`
- `tools/build_website.py`
