import json
import sys
from pathlib import Path

SPORT_EMOJIS = {
    "วิ่ง": "🏃", "ปั่น": "🚴", "จักรยาน": "🚴", "ฟุตบอล": "⚽",
    "แบดมินตัน": "🏸", "มวยไทย": "🥊", "ยิม": "🏋️", "โยคะ": "🧘",
    "เดิน": "🥾", "ว่าย": "🏊", "บาสเก": "🏀", "เทนนิส": "🎾",
    "กอล์ฟ": "⛳", "วอลเลย์": "🏐", "สเก": "⛸️",
}


def get_sport_emoji(name):
    for key, emoji in SPORT_EMOJIS.items():
        if key in name:
            return emoji
    return "🏅"


def hex_to_rgba(hex_color, opacity):
    h = hex_color.lstrip("#")
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return f"rgba({r},{g},{b},{opacity})"


def build_head(d, c):
    hf = d["heading_font"].replace(" ", "+")
    bf = d["body_font"].replace(" ", "+")
    if d["heading_font"] != d["body_font"]:
        fonts_q = f"family={hf}:wght@700;900&family={bf}:wght@400;500;600"
    else:
        fonts_q = f"family={hf}:wght@400;500;600;700;900"

    p = d["primary_color"]
    s = d["secondary_color"]
    a = d["accent_color"]
    bg = d["background_color"]
    sf = d["surface_color"]
    tp = d["text_primary"]
    ts = d["text_secondary"]
    hfont = d["heading_font"]
    bfont = d["body_font"]
    shadow1 = hex_to_rgba(p, 0.18)
    shadow2 = hex_to_rgba(p, 0.10)
    glow = hex_to_rgba(a, 0.30)

    return f"""<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="{c['meta_description']}">
<title>{c['brand_name']}</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?{fonts_q}&display=swap" rel="stylesheet">
<script>
  tailwind.config = {{
    theme: {{
      extend: {{
        colors: {{
          primary: '{p}',
          secondary: '{s}',
          accent: '{a}',
          surface: '{sf}',
          bgbase: '{bg}',
          muted: '{ts}',
        }},
        fontFamily: {{
          display: ['{hfont}', 'sans-serif'],
          body: ['{bfont}', 'sans-serif'],
        }},
      }}
    }}
  }}
</script>
<style>
  *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
  html {{ scroll-behavior: smooth; }}
  body {{
    font-family: '{bfont}', sans-serif;
    background-color: {bg};
    color: {tp};
    line-height: 1.8;
    -webkit-font-smoothing: antialiased;
  }}
  h1, h2, h3, h4, h5, h6 {{
    font-family: '{hfont}', sans-serif;
    letter-spacing: -0.03em;
    line-height: 1.2;
  }}
  ::-webkit-scrollbar {{ width: 6px; }}
  ::-webkit-scrollbar-track {{ background: {bg}; }}
  ::-webkit-scrollbar-thumb {{ background: {p}60; border-radius: 3px; }}

  /* Noise grain texture */
  .noise-layer {{
    position: absolute; inset: 0; pointer-events: none; z-index: 1;
    opacity: 0.045;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 200px 200px;
  }}

  /* Branded shadow utility */
  .shadow-brand {{ box-shadow: 0 2px 8px {shadow2}, 0 8px 28px {shadow1}; }}
  .shadow-brand-lg {{ box-shadow: 0 4px 20px {shadow2}, 0 16px 48px {shadow1}; }}
  .glow-accent {{ box-shadow: 0 0 30px {glow}; }}

  /* Animations — only transform and opacity */
  @keyframes float {{
    0%, 100% {{ transform: translate(-50%, -50%); }}
    50% {{ transform: translate(-50%, calc(-50% - 8px)); }}
  }}
  @keyframes pulse-ring {{
    0% {{ transform: translate(-50%, -50%) scale(1); opacity: 0.7; }}
    100% {{ transform: translate(-50%, -50%) scale(2.8); opacity: 0; }}
  }}
  @keyframes pin-pop {{
    0% {{ transform: translate(-50%, -50%) scale(0) translateY(12px); opacity: 0; }}
    70% {{ transform: translate(-50%, -50%) scale(1.15); opacity: 1; }}
    100% {{ transform: translate(-50%, -50%) scale(1); opacity: 1; }}
  }}
  @keyframes fade-up {{
    from {{ transform: translateY(28px); opacity: 0; }}
    to {{ transform: translateY(0); opacity: 1; }}
  }}
  @keyframes slide-in {{
    from {{ transform: translateX(-16px); opacity: 0; }}
    to {{ transform: translateX(0); opacity: 1; }}
  }}

  /* Scroll animations */
  .animate-on-scroll {{ opacity: 0; transform: translateY(28px); transition: opacity 0.6s ease, transform 0.6s ease; }}
  .animate-on-scroll.visible {{ opacity: 1; transform: translateY(0); }}
  .animate-on-scroll.delay-1 {{ transition-delay: 0.1s; }}
  .animate-on-scroll.delay-2 {{ transition-delay: 0.2s; }}
  .animate-on-scroll.delay-3 {{ transition-delay: 0.3s; }}
  .animate-on-scroll.delay-4 {{ transition-delay: 0.4s; }}
  .animate-on-scroll.delay-5 {{ transition-delay: 0.5s; }}

  /* Mock GPS Map */
  .mock-map {{
    background: #0f1623;
    position: relative;
    overflow: hidden;
    border-radius: 20px;
  }}
  .map-grid {{
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px);
    background-size: 40px 40px;
  }}
  .map-road-h {{
    position: absolute; left: 0; right: 0; height: 2px;
    background: rgba(255,255,255,0.12);
  }}
  .map-road-v {{
    position: absolute; top: 0; bottom: 0; width: 2px;
    background: rgba(255,255,255,0.12);
  }}
  .activity-pin {{
    position: absolute;
    transform: translate(-50%, -50%);
    animation: pin-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards, float 4s ease-in-out 0.5s infinite;
    cursor: pointer;
    z-index: 10;
  }}
  .activity-pin:hover .pin-card {{ opacity: 1; transform: translateX(-50%) translateY(-4px); }}
  .pin-emoji {{
    width: 36px; height: 36px;
    background: {sf};
    border-radius: 50% 50% 50% 4px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    border: 2px solid {p};
  }}
  .pin-card {{
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    background: rgba(15,22,35,0.95);
    border: 1px solid rgba(255,255,255,0.12);
    backdrop-filter: blur(8px);
    padding: 6px 10px;
    border-radius: 10px;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.2s ease, transform 0.2s ease;
    pointer-events: none;
  }}
  .pin-card p {{ font-size: 11px; color: white; line-height: 1.4; }}
  .pin-card span {{ font-size: 10px; color: {p}; font-weight: 600; }}
  .user-location {{
    position: absolute;
    transform: translate(-50%, -50%);
    z-index: 20;
  }}
  .user-dot {{
    width: 14px; height: 14px;
    background: {a};
    border-radius: 50%;
    border: 2.5px solid white;
    position: relative; z-index: 2;
    box-shadow: 0 0 0 4px {hex_to_rgba(a, 0.3)};
  }}
  .user-ring {{
    position: absolute;
    width: 14px; height: 14px;
    border: 2px solid {a};
    border-radius: 50%;
    top: 0; left: 0;
    animation: pulse-ring 2s ease-out infinite;
  }}
  .user-ring:nth-child(2) {{ animation-delay: 0.7s; }}

  /* Phone frame */
  .phone-frame {{
    background: {sf};
    border-radius: 44px;
    border: 3px solid rgba(255,255,255,0.12);
    position: relative;
    overflow: hidden;
    box-shadow: 0 32px 80px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);
  }}
  .phone-notch {{
    position: absolute; top: 12px; left: 50%;
    transform: translateX(-50%);
    width: 80px; height: 6px;
    background: rgba(0,0,0,0.5);
    border-radius: 3px;
    z-index: 30;
  }}

  /* Button states */
  .btn-primary {{
    display: inline-flex; align-items: center; gap: 8px;
    padding: 14px 28px; border-radius: 50px;
    background: {p}; color: white;
    font-family: '{hfont}', sans-serif;
    font-weight: 700; font-size: 15px;
    letter-spacing: -0.01em;
    transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease;
    box-shadow: 0 4px 16px {shadow1};
    cursor: pointer; border: none;
    text-decoration: none;
  }}
  .btn-primary:hover {{ transform: translateY(-2px) scale(1.02); opacity: 0.95; }}
  .btn-primary:focus-visible {{ outline: 3px solid {a}; outline-offset: 3px; }}
  .btn-primary:active {{ transform: scale(0.97); }}

  .btn-secondary {{
    display: inline-flex; align-items: center; gap: 8px;
    padding: 13px 26px; border-radius: 50px;
    background: transparent; color: {tp};
    font-family: '{hfont}', sans-serif;
    font-weight: 600; font-size: 15px;
    border: 2px solid rgba(255,255,255,0.2);
    transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
    cursor: pointer;
    text-decoration: none;
  }}
  .btn-secondary:hover {{ background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.35); transform: translateY(-1px); }}
  .btn-secondary:focus-visible {{ outline: 3px solid {a}; outline-offset: 3px; }}
  .btn-secondary:active {{ transform: scale(0.97); }}

  /* Feature cards */
  .feature-card {{
    background: {sf};
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: {d['border_radius']};
    padding: 28px;
    transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease;
  }}
  .feature-card:hover {{ transform: translateY(-6px); box-shadow: 0 8px 32px {shadow1}; }}

  /* Sport chips */
  .sport-chip {{
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    padding: 20px 16px;
    background: {sf};
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: {d['border_radius']};
    transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), background 0.2s ease, box-shadow 0.2s ease;
    cursor: pointer;
  }}
  .sport-chip:hover {{ transform: translateY(-4px) scale(1.04); background: {p}18; box-shadow: 0 6px 20px {shadow2}; }}
  .sport-chip:focus-visible {{ outline: 3px solid {a}; outline-offset: 2px; }}
  .sport-chip:active {{ transform: scale(0.96); }}

  /* Step connectors */
  .step-line {{ background: linear-gradient(to bottom, {p}, {a}); }}

  /* Testimonial cards */
  .testimonial-card {{
    background: {sf};
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: {d['border_radius']};
    padding: 28px;
    position: relative;
    overflow: hidden;
    transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
  }}
  .testimonial-card::before {{
    content: '"';
    position: absolute;
    top: -12px; left: 20px;
    font-size: 120px;
    font-family: Georgia, serif;
    color: {p}20;
    line-height: 1;
    pointer-events: none;
  }}
  .testimonial-card:hover {{ transform: translateY(-4px); }}

  /* Ad tabs */
  .ad-tab {{
    padding: 10px 22px; border-radius: 50px;
    font-family: '{hfont}', sans-serif;
    font-weight: 600; font-size: 14px;
    color: {ts}; background: transparent;
    border: 1.5px solid rgba(255,255,255,0.1);
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  }}
  .ad-tab:hover {{ background: {p}18; border-color: {p}40; color: {tp}; }}
  .ad-tab:focus-visible {{ outline: 3px solid {a}; outline-offset: 2px; }}
  .ad-tab.active-tab {{ background: {p}; color: white; border-color: {p}; }}

  /* FB ad mock */
  .fb-ad-frame {{
    background: #18191a;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.1);
    overflow: hidden;
    max-width: 420px;
    margin: 0 auto;
  }}
  .fb-ad-image {{
    height: 200px;
    display: flex; align-items: center; justify-content: center;
    font-size: 32px;
    position: relative; overflow: hidden;
  }}
  .fb-ad-image::after {{
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.6), transparent);
  }}

  /* Google display ad mock */
  .google-ad-frame {{
    background: {sf};
    border: 2px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    overflow: hidden;
    max-width: 600px;
    margin: 0 auto;
  }}

  /* TikTok frame */
  .tiktok-frame {{
    background: #000;
    border-radius: 24px;
    border: 3px solid rgba(255,255,255,0.12);
    overflow: hidden;
    width: 220px;
    aspect-ratio: 9/16;
    margin: 0 auto;
    position: relative;
  }}

  /* CTA gradient */
  .cta-section {{
    background: linear-gradient(135deg, {p} 0%, {s} 50%, {a} 100%);
    position: relative; overflow: hidden;
  }}

  /* Section label */
  .section-label {{
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 16px; border-radius: 50px;
    background: {p}20; border: 1px solid {p}40;
    color: {p}; font-size: 13px; font-weight: 600;
    letter-spacing: 0.05em; text-transform: uppercase;
    margin-bottom: 16px;
  }}

  /* Responsive grid overrides */
  @media (max-width: 900px) {{
    .hero-grid {{ grid-template-columns: 1fr !important; }}
    .gps-grid {{ grid-template-columns: 1fr !important; }}
    .footer-grid {{ grid-template-columns: 1fr !important; }}
    .sports-grid {{ grid-template-columns: repeat(2, 1fr) !important; }}
    .feature-grid {{ grid-template-columns: 1fr !important; }}
    .phone-outer {{ display: none !important; }}
    .hero-text {{ text-align: center !important; }}
    .hero-btns {{ justify-content: center !important; }}
    .hero-stats {{ justify-content: center !important; }}
  }}

  /* Nav link states */
  .nav-link {{
    color: {ts}; font-size: 15px; font-weight: 500;
    text-decoration: none;
    transition: color 0.2s ease, opacity 0.2s ease;
    position: relative; padding-bottom: 2px;
  }}
  .nav-link::after {{
    content: ''; position: absolute; bottom: 0; left: 0;
    width: 0; height: 2px; background: {p};
    transition: width 0.25s ease;
  }}
  .nav-link:hover {{ color: {tp}; }}
  .nav-link:hover::after {{ width: 100%; }}
  .nav-link:focus-visible {{ outline: 2px solid {a}; outline-offset: 4px; border-radius: 2px; }}
</style>
</head>"""


