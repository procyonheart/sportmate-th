import os
import json
import sys
from pathlib import Path
from dotenv import load_dotenv
import anthropic

load_dotenv(Path(__file__).parent.parent / ".env")

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

SYSTEM_PROMPT = """คุณเป็นนักการตลาดดิจิทัลชาวไทยที่เชี่ยวชาญด้าน Performance Marketing สำหรับแอปไลฟ์สไตล์และฟิตเนส มีประสบการณ์ 6 ปีในการสร้าง Creative ที่ทำให้คน Stop Scroll และคลิก บน Facebook, Instagram และ TikTok สำหรับกลุ่มคนไทยอายุ 18-35 ปี

คุณเข้าใจ Pain Point ของคนที่อยากออกกำลังกายแต่หาเพื่อนไม่ได้ และรู้วิธีใช้ภาษาพูดที่เข้าถึงคนรุ่นใหม่

IMPORTANT: Output must be a single valid JSON object only. No markdown fences, no text outside the JSON. Start with {{ and end with }}."""


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
    base = Path(__file__).parent.parent
    design_path = base / ".tmp" / "design_output.json"
    content_path = base / ".tmp" / "content_output.json"

    for p in [design_path, content_path]:
        if not p.exists():
            print(f"[ad_agent] ERROR: {p.name} not found. Run previous agents first.")
            sys.exit(1)

    design = json.loads(design_path.read_text(encoding="utf-8"))
    content = json.loads(content_path.read_text(encoding="utf-8"))

    brand = design['brand_name']
    tagline = design['tagline']
    hero_headline = content.get('hero_headline', '')

    user_prompt = f"""สร้างโฆษณาดิจิทัลภาษาไทยสำหรับแอป {brand} — แอปหาเพื่อนออกกำลังกายที่ใช้ GPS หาคนใกล้บ้านที่สนใจกีฬาเดียวกัน

Tagline: {tagline}
Hero Headline: {hero_headline}
กลุ่มเป้าหมาย: คนไทย 18-35 ปี ที่อยากออกกำลังกายแต่หาเพื่อนไม่ได้

สร้างโฆษณา 3 แพลตฟอร์ม:

Return ONLY a JSON object with exactly these keys:
{{
  "facebook_ads": [
    {{
      "ad_id": "fb_1",
      "headline": "headline ภาษาไทย ไม่เกิน 40 ตัวอักษร",
      "primary_text": "body copy ภาษาไทย 2-3 ประโยคที่เป็นธรรมชาติ เหมือนเพื่อนพูด ไม่ formal",
      "description": "link description สั้นๆ ภาษาไทย",
      "cta_button": "ข้อความ CTA เช่น ดาวน์โหลดเลย",
      "visual_description": "อธิบาย key visual ที่ควรใช้ในโฆษณานี้ (ภาษาไทย)",
      "target_audience": "กลุ่มเป้าหมายของโฆษณานี้โดยเฉพาะ"
    }},
    {{
      "ad_id": "fb_2",
      ...โฆษณาที่ 2 focus Pain Point ต่างกัน...
    }},
    {{
      "ad_id": "fb_3",
      ...โฆษณาที่ 3 focus Social Proof หรือ GPS Feature...
    }}
  ],
  "google_display_ads": [
    {{
      "ad_id": "gd_1",
      "headline_1": "ไม่เกิน 30 ตัวอักษร",
      "headline_2": "ไม่เกิน 30 ตัวอักษร",
      "description": "ไม่เกิน 90 ตัวอักษร",
      "visual_description": "อธิบาย banner design ที่เหมาะสม"
    }},
    {{
      "ad_id": "gd_2",
      ...โฆษณา Google Display ที่ 2...
    }}
  ],
  "tiktok_hooks": [
    {{
      "hook_id": "tt_1",
      "hook_text": "ประโยคแรก 3 วินาที ที่ทำให้หยุด scroll ภาษาไทย เป็นคำถามหรือ statement ที่ relatable",
      "script_outline": "outline script 3-4 beat: hook → problem → solution → CTA (ภาษาไทย)",
      "audio_suggestion": "แนะนำ BGM หรือ sound effect ที่เหมาะ",
      "visual_description": "อธิบาย visual sequence ที่ควรถ่าย"
    }},
    {{
      "hook_id": "tt_2",
      ...TikTok hook ที่ 2 style ต่างกัน...
    }},
    {{
      "hook_id": "tt_3",
      ...TikTok hook ที่ 3 style ต่างกัน...
    }}
  ]
}}"""

    print("[ad_agent] Calling Claude API...")
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=8096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )
    raw = strip_fences(response.content[0].text)
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"[ad_agent] JSON parse error: {e}")
        print(f"[ad_agent] Raw output:\n{raw}")
        sys.exit(1)

    out_path = base / ".tmp" / "ads_output.json"
    out_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[ad_agent] Saved to {out_path}")
    print(json.dumps(data, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    run()
