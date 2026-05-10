# Workflow: Ad Agent

## Objective
Generate Thai-language advertisements for Facebook/Instagram, Google Display, and TikTok.

## Trigger
Run AFTER content_agent completes successfully.
`python tools/ad_agent.py`

## Required Inputs
- `.tmp/design_output.json` (brand identity)
- `.tmp/content_output.json` (brand content and messaging)

## Expected Output
File: `.tmp/ads_output.json`

Keys returned:
- `facebook_ads` — array of 3:
  - `ad_id` — "fb_1", "fb_2", "fb_3"
  - `headline` — Thai, max 40 chars
  - `primary_text` — Thai, 2-3 conversational sentences
  - `description` — Thai link description
  - `cta_button` — Thai CTA (e.g. "ดาวน์โหลดเลย")
  - `visual_description` — key visual/creative description
  - `target_audience` — audience segment description
- `google_display_ads` — array of 2:
  - `ad_id` — "gd_1", "gd_2"
  - `headline_1` — Thai, max 30 chars
  - `headline_2` — Thai, max 30 chars
  - `description` — Thai, max 90 chars
  - `visual_description` — banner visual description
- `tiktok_hooks` — array of 3:
  - `hook_id` — "tt_1", "tt_2", "tt_3"
  - `hook_text` — first 3 seconds, Thai, punchy stop-scroll text
  - `script_outline` — 3-4 beat script outline in Thai
  - `audio_suggestion` — music/sound suggestion
  - `visual_description` — visual sequence description

## Validation
- facebook_ads: exactly 3 items
- google_display_ads: exactly 2 items
- tiktok_hooks: exactly 3 items
- Google Ads: headline_1/headline_2 must be ≤30 Thai chars, description ≤90 chars
- All copy must be in Thai

## Edge Cases
- Strip markdown fences before JSON parse
- If either input file missing: exit with error message

## Output Consumed By
- `tools/build_website.py`