def build_nav(d, c):
    p = d["primary_color"]
    sf = d["surface_color"]
    tp = d["text_primary"]
    a = d["accent_color"]
    brand = c["brand_name"]

    return f"""<nav style="position:fixed;top:0;left:0;right:0;z-index:50;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);background:{sf}cc;border-bottom:1px solid rgba(255,255,255,0.07);">
  <div style="max-width:1280px;margin:0 auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between;height:68px;">
    <div style="display:flex;align-items:center;gap:10px;">
      <span style="font-size:28px;">🏃</span>
      <span style="font-family:'{d['heading_font']}',sans-serif;font-weight:900;font-size:20px;color:{tp};letter-spacing:-0.03em;">{brand}</span>
    </div>
    <div class="hidden md:flex" style="display:flex;align-items:center;gap:32px;">
      <a href="#features" class="nav-link">ฟีเจอร์</a>
      <a href="#how-it-works" class="nav-link">วิธีใช้</a>
      <a href="#gps" class="nav-link">GPS</a>
      <a href="#ads" class="nav-link">โฆษณา</a>
    </div>
    <a href="#cta" class="btn-primary" style="padding:10px 22px;font-size:14px;">{c['hero_cta_primary']}</a>
  </div>
</nav>"""


def build_hero(d, c):
    p = d["primary_color"]
    s = d["secondary_color"]
    a = d["accent_color"]
    bg = d["background_color"]
    sf = d["surface_color"]
    tp = d["text_primary"]
    ts = d["text_secondary"]
    glow = hex_to_rgba(p, 0.25)
    glow2 = hex_to_rgba(a, 0.20)

    mock_pins = [
        {"emoji": "🏃", "label": "กลุ่มวิ่งเช้า", "dist": "0.3 กม.", "left": "28%", "top": "38%", "delay": "0s", "speed": "3.5s"},
        {"emoji": "🚴", "label": "ปั่นจักรยาน", "dist": "0.7 กม.", "left": "68%", "top": "25%", "delay": "0.15s", "speed": "4s"},
        {"emoji": "⚽", "label": "ฟุตบอล 5 คน", "dist": "1.1 กม.", "left": "18%", "top": "62%", "delay": "0.3s", "speed": "3.8s"},
        {"emoji": "🥊", "label": "มวยไทย", "dist": "1.4 กม.", "left": "76%", "top": "58%", "delay": "0.45s", "speed": "4.2s"},
        {"emoji": "🏸", "label": "แบดมินตัน", "dist": "1.9 กม.", "left": "50%", "top": "72%", "delay": "0.6s", "speed": "3.6s"},
    ]

    pins_html = ""
    for pin in mock_pins:
        pins_html += f"""
      <div class="activity-pin" style="left:{pin['left']};top:{pin['top']};animation-delay:{pin['delay']};animation-duration:{pin['speed']},4s;">
        <div class="pin-card">
          <p>{pin['label']}</p>
          <span>{pin['dist']}</span>
        </div>
        <div class="pin-emoji">{pin['emoji']}</div>
      </div>"""

    stats_html = ""
    for i, stat in enumerate(c.get("stats", [])):
        stats_html += f"""
      <div style="display:flex;flex-direction:column;gap:2px;">
        <span style="font-family:'{d['heading_font']}',sans-serif;font-weight:900;font-size:28px;color:{p};letter-spacing:-0.03em;">{stat['number']}</span>
        <span style="font-size:13px;color:{ts};">{stat['label']}</span>
      </div>
      {'<div style="width:1px;height:40px;background:rgba(255,255,255,0.1);"></div>' if i < len(c.get('stats', [])) - 1 else ''}"""

    return f"""<section id="hero" style="position:relative;min-height:100vh;display:flex;align-items:center;overflow:hidden;padding-top:68px;">
  <!-- Layered gradient bg -->
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 70% 40%, {glow}, transparent),radial-gradient(ellipse 60% 50% at 20% 80%, {glow2}, transparent),{bg};"></div>
  <div class="noise-layer"></div>

  <div class="hero-grid" style="max-width:1280px;margin:0 auto;padding:80px 24px;display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;width:100%;position:relative;z-index:2;">
    <!-- Left: Content -->
    <div style="animation:fade-up 0.8s ease-out both;">
      <div class="section-label">🌍 GPS-Powered</div>
      <h1 style="font-size:clamp(2.8rem,5vw,4.5rem);font-weight:900;color:{tp};line-height:1.1;margin-bottom:24px;">{c['hero_headline']}</h1>
      <p style="font-size:18px;color:{ts};line-height:1.8;margin-bottom:36px;max-width:480px;">{c['hero_subheadline']}</p>
      <div class="hero-btns" style="display:flex;flex-wrap:wrap;gap:14px;margin-bottom:48px;">
        <a href="#cta" class="btn-primary" style="font-size:16px;padding:15px 32px;">{c['hero_cta_primary']} →</a>
        <a href="#how-it-works" class="btn-secondary">{c['hero_cta_secondary']}</a>
      </div>
      <!-- Stats row -->
      <div class="hero-stats" style="display:flex;align-items:center;gap:28px;padding-top:32px;border-top:1px solid rgba(255,255,255,0.08);">
        {stats_html}
      </div>
    </div>

    <!-- Right: Phone mockup with GPS map -->
    <div class="phone-outer" style="display:flex;justify-content:center;align-items:center;animation:fade-up 0.8s ease-out 0.2s both;">
      <div style="position:relative;">
        <!-- Floating glow blobs behind phone -->
        <div style="position:absolute;top:-40px;right:-40px;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle, {glow}, transparent 70%);pointer-events:none;"></div>
        <div style="position:absolute;bottom:-20px;left:-30px;width:160px;height:160px;border-radius:50%;background:radial-gradient(circle, {glow2}, transparent 70%);pointer-events:none;"></div>

        <!-- Phone frame -->
        <div class="phone-frame" style="width:280px;height:560px;">
          <div class="phone-notch"></div>

          <!-- Status bar -->
          <div style="padding:18px 20px 8px;display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:600;color:{ts};position:relative;z-index:20;">
            <span>09:41</span>
            <div style="display:flex;gap:6px;align-items:center;">
              <span>📶</span><span>🔋</span>
            </div>
          </div>

          <!-- App header bar -->
          <div style="padding:8px 16px 12px;display:flex;justify-content:space-between;align-items:center;position:relative;z-index:20;">
            <div>
              <p style="font-size:12px;color:{ts};">สวัสดีคุณ!</p>
              <p style="font-size:15px;font-weight:700;color:{tp};">กิจกรรมใกล้คุณ</p>
            </div>
            <div style="width:36px;height:36px;border-radius:50%;background:{p}30;display:flex;align-items:center;justify-content:center;font-size:18px;">👤</div>
          </div>

          <!-- GPS Map area -->
          <div class="mock-map" style="height:260px;margin:0 12px;border-radius:16px;">
            <div class="map-grid"></div>
            <div class="map-road-h" style="top:28%;"></div>
            <div class="map-road-h" style="top:55%;height:3px;"></div>
            <div class="map-road-h" style="top:78%;"></div>
            <div class="map-road-v" style="left:35%;"></div>
            <div class="map-road-v" style="left:65%;width:3px;"></div>
            {pins_html}
            <!-- User location -->
            <div class="user-location" style="left:50%;top:50%;">
              <div class="user-ring"></div>
              <div class="user-ring" style="animation-delay:0.7s;"></div>
              <div class="user-dot"></div>
            </div>
            <!-- Activity count badge -->
            <div style="position:absolute;top:10px;right:10px;background:{p};color:white;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;z-index:20;">5 กิจกรรม</div>
          </div>

          <!-- Bottom card -->
          <div style="padding:14px 16px;margin:10px 12px 0;background:rgba(255,255,255,0.05);border-radius:14px;border:1px solid rgba(255,255,255,0.08);">
            <p style="font-size:11px;color:{ts};margin-bottom:8px;">ใกล้คุณตอนนี้ 🔥</p>
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:42px;height:42px;border-radius:12px;background:{p}25;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">🏃</div>
              <div style="flex:1;min-width:0;">
                <p style="font-size:13px;font-weight:700;color:{tp};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">กลุ่มวิ่งเช้า สวนลุม</p>
                <p style="font-size:11px;color:{ts};">0.3 กม. • 4 คนกำลังรอ</p>
              </div>
              <div style="background:{p};color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;cursor:pointer;">+</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Scroll indicator -->
  <div style="position:absolute;bottom:32px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:6px;opacity:0.5;">
    <span style="font-size:12px;color:{ts};">เลื่อนลง</span>
    <div style="width:1px;height:40px;background:linear-gradient({p},{p}00);"></div>
  </div>
</section>"""


