import os
import json
import sys
from pathlib import Path
from dotenv import load_dotenv
import anthropic

load_dotenv(Path(__file__).parent.parent / ".env")

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

SYSTEM_PROMPT = """You are a senior UI/UX designer with 12 years of experience specializing in Thai fitness and sports mobile applications. You understand Thai aesthetic sensibilities — bold, energetic, community-driven, premium yet approachable for Thai users aged 18-35.

CRITICAL: Your output must ALWAYS be a single valid JSON object with NO markdown code fences, NO commentary, NO text outside the JSON. Start your response with { and end with }."""

USER_PROMPT = """Design a complete visual identity and design system for a Thai sports companion-finding app. The app helps Thai people find workout partners and sports buddies nearby using GPS.

Target audience: Thai adults 18-35, fitness-conscious, urban, social.
Sport types: running, cycling, football, badminton, muay thai, gym, yoga, hiking.

IMPORTANT constraints:
- primary_color must NOT be any shade of blue (#3B82F6, #2563EB, #1D4ED8, etc.) or indigo (#4F46E5, #4338CA, etc.)
- Choose energetic colors that represent sports: orange, red, green, teal, purple, coral, etc.
- Fonts MUST be from this Thai-compatible list ONLY: "Noto Sans Thai", "Sarabun", "Prompt", "Kanit", "IBM Plex Sans Thai"
- heading_font and body_font MUST be different fonts

Return ONLY a JSON object with exactly these keys:
{
  "brand_name": "creative app name, Thai-friendly, can mix Thai/English, memorable and sporty",
  "brand_name_thai": "Thai script version or subtitle (เช่น แอปหาเพื่อนกีฬา)",
  "tagline": "short punchy Thai tagline, max 6 words",
  "primary_color": "#RRGGBB (NOT blue or indigo)",
  "secondary_color": "#RRGGBB (complementary, for accents)",
  "accent_color": "#RRGGBB (bright, for CTAs and highlights)",
  "background_color": "#RRGGBB (dark or light page background)",
  "surface_color": "#RRGGBB (card/panel background, slightly different from bg)",
  "text_primary": "#RRGGBB",
  "text_secondary": "#RRGGBB (muted, for captions)",
  "heading_font": "exact Google Fonts name from the allowed list",
  "body_font": "exact Google Fonts name from the allowed list (different from heading)",
  "design_mood": "3-5 adjectives describing the aesthetic",
  "border_radius": "e.g. 16px",
  "section_order": ["hero", "stats", "gps", "features", "sports_categories", "how_it_works", "testimonials", "ads", "cta"],
  "hero_style": "describe the hero visual approach in 1-2 sentences",
  "color_rationale": "1-2 sentences why these colors work for Thai fitness audience"
}"""


def strip_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    return text


def run():
    print("[design_agent] Calling Claude API...")
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": USER_PROMPT}],
    )
    raw = strip_fences(response.content[0].text)
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"[design_agent] JSON parse error: {e}")
        print(f"[design_agent] Raw output:\n{raw}")
        sys.exit(1)

    out_path = Path(__file__).parent.parent / ".tmp" / "design_output.json"
    out_path.parent.mkdir(exist_ok=True)
    out_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[design_agent] Saved to {out_path}")
    print(json.dumps(data, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    run()
