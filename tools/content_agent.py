import os
import json
import sys
from pathlib import Path
from dotenv import load_dotenv
import anthropic

load_dotenv(Path(__file__).parent.parent / ".env")

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

SYSTEM_PROMPT = """คุณเป็นนักเขียนคอนเทนต์ชาวไทยที่เชี่ยวชาญด้านแอปกีฬาและฟิตเนส มีประสบการณ์ 8 ปีในการสร้างคอนเทนต์ที่สร้างแรงบันดาลใจให้คนไทยออกกำลังกาย คุณเข้าใจวัฒนธรรมกีฬาไทย ภาษาที่ใช้ในกลุ่มคนรุ่นใหม่อายุ 18-35 ปี และวิธีเขียน CTA ที่กระตุ้นใจ

IMPORTANT: Output must be a single valid JSON object only. No markdown fences, no text outside the JSON. Start with { and end with }."""


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
    if not design_path.exists():
        print("[content_agent] ERROR: design_output.json not found. Run design_agent.py first.")
        sys.exit(1)

    design = json.loads(design_path.read_text(encoding="utf-8"))

    user_prompt = f"""คุณได้รับข้อมูล brand identity ของแอปหาเพื่อนออกกำลังกาย ดังนี้:
- ชื่อแอป: {design['brand_name']} ({design.get('brand_name_thai', '')})
- Tagline: {design['tagline']}
- Design mood: {design['design_mood']}
- สีหลัก: {design['primary_color']}, สีเสริม: {design['accent_color']}

กรุณาสร้าง content ภาษาไทยทั้งหมดสำหรับ landing page ของแอปนี้

Return ONLY a JSON object with exactly these keys:
{{
  "brand_name": "{design['brand_name']}",
  "brand_name_thai": "{design.get('brand_name_thai', '')}",
  "hero_headline": "ประโยคหลักที่ทรงพลัง ไม่เกิน 8 คำ กระตุ้นให้คนอยากหาเพื่อนออกกำลังกาย",
  "hero_subheadline": "ประโยคอธิบายเพิ่มเติม 1-2 ประโยค อธิบายว่าแอปทำอะไร",
  "hero_cta_primary": "ปุ่ม CTA หลัก เช่น ดาวน์โหลดฟรี หรือ เริ่มต้นเลย",
  "hero_cta_secondary": "ปุ่ม CTA รอง เช่น ดูวิธีใช้ หรือ เรียนรู้เพิ่มเติม",
  "features": [
    {{"icon": "emoji ที่เกี่ยวข้อง", "title": "ชื่อฟีเจอร์ภาษาไทย", "description": "อธิบาย 1-2 ประโยค"}}
    // ใส่ทั้งหมด 5 features: GPS หาเพื่อน, matching กีฬา, กลุ่ม community, chat, กิจกรรม
  ],
  "sports_categories": ["วิ่ง", "ปั่นจักรยาน", "ฟุตบอล", "แบดมินตัน", "มวยไทย", "ยิม", "โยคะ", "เดินป่า"],
  "how_it_works": [
    {{"step": 1, "title": "ชื่อขั้นตอนภาษาไทย", "description": "อธิบาย 1 ประโยค"}}
    // ใส่ 3 ขั้นตอน: สมัคร→เลือกกีฬา→หาเพื่อน
  ],
  "testimonials": [
    {{"name": "ชื่อไทย", "age": 25, "sport": "กีฬา", "quote": "คำพูด 2-3 ประโยค", "location": "ย่านในกรุงเทพ"}}
    // ใส่ 3 testimonials จากผู้ใช้จริงที่หลากหลาย
  ],
  "stats": [
    {{"number": "50,000+", "label": "ป้ายกำกับภาษาไทย"}}
    // ใส่ 3 สถิติ: จำนวนผู้ใช้, กิจกรรม, เมือง
  ],
  "gps_section_headline": "หัวข้อ section GPS ภาษาไทย",
  "gps_section_description": "อธิบาย GPS feature 2-3 ประโยค",
  "section_cta_headline": "หัวข้อ mid-page CTA ภาษาไทย",
  "section_cta_text": "ข้อความสนับสนุน CTA 1-2 ประโยค",
  "footer_tagline": "tagline footer ภาษาไทย สั้นๆ",
  "meta_description": "SEO meta description ภาษาไทย 120-160 ตัวอักษร"
}}"""

    print("[content_agent] Calling Claude API...")
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )
    raw = strip_fences(response.content[0].text)
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"[content_agent] JSON parse error: {e}")
        print(f"[content_agent] Raw output:\n{raw}")
        sys.exit(1)

    out_path = base / ".tmp" / "content_output.json"
    out_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[content_agent] Saved to {out_path}")
    print(json.dumps(data, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    run()