def build_gps_section(d, c):
    p = d["primary_color"]
    s = d["secondary_color"]
    a = d["accent_color"]
    bg = d["background_color"]
    sf = d["surface_color"]
    tp = d["text_primary"]
    ts = d["text_secondary"]
    glow = hex_to_rgba(p, 0.20)

    large_pins = [
        {"emoji": "🏃", "label": "กลุ่มวิ่งเช้า", "members": "4 คน", "dist": "0.3 กม.", "x": "25%", "y": "35%", "delay": "0s"},
        {"emoji": "🚴", "label": "ปั่นจักรยาน", "members": "6 คน", "dist": "0.7 กม.", "x": "62%", "y": "22%", "delay": "0.2s"},
        {"emoji": "⚽", "label": "ฟุตบอล", "members": "8 คน", "dist": "1.1 กม.", "x": "15%", "y": "65%", "delay": "0.4s"},
        {"emoji": "🥊", "label": "มวยไทย", "members": "3 คน", "dist": "1.4 กม.", "x": "78%", "y": "60%", "delay": "0.6s"},
        {"emoji": "🏸", "label": "แบดมินตัน", "members": "2 คน", "dist": "1.9 กม.", "x": "48%", "y": "75%", "delay": "0.8s"},
    ]

    large_pins_html = ""
    for pin in large_pins:
        large_pins_html += f"""
        <div class="activity-pin" style="left:{pin['x']};top:{pin['y']};animation-delay:{pin['delay']};">
          <div class="pin-card" style="padding:8px 12px;min-width:110px;">
            <p style="font-weight:600;">{pin['label']}</p>
            <p style="color:{p};font-size:11px;">{pin['members']} · {pin['dist']}</p>
          </div>
          <div class="pin-emoji" style="width:44px;height:44px;font-size:22px;">{pin['emoji']}</div>
        </div>"""

    return f"""<section id="gps" style="padding:100px 24px;background:{bg};position:relative;overflow:hidden;">
  <div style="position:absolute;top:0;left:50%;transform:translateX(-50%);width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,{glow},transparent 70%);pointer-events:none;"></div>
  <div class="noise-layer"></div>

  <div style="max-width:1280px;margin:0 auto;position:relative;z-index:2;">
    <div style="text-align:center;margin-bottom:64px;" class="animate-on-scroll">
      <div class="section-label">📍 GPS Real-Time</div>
      <h2 style="font-size:clamp(2rem,4vw,3rem);font-weight:900;color:{tp};margin-bottom:16px;">{c['gps_section_headline']}</h2>
      <p style="font-size:17px;color:{ts};max-width:560px;margin:0 auto;line-height:1.8;">{c['gps_section_description']}</p>
    </div>

    <div class="gps-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;">
      <!-- Map (left) -->
      <div class="animate-on-scroll shadow-brand-lg" style="border-radius:20px;overflow:hidden;">
        <div class="mock-map" style="height:380px;position:relative;">
          <div class="map-grid"></div>
          <div class="map-road-h" style="top:30%;"></div>
          <div class="map-road-h" style="top:55%;height:3px;"></div>
          <div class="map-road-h" style="top:78%;"></div>
          <div class="map-road-v" style="left:30%;"></div>
          <div class="map-road-v" style="left:62%;width:3px;"></div>
          {large_pins_html}
          <!-- User location center -->
          <div class="user-location" style="left:45%;top:48%;">
            <div class="user-ring"></div>
            <div class="user-ring" style="animation-delay:0.7s;"></div>
            <div class="user-dot" style="width:18px;height:18px;"></div>
          </div>
          <!-- Top status bar -->
          <div style="position:absolute;top:12px;left:50%;transform:translateX(-50%);z-index:30;">
            <div id="gps-status" style="background:rgba(15,22,35,0.9);color:white;border:1px solid rgba(255,255,255,0.15);backdrop-filter:blur(8px);padding:8px 18px;border-radius:50px;font-size:13px;font-weight:600;white-space:nowrap;">
              🔍 ค้นหากิจกรรมใกล้คุณ...
            </div>
          </div>
          <!-- Range circle -->
          <div style="position:absolute;left:45%;top:48%;transform:translate(-50%,-50%);width:160px;height:160px;border-radius:50%;border:1.5px dashed {p}40;pointer-events:none;"></div>
          <div style="position:absolute;left:45%;top:48%;transform:translate(-50%,-50%);width:80px;height:80px;border-radius:50%;border:1px dashed {p}25;pointer-events:none;"></div>
        </div>
      </div>

      <!-- Feature list (right) -->
      <div style="display:flex;flex-direction:column;gap:24px;">
        {''.join(f"""
        <div class="animate-on-scroll delay-{i+1}" style="display:flex;gap:16px;align-items:flex-start;padding:20px;background:{sf};border-radius:{d['border_radius']};border:1px solid rgba(255,255,255,0.07);">
          <div style="width:48px;height:48px;border-radius:14px;background:{p}22;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;">{feat['icon']}</div>
          <div>
            <h3 style="font-size:16px;font-weight:700;color:{tp};margin-bottom:4px;">{feat['title']}</h3>
            <p style="font-size:14px;color:{ts};line-height:1.7;">{feat['description']}</p>
          </div>
        </div>""" for i, feat in enumerate(c.get('features', [])[:3]))}
      </div>
    </div>
  </div>
</section>"""


def build_features(d, c):
    p = d["primary_color"]
    bg = d["background_color"]
    sf = d["surface_color"]
    tp = d["text_primary"]
    ts = d["text_secondary"]
    glow = hex_to_rgba(d["secondary_color"], 0.15)

    features_html = ""
    for i, feat in enumerate(c.get("features", [])):
        delay = f"delay-{min(i+1, 5)}"
        features_html += f"""
      <div class="feature-card animate-on-scroll {delay}">
        <div style="width:56px;height:56px;border-radius:16px;background:{p}20;display:flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:18px;">{feat['icon']}</div>
        <h3 style="font-size:18px;font-weight:700;color:{tp};margin-bottom:10px;">{feat['title']}</h3>
        <p style="font-size:14px;color:{ts};line-height:1.8;">{feat['description']}</p>
      </div>"""

    return f"""<section id="features" style="padding:100px 24px;background:{sf};position:relative;overflow:hidden;">
  <div style="position:absolute;bottom:0;right:0;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,{glow},transparent 70%);pointer-events:none;"></div>
  <div class="noise-layer"></div>

  <div style="max-width:1280px;margin:0 auto;position:relative;z-index:2;">
    <div style="text-align:center;margin-bottom:64px;" class="animate-on-scroll">
      <div class="section-label">✨ ฟีเจอร์เด่น</div>
      <h2 style="font-size:clamp(2rem,4vw,3rem);font-weight:900;color:{tp};margin-bottom:16px;">ทุกอย่างที่คุณต้องการ<br>อยู่ในแอปเดียว</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px;">
      {features_html}
    </div>
  </div>
</section>"""


def build_sports_categories(d, c):
    p = d["primary_color"]
    a = d["accent_color"]
    bg = d["background_color"]
    tp = d["text_primary"]
    ts = d["text_secondary"]

    sports = c.get("sports_categories", ["วิ่ง", "ปั่นจักรยาน", "ฟุตบอล", "แบดมินตัน", "มวยไทย", "ยิม", "โยคะ", "เดินป่า"])
    chips_html = ""
    for i, sport in enumerate(sports):
        emoji = get_sport_emoji(sport)
        chips_html += f"""
      <div class="sport-chip animate-on-scroll delay-{min(i+1,5)}" tabindex="0">
        <span style="font-size:36px;">{emoji}</span>
        <span style="font-size:14px;font-weight:600;color:{tp};">{sport}</span>
      </div>"""

    return f"""<section id="sports" style="padding:80px 24px;background:{bg};">
  <div style="max-width:1280px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:48px;" class="animate-on-scroll">
      <div class="section-label">🎯 กีฬาที่รองรับ</div>
      <h2 style="font-size:clamp(1.8rem,3.5vw,2.8rem);font-weight:900;color:{tp};margin-bottom:12px;">ไม่ว่าจะชอบกีฬาอะไร<br>เราช่วยหาเพื่อนให้คุณได้</h2>
    </div>
    <div class="sports-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;">
      {chips_html}
    </div>
  </div>
</section>"""


def build_how_it_works(d, c):
    p = d["primary_color"]
    a = d["accent_color"]
    bg = d["background_color"]
    sf = d["surface_color"]
    tp = d["text_primary"]
    ts = d["text_secondary"]

    steps = c.get("how_it_works", [
        {"step": 1, "title": "สมัครใช้งาน", "description": "สมัครฟรีด้วย 3 ขั้นตอนง่ายๆ"},
        {"step": 2, "title": "เลือกกีฬาที่ชอบ", "description": "ระบุกีฬาและระดับฝีมือของคุณ"},
        {"step": 3, "title": "หาเพื่อนและเล่น", "description": "GPS ช่วยหาคนใกล้บ้านให้เลย"},
    ])
    step_emojis = ["📱", "🎯", "🏅"]
    steps_html = ""
    for i, step in enumerate(steps):
        emoji = step_emojis[i] if i < len(step_emojis) else "⭐"
        connector = ""
        if i < len(steps) - 1:
            connector = f"""<div style="display:flex;justify-content:center;align-items:center;padding:4px 0;">
              <div class="step-line" style="width:3px;height:48px;border-radius:2px;opacity:0.5;"></div>
            </div>"""
        steps_html += f"""
      <div class="animate-on-scroll delay-{i+1}">
        <div style="display:flex;gap:20px;align-items:flex-start;">
          <div style="display:flex;flex-direction:column;align-items:center;gap:0;flex-shrink:0;">
            <div style="width:56px;height:56px;border-radius:50%;background:{p};display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:0 4px 16px {hex_to_rgba(p, 0.35)};">{emoji}</div>
          </div>
          <div style="flex:1;padding-bottom:32px;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
              <span style="font-size:12px;font-weight:700;color:{p};text-transform:uppercase;letter-spacing:0.08em;">ขั้นตอนที่ {step['step']}</span>
            </div>
            <h3 style="font-size:20px;font-weight:800;color:{tp};margin-bottom:8px;">{step['title']}</h3>
            <p style="font-size:15px;color:{ts};line-height:1.8;">{step['description']}</p>
          </div>
        </div>
        {connector}
      </div>"""

    return f"""<section id="how-it-works" style="padding:100px 24px;background:{sf};">
  <div style="max-width:900px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:64px;" class="animate-on-scroll">
      <div class="section-label">🗺️ วิธีใช้งาน</div>
      <h2 style="font-size:clamp(2rem,4vw,3rem);font-weight:900;color:{tp};margin-bottom:16px;">เริ่มต้นง่ายๆ<br>ใน 3 ขั้นตอน</h2>
    </div>
    <div style="max-width:500px;margin:0 auto;">
      {steps_html}
    </div>
  </div>
</section>"""


def build_testimonials(d, c):
    p = d["primary_color"]
    a = d["accent_color"]
    bg = d["background_color"]
    sf = d["surface_color"]
    tp = d["text_primary"]
    ts = d["text_secondary"]

    testimonials = c.get("testimonials", [
        {"name": "สมชาย", "age": 28, "sport": "วิ่ง", "quote": "หาเพื่อนวิ่งได้ง่ายมาก แนะนำเลย!", "location": "สาทร"},
        {"name": "มินตรา", "age": 25, "sport": "โยคะ", "quote": "เจอกลุ่มโยคะใกล้บ้านในวันเดียว", "location": "ลาดพร้าว"},
        {"name": "เอกชัย", "age": 32, "sport": "ฟุตบอล", "quote": "ทีมฟุตบอลครบ 10 คนได้ภายใน 1 ชั่วโมง", "location": "รัชดา"},
    ])

    avatar_colors = [p, a, d["secondary_color"]]
    cards_html = ""
    for i, t in enumerate(testimonials):
        name = t.get("name", "ผู้ใช้")
        age = t.get("age", "")
        sport = t.get("sport", "")
        quote = t.get("quote", "")
        location = t.get("location", "กรุงเทพ")
        avatar_color = avatar_colors[i % len(avatar_colors)]
        initials = name[0] if name else "U"
        cards_html += f"""
      <div class="testimonial-card animate-on-scroll delay-{i+1}">
        <div style="position:relative;z-index:1;">
          <p style="font-size:16px;color:{tp};line-height:1.8;margin-bottom:24px;">"{quote}"</p>
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:44px;height:44px;border-radius:50%;background:{avatar_color};display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:white;flex-shrink:0;">{initials}</div>
            <div>
              <p style="font-size:14px;font-weight:700;color:{tp};">{name} อายุ {age}</p>
              <p style="font-size:13px;color:{ts};">นักกีฬา{sport} · {location}</p>
            </div>
            <div style="margin-left:auto;">
              <span style="font-size:14px;color:{p};">{'★' * 5}</span>
            </div>
          </div>
        </div>
      </div>"""

    return f"""<section id="testimonials" style="padding:100px 24px;background:{bg};">
  <div style="max-width:1280px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:64px;" class="animate-on-scroll">
      <div class="section-label">💬 รีวิวจากผู้ใช้จริง</div>
      <h2 style="font-size:clamp(2rem,4vw,3rem);font-weight:900;color:{tp};margin-bottom:16px;">คนที่ใช้แล้วพูดว่าอะไร</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;">
      {cards_html}
    </div>
  </div>
</section>"""


def build_ads_showcase(d, c, ads):
    p = d["primary_color"]
    a = d["accent_color"]
    bg = d["background_color"]
    sf = d["surface_color"]
    tp = d["text_primary"]
    ts = d["text_secondary"]
    brand = c["brand_name"]

    fb_ads = ads.get("facebook_ads", [])
    gd_ads = ads.get("google_display_ads", [])
    tt_hooks = ads.get("tiktok_hooks", [])

    def render_fb_ad(ad, idx):
        bg_colors = [
            f"linear-gradient(135deg,{p},{a})",
            f"linear-gradient(135deg,{d['secondary_color']},{p})",
            f"linear-gradient(135deg,{a},{d['secondary_color']})",
        ]
        sport_icons = ["🏃⚽🚴", "🥊🏸🧘", "🏋️⛰️🏊"]
        bg_grad = bg_colors[idx % len(bg_colors)]
        icons = sport_icons[idx % len(sport_icons)]
        return f"""
      <div class="fb-ad-frame">
        <div class="fb-ad-image" style="background:{bg_grad};">
          <div style="font-size:40px;position:relative;z-index:1;">{icons}</div>
          <div style="position:absolute;bottom:12px;left:12px;z-index:1;">
            <span style="background:rgba(0,0,0,0.6);color:white;padding:3px 10px;border-radius:20px;font-size:11px;">{brand}</span>
          </div>
        </div>
        <div style="padding:14px 16px;">
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
            <div style="width:28px;height:28px;border-radius:50%;background:{p};display:flex;align-items:center;justify-content:center;font-size:14px;">🏃</div>
            <span style="font-size:12px;font-weight:600;color:{tp};">{brand}</span>
            <span style="font-size:11px;color:{ts};margin-left:auto;">โฆษณา</span>
          </div>
          <p style="font-size:14px;color:{ts};line-height:1.7;margin-bottom:10px;">{ad.get('primary_text','')}</p>
          <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:10px;display:flex;justify-content:space-between;align-items:center;">
            <div>
              <p style="font-size:13px;font-weight:700;color:{tp};">{ad.get('headline','')}</p>
              <p style="font-size:12px;color:{ts};">{ad.get('description','')}</p>
            </div>
            <button class="btn-primary" style="padding:8px 16px;font-size:12px;white-space:nowrap;">{ad.get('cta_button','ดาวน์โหลด')}</button>
          </div>
        </div>
      </div>"""

    def render_gd_ad(ad, idx):
        bg_grad = f"linear-gradient(90deg,{p},{a})" if idx == 0 else f"linear-gradient(90deg,{d['secondary_color']},{p})"
        return f"""
      <div class="google-ad-frame">
        <div style="display:flex;align-items:center;gap:16px;padding:16px 20px;">
          <div style="width:60px;height:60px;border-radius:16px;background:{bg_grad};display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0;">🏃</div>
          <div style="flex:1;min-width:0;">
            <p style="font-size:15px;font-weight:700;color:{tp};margin-bottom:2px;">{ad.get('headline_1','')}</p>
            <p style="font-size:13px;color:{p};margin-bottom:4px;">{ad.get('headline_2','')}</p>
            <p style="font-size:12px;color:{ts};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{ad.get('description','')}</p>
          </div>
          <button class="btn-primary" style="padding:10px 18px;font-size:13px;white-space:nowrap;flex-shrink:0;">ดูเพิ่มเติม</button>
        </div>
      </div>"""

    def render_tt_hook(hook, idx):
        bg_colors = [f"{p}22", f"{a}22", f"{d['secondary_color']}22"]
        return f"""
      <div class="animate-on-scroll delay-{idx+1}" style="background:{d['surface_color']};border-radius:{d['border_radius']};padding:24px;border:1px solid rgba(255,255,255,0.07);">
        <div style="display:flex;gap:16px;align-items:flex-start;">
          <div class="tiktok-frame" style="width:100px;height:178px;flex-shrink:0;background:{bg_colors[idx%3]};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;">
            <span style="font-size:28px;">📱</span>
            <span style="font-size:10px;color:rgba(255,255,255,0.6);text-align:center;padding:0 8px;">TikTok</span>
          </div>
          <div style="flex:1;">
            <div style="background:{p}18;border-left:3px solid {p};padding:10px 12px;border-radius:0 8px 8px 0;margin-bottom:12px;">
              <p style="font-size:11px;color:{p};font-weight:700;margin-bottom:4px;">HOOK (3 วินาทีแรก)</p>
              <p style="font-size:14px;color:{tp};font-weight:600;line-height:1.5;">"{hook.get('hook_text','')}"</p>
            </div>
            <p style="font-size:13px;color:{ts};line-height:1.7;margin-bottom:10px;">{hook.get('script_outline','')}</p>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <span style="font-size:11px;padding:4px 10px;background:{p}18;color:{p};border-radius:50px;">🎵 {hook.get('audio_suggestion','')}</span>
            </div>
          </div>
        </div>
      </div>"""

    fb_html = "\n".join(render_fb_ad(ad, i) for i, ad in enumerate(fb_ads)) if fb_ads else f"<p style='color:{ts};text-align:center;padding:40px;'>ไม่มีข้อมูลโฆษณา</p>"
    gd_html = "\n".join(render_gd_ad(ad, i) for i, ad in enumerate(gd_ads)) if gd_ads else f"<p style='color:{ts};text-align:center;padding:40px;'>ไม่มีข้อมูลโฆษณา</p>"
    tt_html = "\n".join(render_tt_hook(hook, i) for i, hook in enumerate(tt_hooks)) if tt_hooks else f"<p style='color:{ts};text-align:center;padding:40px;'>ไม่มีข้อมูลโฆษณา</p>"

    return f"""<section id="ads" style="padding:100px 24px;background:{sf};">
  <div style="max-width:1280px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:48px;" class="animate-on-scroll">
      <div class="section-label">📣 แคมเปญโฆษณา</div>
      <h2 style="font-size:clamp(2rem,4vw,3rem);font-weight:900;color:{tp};margin-bottom:16px;">Creative โฆษณาที่ AI สร้างให้</h2>
      <p style="font-size:16px;color:{ts};">ตัวอย่างโฆษณาสำหรับทุกแพลตฟอร์ม พร้อม copy และ visual direction</p>
    </div>

    <!-- Tab buttons -->
    <div style="display:flex;gap:12px;justify-content:center;margin-bottom:40px;flex-wrap:wrap;">
      <button class="ad-tab active-tab" data-tab="0" onclick="switchTab(0)">📘 Facebook / Instagram</button>
      <button class="ad-tab" data-tab="1" onclick="switchTab(1)">🔍 Google Display</button>
      <button class="ad-tab" data-tab="2" onclick="switchTab(2)">🎵 TikTok</button>
    </div>

    <!-- Tab panels -->
    <div id="ad-panel-0" class="ad-panel" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:24px;">
      {fb_html}
    </div>
    <div id="ad-panel-1" class="ad-panel" style="display:none;display:flex;flex-direction:column;gap:20px;">
      {gd_html}
    </div>
    <div id="ad-panel-2" class="ad-panel" style="display:none;display:flex;flex-direction:column;gap:20px;">
      {tt_html}
    </div>
  </div>
</section>"""


def build_cta_section(d, c):
    p = d["primary_color"]
    a = d["accent_color"]
    tp = d["text_primary"]
    ts = d["text_secondary"]
    glow = hex_to_rgba(a, 0.4)

    return f"""<section id="cta" style="padding:100px 24px;position:relative;overflow:hidden;" class="cta-section">
  <div class="noise-layer"></div>
  <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,{glow},transparent 70%);pointer-events:none;"></div>

  <div style="max-width:700px;margin:0 auto;text-align:center;position:relative;z-index:2;" class="animate-on-scroll">
    <h2 style="font-size:clamp(2.2rem,5vw,3.5rem);font-weight:900;color:white;line-height:1.1;margin-bottom:20px;">{c['section_cta_headline']}</h2>
    <p style="font-size:18px;color:rgba(255,255,255,0.8);line-height:1.8;margin-bottom:40px;">{c['section_cta_text']}</p>
    <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;">
      <a href="#" style="display:inline-flex;align-items:center;gap:10px;padding:16px 36px;background:white;color:{p};border-radius:50px;font-family:'{d['heading_font']}',sans-serif;font-weight:800;font-size:16px;text-decoration:none;box-shadow:0 8px 32px rgba(0,0,0,0.2);transition:transform 0.2s cubic-bezier(0.34,1.56,0.64,1),opacity 0.2s;"
         onmouseover="this.style.transform='translateY(-3px) scale(1.03)'" onmouseout="this.style.transform=''"
         onfocus="this.style.outline='3px solid white'" onblur="this.style.outline='none'"
         onmousedown="this.style.transform='scale(0.97)'" onmouseup="this.style.transform='translateY(-3px)'">
        📱 {c['hero_cta_primary']}
      </a>
    </div>
  </div>
</section>"""


def build_footer(d, c):
    p = d["primary_color"]
    sf = d["surface_color"]
    tp = d["text_primary"]
    ts = d["text_secondary"]
    brand = c["brand_name"]
    brand_thai = c.get("brand_name_thai", "")

    return f"""<footer style="background:{sf};border-top:1px solid rgba(255,255,255,0.06);padding:60px 24px 32px;">
  <div style="max-width:1280px;margin:0 auto;">
    <div class="footer-grid" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:48px;margin-bottom:48px;">
      <!-- Brand -->
      <div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
          <span style="font-size:28px;">🏃</span>
          <div>
            <span style="font-family:'{d['heading_font']}',sans-serif;font-weight:900;font-size:20px;color:{tp};">{brand}</span>
            <p style="font-size:12px;color:{ts};">{brand_thai}</p>
          </div>
        </div>
        <p style="font-size:14px;color:{ts};line-height:1.8;max-width:280px;">{c['footer_tagline']}</p>
      </div>
      <!-- Links -->
      <div>
        <h4 style="font-size:14px;font-weight:700;color:{tp};margin-bottom:16px;text-transform:uppercase;letter-spacing:0.06em;">เกี่ยวกับ</h4>
        <div style="display:flex;flex-direction:column;gap:10px;">
          {''.join(f"<a href='#' style='color:{ts};font-size:14px;text-decoration:none;transition:color 0.2s;' onmouseover=\"this.style.color='{tp}'\" onmouseout=\"this.style.color='{ts}'\">{link}</a>" for link in ['เกี่ยวกับเรา', 'นโยบายความเป็นส่วนตัว', 'เงื่อนไขการใช้งาน', 'ติดต่อเรา'])}
        </div>
      </div>
      <!-- Social -->
      <div>
        <h4 style="font-size:14px;font-weight:700;color:{tp};margin-bottom:16px;text-transform:uppercase;letter-spacing:0.06em;">ติดตามเรา</h4>
        <div style="display:flex;gap:12px;">
          {''.join(f"<a href='#' style='width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;font-size:18px;text-decoration:none;transition:transform 0.2s,background 0.2s;' onmouseover=\"this.style.transform='translateY(-3px)';this.style.background='{p}25'\" onmouseout=\"this.style.transform='';this.style.background='rgba(255,255,255,0.06)'\">{icon}</a>" for icon in ['📘', '📸', '🎵', '🐦'])}
        </div>
      </div>
    </div>
    <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
      <p style="font-size:13px;color:{ts};">© 2025 {brand}. สงวนลิขสิทธิ์ทุกประการ</p>
      <p style="font-size:13px;color:{ts};display:flex;align-items:center;gap:6px;">ออกแบบด้วย <span style="color:#e25555;">♥</span> โดย AI Agents</p>
    </div>
  </div>
</footer>"""


def build_scripts(d):
    return """<script>
  // Tab switching for ads
  function switchTab(tabIndex) {
    const panels = document.querySelectorAll('.ad-panel');
    const tabs = document.querySelectorAll('.ad-tab');
    panels.forEach((p, i) => {
      if (i === tabIndex) {
        p.style.display = (tabIndex === 0) ? 'grid' : 'flex';
        p.style.flexDirection = 'column';
        p.style.gap = '20px';
      } else {
        p.style.display = 'none';
      }
    });
    tabs.forEach((t, i) => {
      if (i === tabIndex) {
        t.classList.add('active-tab');
      } else {
        t.classList.remove('active-tab');
      }
    });
  }

  // Geolocation
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function(pos) {
        const el = document.getElementById('gps-status');
        if (el) {
          el.textContent = '✓ พบกิจกรรม 5 รายการในรัศมี 2 กม.';
          el.style.borderColor = 'rgba(74,222,128,0.4)';
          el.style.color = '#4ade80';
        }
      },
      function(err) {
        const el = document.getElementById('gps-status');
        if (el) {
          el.textContent = '📍 เปิด GPS เพื่อดูกิจกรรมจริงในพื้นที่คุณ';
        }
      }
    );
  }

  // Scroll animations with IntersectionObserver
  const observer = new IntersectionObserver(
    function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.05 }
  );
  document.querySelectorAll('.animate-on-scroll').forEach(function(el) {
    observer.observe(el);
  });
  // Fallback: force-reveal all elements after 1.2s for static renders/screenshots
  setTimeout(function() {
    document.querySelectorAll('.animate-on-scroll').forEach(function(el) {
      el.classList.add('visible');
    });
  }, 1200);
</script>"""


def main():
    base = Path(__file__).parent.parent
    missing = []
    for fname in ["design_output.json", "content_output.json", "ads_output.json"]:
        if not (base / ".tmp" / fname).exists():
            missing.append(fname)
    if missing:
        print(f"[build_website] ERROR: Missing files: {missing}. Run all agents first.")
        sys.exit(1)

    d = json.loads((base / ".tmp" / "design_output.json").read_text(encoding="utf-8"))
    c = json.loads((base / ".tmp" / "content_output.json").read_text(encoding="utf-8"))
    ads = json.loads((base / ".tmp" / "ads_output.json").read_text(encoding="utf-8"))

    sections = [
        build_head(d, c),
        "<body>",
        build_nav(d, c),
        build_hero(d, c),
        build_gps_section(d, c),
        build_features(d, c),
        build_sports_categories(d, c),
        build_how_it_works(d, c),
        build_testimonials(d, c),
        build_ads_showcase(d, c, ads),
        build_cta_section(d, c),
        build_footer(d, c),
        build_scripts(d),
        "</body>",
        "</html>",
    ]

    html = "\n".join(sections)
    out_path = base / "index.html"
    out_path.write_text(html, encoding="utf-8")
    size_kb = len(html.encode("utf-8")) / 1024
    print(f"[build_website] Written {size_kb:.1f} KB to {out_path}")
    print(f"[build_website] Brand: {c.get('brand_name')} | Primary color: {d.get('primary_color')}")


if __name__ == "__main__":
    main()
