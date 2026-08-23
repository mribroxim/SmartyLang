#!/usr/bin/env python3
"""Generate SmartyLang President Tech Award pitch deck (.pptx).

Visual language mirrors DESIGN_SYSTEM.md / the live site:
  - Surfaces: white, zinc-50
  - Text: zinc-900 headings, slate-600 body, slate-400 muted
  - Accent: emerald (correct / product), zinc-900 CTAs
  - Type: Montserrat (display) + Inter (body) — falls back if missing
"""

from __future__ import annotations

from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.oxml.ns import nsmap
from pptx.oxml import parse_xml
from pptx.util import Emu, Inches, Pt

# ── Brand tokens (Tailwind zinc / slate / emerald) ───────────────────────────
ZINC_900 = RGBColor(0x18, 0x18, 0x1B)
ZINC_800 = RGBColor(0x27, 0x27, 0x2A)
ZINC_100 = RGBColor(0xF4, 0xF4, 0xF5)
ZINC_50 = RGBColor(0xFA, 0xFA, 0xFA)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
SLATE_600 = RGBColor(0x47, 0x55, 0x69)
SLATE_500 = RGBColor(0x64, 0x74, 0x8B)
SLATE_400 = RGBColor(0x94, 0xA3, 0xB8)
SLATE_200 = RGBColor(0xE2, 0xE8, 0xF0)
EMERALD_700 = RGBColor(0x04, 0x78, 0x57)
EMERALD_600 = RGBColor(0x05, 0x96, 0x69)
EMERALD_50 = RGBColor(0xEC, 0xFD, 0xF5)
EMERALD_200 = RGBColor(0xA7, 0xF3, 0xD0)
AMBER_600 = RGBColor(0xD9, 0x77, 0x06)
AMBER_50 = RGBColor(0xFF, 0xFB, 0xEB)
ROSE_600 = RGBColor(0xE1, 0x1D, 0x48)
ROSE_50 = RGBColor(0xFF, 0xF1, 0xF2)
INDIGO_600 = RGBColor(0x4F, 0x46, 0xE5)

FONT_DISPLAY = "Montserrat"
FONT_BODY = "Inter"

SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)

OUT = Path(__file__).resolve().parents[1] / "SmartyLang-President-Tech-Award-Pitch.pptx"


def _set_run(run, text, *, size=18, bold=False, color=ZINC_900, font=FONT_BODY, italic=False):
    run.text = text
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = color
    run.font.name = font


def _add_textbox(slide, left, top, width, height):
    return slide.shapes.add_textbox(left, top, width, height)


def _para(tf, text, *, size=18, bold=False, color=ZINC_900, font=FONT_BODY,
          align=PP_ALIGN.LEFT, space_before=0, space_after=6, italic=False):
    p = tf.paragraphs[0] if not tf.paragraphs[0].text and len(tf.paragraphs) == 1 and tf.paragraphs[0].runs == [] else tf.add_paragraph()
    # First empty paragraph reuse is fiddly — always use add after clear pattern
    return p  # placeholder; use write_para instead


def write_block(slide, left, top, width, height, lines, *, default_size=18):
    """lines: list of dicts {text, size, bold, color, font, align, space_after, italic}"""
    box = _add_textbox(slide, left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = line.get("align", PP_ALIGN.LEFT)
        p.space_before = Pt(line.get("space_before", 0))
        p.space_after = Pt(line.get("space_after", 6))
        run = p.add_run()
        _set_run(
            run,
            line["text"],
            size=line.get("size", default_size),
            bold=line.get("bold", False),
            color=line.get("color", ZINC_900),
            font=line.get("font", FONT_BODY),
            italic=line.get("italic", False),
        )
    return box


def add_rect(slide, left, top, width, height, fill, *, line=None):
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    if line is None:
        shape.line.fill.background()
    else:
        shape.line.color.rgb = line
        shape.line.width = Pt(1)
    return shape


def add_round_rect(slide, left, top, width, height, fill, *, line=None):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    # Slightly tighter radius
    try:
        shape.adjustments[0] = 0.1
    except Exception:
        pass
    if line is None:
        shape.line.fill.background()
    else:
        shape.line.color.rgb = line
        shape.line.width = Pt(1.25)
    return shape


def footer(slide, page: int, total: int = 14):
    # Top brand bar
    add_rect(slide, 0, 0, SLIDE_W, Inches(0.06), ZINC_900)
    # Bottom footer strip
    add_rect(slide, 0, Inches(7.15), SLIDE_W, Inches(0.35), ZINC_50)
    write_block(
        slide,
        Inches(0.55),
        Inches(7.18),
        Inches(8),
        Inches(0.28),
        [{
            "text": "SmartyLang  ·  smartylang.com  ·  President Tech Award",
            "size": 11,
            "color": SLATE_400,
            "bold": False,
        }],
    )
    write_block(
        slide,
        Inches(11.6),
        Inches(7.18),
        Inches(1.2),
        Inches(0.28),
        [{
            "text": f"{page} / {total}",
            "size": 11,
            "color": SLATE_400,
            "align": PP_ALIGN.RIGHT,
        }],
    )


def section_label(slide, text, left=Inches(0.7), top=Inches(0.35)):
    write_block(
        slide,
        left,
        top,
        Inches(6),
        Inches(0.3),
        [{
            "text": text.upper(),
            "size": 11,
            "bold": True,
            "color": EMERALD_700,
            "font": FONT_DISPLAY,
            "space_after": 0,
        }],
    )


def title_block(slide, title, subtitle=None, top=Inches(0.55)):
    lines = [{
        "text": title,
        "size": 36,
        "bold": True,
        "color": ZINC_900,
        "font": FONT_DISPLAY,
        "space_after": 8,
    }]
    if subtitle:
        lines.append({
            "text": subtitle,
            "size": 16,
            "color": SLATE_600,
            "space_after": 0,
        })
    write_block(slide, Inches(0.7), top, Inches(12), Inches(1.2), lines)


def bullet_list(slide, items, left, top, width, height, *, size=16, color=SLATE_600):
    lines = []
    for i, item in enumerate(items):
        lines.append({
            "text": f"●  {item}",
            "size": size,
            "color": color,
            "space_after": 10 if i < len(items) - 1 else 0,
        })
    write_block(slide, left, top, width, height, lines)


def card(slide, left, top, width, height, *, fill=WHITE, border=SLATE_200):
    return add_round_rect(slide, left, top, width, height, fill, line=border)


# ── Slides ───────────────────────────────────────────────────────────────────

def slide_01_title(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, WHITE)
    # Soft zinc wash on left
    add_rect(slide, 0, 0, Inches(0.18), SLIDE_H, ZINC_900)
    # Emerald accent pill
    add_round_rect(slide, Inches(0.7), Inches(1.9), Inches(2.4), Inches(0.38), EMERALD_50, line=EMERALD_200)
    write_block(
        slide,
        Inches(0.85),
        Inches(1.95),
        Inches(2.2),
        Inches(0.3),
        [{"text": "PRESIDENT TECH AWARD", "size": 10, "bold": True, "color": EMERALD_700, "font": FONT_DISPLAY}],
    )
    write_block(
        slide,
        Inches(0.7),
        Inches(2.5),
        Inches(11.5),
        Inches(1.4),
        [{
            "text": "SmartyLang",
            "size": 60,
            "bold": True,
            "color": ZINC_900,
            "font": FONT_DISPLAY,
            "space_after": 4,
        }],
    )
    write_block(
        slide,
        Inches(0.7),
        Inches(3.55),
        Inches(11),
        Inches(0.8),
        [{
            "text": "The language academy that listens while you speak.",
            "size": 24,
            "color": SLATE_600,
            "space_after": 12,
        }, {
            "text": "Real-time reading feedback  ·  29 languages  ·  Live product",
            "size": 16,
            "color": SLATE_400,
        }],
    )
    write_block(
        slide,
        Inches(0.7),
        Inches(5.5),
        Inches(10),
        Inches(0.8),
        [{
            "text": "smartylang.com",
            "size": 18,
            "bold": True,
            "color": ZINC_900,
            "font": FONT_DISPLAY,
            "space_after": 4,
        }, {
            "text": "Team name  ·  2026",
            "size": 14,
            "color": SLATE_400,
        }],
    )
    footer(slide, 1)


def slide_02_problem(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, WHITE)
    footer(slide, 2)
    section_label(slide, "The problem")
    title_block(
        slide,
        "Millions study a language for years —",
        "and still can’t speak it.",
        top=Inches(0.55),
    )
    items = [
        "Schools teach grammar → then test on paper",
        "Apps reward streaks, not speech",
        "One teacher, 30 students, 45 min ≈ ~90 seconds of speaking time each",
        "Feedback arrives days later — or never",
        "Speaking is the only skill you cannot learn silently",
    ]
    bullet_list(slide, items, Inches(0.7), Inches(2.45), Inches(11.5), Inches(2.8), size=20)

    # Callout
    card(slide, Inches(0.7), Inches(5.55), Inches(11.8), Inches(1.2), fill=EMERALD_50, border=EMERALD_200)
    write_block(
        slide,
        Inches(0.95),
        Inches(5.75),
        Inches(11.3),
        Inches(0.9),
        [{
            "text": "Not laziness — no one ever listened and corrected them in real time.",
            "size": 18,
            "bold": True,
            "color": EMERALD_700,
            "font": FONT_DISPLAY,
        }],
    )


def slide_03_market_fail(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, WHITE)
    footer(slide, 3)
    section_label(slide, "Why the market fails")
    title_block(slide, "Today’s options all leave a gap", top=Inches(0.55))

    cols = [
        ("Classroom", "Theory + exams", "Can’t listen to everyone"),
        ("Apps", "Gamified drills", "Rarely grades real speech"),
        ("Private tutor", "Real feedback", "$10–30/hr — doesn’t scale"),
        ("IELTS courses", "High-stakes prep", "Expensive; few speaking reps"),
    ]
    x = Inches(0.7)
    w = Inches(2.85)
    gap = Inches(0.25)
    for title, does, gap_text in cols:
        card(slide, x, Inches(2.3), w, Inches(3.6), fill=ZINC_50, border=SLATE_200)
        write_block(
            slide,
            x + Inches(0.2),
            Inches(2.5),
            w - Inches(0.35),
            Inches(3.2),
            [
                {"text": title, "size": 18, "bold": True, "font": FONT_DISPLAY, "color": ZINC_900, "space_after": 12},
                {"text": does, "size": 14, "color": SLATE_600, "space_after": 18},
                {"text": "GAP", "size": 11, "bold": True, "color": ROSE_600, "font": FONT_DISPLAY, "space_after": 6},
                {"text": gap_text, "size": 14, "bold": True, "color": ZINC_800},
            ],
        )
        x = x + w + gap

    write_block(
        slide,
        Inches(0.7),
        Inches(6.15),
        Inches(12),
        Inches(0.5),
        [{
            "text": "Insight: the bottleneck isn’t content — it’s immediate, personal speaking feedback at scale.",
            "size": 15,
            "italic": True,
            "color": SLATE_500,
        }],
    )


def slide_04_solution(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, WHITE)
    footer(slide, 4)
    section_label(slide, "Solution")
    title_block(
        slide,
        "SmartyLang listens while you read",
        "and corrects every word in real time.",
        top=Inches(0.55),
    )

    # Color legend cards
    legend = [
        (EMERALD_50, EMERALD_700, EMERALD_200, "Green", "Correct"),
        (AMBER_50, AMBER_600, RGBColor(0xFD, 0xE6, 0x8A), "Yellow", "Close — needs work"),
        (ROSE_50, ROSE_600, RGBColor(0xFE, 0xCD, 0xD3), "Red", "Wrong or skipped"),
    ]
    x = Inches(0.7)
    for bg, fg, border, name, desc in legend:
        card(slide, x, Inches(2.45), Inches(3.8), Inches(1.55), fill=bg, border=border)
        write_block(
            slide,
            x + Inches(0.25),
            Inches(2.7),
            Inches(3.3),
            Inches(1.2),
            [
                {"text": name, "size": 22, "bold": True, "font": FONT_DISPLAY, "color": fg, "space_after": 6},
                {"text": desc, "size": 15, "color": ZINC_800},
            ],
        )
        x += Inches(4.05)

    write_block(
        slide,
        Inches(0.7),
        Inches(4.35),
        Inches(12),
        Inches(2),
        [
            {"text": "No submit button. No waiting. Correction while your mouth is still moving.", "size": 18, "bold": True, "color": ZINC_900, "font": FONT_DISPLAY, "space_after": 14},
            {"text": "Then the same platform covers the full path: placement → lessons → vocab (SRS) → AI writing & speaking examiners → teacher & school seats.", "size": 16, "color": SLATE_600, "space_after": 14},
            {"text": "One-liner: we close the feedback loop from a week to half a second.", "size": 15, "italic": True, "color": EMERALD_700},
        ],
    )


def slide_05_product(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, WHITE)
    footer(slide, 5)
    section_label(slide, "Product")
    title_block(slide, "How the product works", top=Inches(0.55))

    steps = [
        ("01", "Place", "Placement → personal level (5 CEFR bands)"),
        ("02", "Read", "Read aloud → live per-word scoring"),
        ("03", "Practice", "4 skills · 9 exercise modes · 4k+ items"),
        ("04", "Examine", "AI examiner → IELTS-style 4 criteria"),
        ("05", "Scale", "Teachers & schools assign + track"),
    ]
    y = Inches(2.15)
    for num, label, desc in steps:
        add_round_rect(slide, Inches(0.7), y, Inches(0.7), Inches(0.55), ZINC_900)
        write_block(
            slide,
            Inches(0.78),
            y + Inches(0.1),
            Inches(0.55),
            Inches(0.4),
            [{"text": num, "size": 14, "bold": True, "color": WHITE, "font": FONT_DISPLAY, "align": PP_ALIGN.CENTER}],
        )
        write_block(
            slide,
            Inches(1.6),
            y + Inches(0.05),
            Inches(10.5),
            Inches(0.5),
            [
                {"text": f"{label}  —  {desc}", "size": 17, "color": ZINC_900, "space_after": 0},
            ],
        )
        y += Inches(0.72)

    write_block(
        slide,
        Inches(0.7),
        Inches(6.0),
        Inches(12),
        Inches(0.6),
        [{"text": "29 languages as subject and interface (incl. Uzbek)  ·  ATMOS local payments  ·  Language-specific speech alignment", "size": 14, "color": SLATE_500}],
    )


def slide_06_demo(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, WHITE)
    footer(slide, 6)
    section_label(slide, "Live demo")
    title_block(slide, "smartylang.com — watch the text, not me", top=Inches(0.55))

    steps = [
        "Open Reading practice → press the mic",
        "Read aloud — words light up live",
        "Mispronounce one word on purpose → it turns red",
        "Show pass summary (accuracy / weak words)",
        "Optional: AI writing band scores · switch UI language",
    ]
    bullet_list(slide, steps, Inches(0.7), Inches(2.3), Inches(7.5), Inches(3.5), size=18)

    card(slide, Inches(8.5), Inches(2.3), Inches(4.1), Inches(3.8), fill=ZINC_900)
    write_block(
        slide,
        Inches(8.75),
        Inches(2.6),
        Inches(3.6),
        Inches(3.3),
        [
            {"text": "DEMO RULES", "size": 12, "bold": True, "color": EMERALD_200, "font": FONT_DISPLAY, "space_after": 14},
            {"text": "Chrome + mic on", "size": 16, "bold": True, "color": WHITE, "space_after": 12},
            {"text": "Demo reading in English (strongest ASR)", "size": 14, "color": RGBColor(0xD4, 0xD4, 0xD8), "space_after": 12},
            {"text": "Keep a recorded backup video", "size": 14, "color": RGBColor(0xD4, 0xD4, 0xD8), "space_after": 12},
            {"text": "Say almost nothing — the red word sells it", "size": 14, "bold": True, "color": WHITE},
        ],
    )


def slide_07_market_size(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, WHITE)
    footer(slide, 7)
    section_label(slide, "Market research")
    title_block(slide, "Where we play", top=Inches(0.55))

    card(slide, Inches(0.7), Inches(2.2), Inches(5.8), Inches(4.2), fill=ZINC_50, border=SLATE_200)
    write_block(
        slide,
        Inches(0.95),
        Inches(2.45),
        Inches(5.3),
        Inches(3.8),
        [
            {"text": "GLOBAL", "size": 12, "bold": True, "color": EMERALD_700, "font": FONT_DISPLAY, "space_after": 10},
            {"text": "Language learning & EdTech is a multi‑tens-of-billions market — digital share rising fast.", "size": 16, "color": ZINC_900, "space_after": 14},
            {"text": "Drivers: remote work, migration, university English requirements, IELTS / TOEFL culture.", "size": 15, "color": SLATE_600, "space_after": 14},
            {"text": "Consumers already pay for apps and tutors — we sit between both.", "size": 15, "color": SLATE_600},
        ],
    )

    card(slide, Inches(6.8), Inches(2.2), Inches(5.8), Inches(4.2), fill=EMERALD_50, border=EMERALD_200)
    write_block(
        slide,
        Inches(7.05),
        Inches(2.45),
        Inches(5.3),
        Inches(3.8),
        [
            {"text": "BEACHHEAD — UZ / CENTRAL ASIA", "size": 12, "bold": True, "color": EMERALD_700, "font": FONT_DISPLAY, "space_after": 10},
            {"text": "Young population + strong English demand for jobs, study abroad, migration.", "size": 15, "color": ZINC_900, "space_after": 12},
            {"text": "IELTS prep is a large cash category for families.", "size": 15, "color": ZINC_900, "space_after": 12},
            {"text": "Language centers everywhere — speaking practice doesn’t scale inside them.", "size": 15, "color": ZINC_900, "space_after": 12},
            {"text": "ATMOS removes the foreign-card conversion blocker.", "size": 15, "bold": True, "color": EMERALD_700},
        ],
    )


def slide_08_customers(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, WHITE)
    footer(slide, 8)
    section_label(slide, "Customers & willingness to pay")
    title_block(slide, "Who buys — and why", top=Inches(0.55))

    buyers = [
        ("Serious learners", "IELTS / career", "Unlimited speaking + writing feedback"),
        ("Tutors", "5–30 students", "Assign + monitor without grading 40 recordings"),
        ("Schools / academies", "30+ seats", "Seats, staff roles, class analytics"),
    ]
    x = Inches(0.7)
    for title, who, job in buyers:
        card(slide, x, Inches(2.2), Inches(3.9), Inches(2.5), fill=WHITE, border=SLATE_200)
        write_block(
            slide,
            x + Inches(0.25),
            Inches(2.4),
            Inches(3.4),
            Inches(2.2),
            [
                {"text": title, "size": 18, "bold": True, "font": FONT_DISPLAY, "color": ZINC_900, "space_after": 6},
                {"text": who, "size": 13, "color": SLATE_400, "space_after": 12},
                {"text": job, "size": 14, "color": SLATE_600},
            ],
        )
        x += Inches(4.15)

    # Pricing row
    plans = [
        ("SmartyLang Max", "$12.99/mo", "1 lang · +$8.99/extra lang"),
        ("Teacher", "$65/mo", "5 seats · +$8.99/seat · langs $4.99×seats"),
        ("Organization", "$8.99/seat", "Min 20 · langs $4.99×seats"),
    ]
    x = Inches(0.7)
    for name, price, note in plans:
        add_round_rect(slide, x, Inches(5.0), Inches(3.9), Inches(1.4), ZINC_900)
        write_block(
            slide,
            x + Inches(0.25),
            Inches(5.2),
            Inches(3.4),
            Inches(1.1),
            [
                {"text": name, "size": 13, "bold": True, "color": SLATE_400, "font": FONT_DISPLAY, "space_after": 4},
                {"text": price, "size": 22, "bold": True, "color": WHITE, "font": FONT_DISPLAY, "space_after": 4},
                {"text": note, "size": 13, "color": RGBColor(0xA1, 0xA1, 0xAA)},
            ],
        )
        x += Inches(4.15)


def slide_09_competition(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, WHITE)
    footer(slide, 9)
    section_label(slide, "Competition")
    title_block(slide, "Where we win", top=Inches(0.55))

    headers = ["", "Apps", "Tutors", "SmartyLang"]
    rows = [
        ["Real-time word feedback", "Rare", "Yes, expensive", "Yes, unlimited"],
        ["UI in learner’s language", "Weak", "Human", "29 languages"],
        ["School seats + analytics", "No", "Spreadsheets", "Built-in"],
        ["Local payments (UZ)", "Often no", "Cash", "ATMOS"],
    ]

    # Header
    col_w = [Inches(3.6), Inches(2.5), Inches(2.8), Inches(3.2)]
    x0 = Inches(0.7)
    y = Inches(2.2)
    x = x0
    for i, h in enumerate(headers):
        bg = ZINC_900 if i == 3 else ZINC_50
        fg = WHITE if i == 3 else SLATE_500
        add_rect(slide, x, y, col_w[i], Inches(0.55), bg)
        write_block(
            slide,
            x + Inches(0.12),
            y + Inches(0.12),
            col_w[i] - Inches(0.2),
            Inches(0.4),
            [{"text": h, "size": 13, "bold": True, "color": fg, "font": FONT_DISPLAY}],
        )
        x += col_w[i]

    y = Inches(2.75)
    for ri, row in enumerate(rows):
        x = x0
        bg_alt = WHITE if ri % 2 == 0 else ZINC_50
        for i, cell in enumerate(row):
            bg = EMERALD_50 if i == 3 else bg_alt
            fg = EMERALD_700 if i == 3 else (ZINC_900 if i == 0 else SLATE_600)
            bold = i == 0 or i == 3
            add_rect(slide, x, y, col_w[i], Inches(0.7), bg, line=SLATE_200)
            write_block(
                slide,
                x + Inches(0.12),
                y + Inches(0.18),
                col_w[i] - Inches(0.2),
                Inches(0.45),
                [{"text": cell, "size": 13, "bold": bold, "color": fg}],
            )
            x += col_w[i]
        y += Inches(0.7)

    write_block(
        slide,
        Inches(0.7),
        Inches(5.8),
        Inches(12),
        Inches(0.8),
        [{"text": "Moat: not “AI magic” — product depth already shipped. Switching cost rises once a school’s roster lives here.", "size": 15, "italic": True, "color": SLATE_500}],
    )


def slide_10_gtm(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, WHITE)
    footer(slide, 10)
    section_label(slide, "Business model & GTM")
    title_block(slide, "How we grow", top=Inches(0.55))

    card(slide, Inches(0.7), Inches(2.2), Inches(5.8), Inches(4.2), fill=ZINC_50, border=SLATE_200)
    write_block(
        slide,
        Inches(0.95),
        Inches(2.45),
        Inches(5.3),
        Inches(3.8),
        [
            {"text": "REVENUE", "size": 12, "bold": True, "color": EMERALD_700, "font": FONT_DISPLAY, "space_after": 12},
            {"text": "●  B2C subscription — SmartyLang Max", "size": 16, "color": ZINC_900, "space_after": 10},
            {"text": "●  B2B seats — Teacher → Organization", "size": 16, "color": ZINC_900, "space_after": 10},
            {"text": "●  Upsell: more seats, staff, exam tracks", "size": 16, "color": ZINC_900, "space_after": 18},
            {"text": "1 center × 100 seats ≈ $899 / month recurring", "size": 15, "bold": True, "color": EMERALD_700},
        ],
    )

    card(slide, Inches(6.8), Inches(2.2), Inches(5.8), Inches(4.2), fill=WHITE, border=SLATE_200)
    write_block(
        slide,
        Inches(7.05),
        Inches(2.45),
        Inches(5.3),
        Inches(3.8),
        [
            {"text": "GO-TO-MARKET", "size": 12, "bold": True, "color": EMERALD_700, "font": FONT_DISPLAY, "space_after": 12},
            {"text": "1. Demo → pilot with 3–5 language centers", "size": 15, "color": ZINC_900, "space_after": 10},
            {"text": "2. Teachers as distribution (bring 5–30 students)", "size": 15, "color": ZINC_900, "space_after": 10},
            {"text": "3. IELTS-intent traffic for B2C", "size": 15, "color": ZINC_900, "space_after": 10},
            {"text": "4. Partnerships: schools, universities, prep brands", "size": 15, "color": ZINC_900},
        ],
    )


def slide_11_traction(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, WHITE)
    footer(slide, 11)
    section_label(slide, "Traction & status")
    title_block(slide, "Shipped — not a mockup", top=Inches(0.55))

    shipped = [
        "Live: smartylang.com / smartyenglish.uz",
        "Real-time reading feedback",
        "29 language packs · AI examiners · SRS · gamification",
        "Teacher / org / admin tooling · ATMOS payments",
        "Open source snapshot: github.com/mribroxim/SmartyLang",
    ]
    bullet_list(slide, shipped, Inches(0.7), Inches(2.2), Inches(12), Inches(2.5), size=17)

    write_block(
        slide,
        Inches(0.7),
        Inches(4.6),
        Inches(12),
        Inches(0.4),
        [{"text": "FILL IN BEFORE PRESENTING", "size": 12, "bold": True, "color": AMBER_600, "font": FONT_DISPLAY}],
    )
    metrics = [("Users / MAU", "___"), ("Paying", "___"), ("Pilot schools / LOIs", "___"), ("Waitlist", "___")]
    x = Inches(0.7)
    for label, val in metrics:
        card(slide, x, Inches(5.1), Inches(2.9), Inches(1.3), fill=AMBER_50, border=RGBColor(0xFD, 0xE6, 0x8A))
        write_block(
            slide,
            x + Inches(0.2),
            Inches(5.25),
            Inches(2.5),
            Inches(1.0),
            [
                {"text": label, "size": 12, "color": SLATE_500, "space_after": 4},
                {"text": val, "size": 26, "bold": True, "font": FONT_DISPLAY, "color": ZINC_900},
            ],
        )
        x += Inches(3.1)


def slide_12_team(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, WHITE)
    footer(slide, 12)
    section_label(slide, "Team")
    title_block(slide, "Who’s building SmartyLang", top=Inches(0.55))

    roles = [
        ("Name", "CEO / Product", "Why they win"),
        ("Name", "Engineering / AI", "Why they win"),
        ("Name", "Content / Pedagogy", "Why they win"),
        ("Name", "Growth / Partnerships", "Why they win"),
    ]
    x = Inches(0.7)
    for name, role, why in roles:
        card(slide, x, Inches(2.3), Inches(2.9), Inches(3.6), fill=ZINC_50, border=SLATE_200)
        # Avatar circle
        circ = slide.shapes.add_shape(
            MSO_SHAPE.OVAL, x + Inches(0.9), Inches(2.6), Inches(1.1), Inches(1.1)
        )
        circ.fill.solid()
        circ.fill.fore_color.rgb = ZINC_900
        circ.line.fill.background()
        write_block(
            slide,
            x + Inches(0.2),
            Inches(3.9),
            Inches(2.5),
            Inches(1.8),
            [
                {"text": name, "size": 16, "bold": True, "font": FONT_DISPLAY, "color": ZINC_900, "align": PP_ALIGN.CENTER, "space_after": 6},
                {"text": role, "size": 12, "color": EMERALD_700, "align": PP_ALIGN.CENTER, "space_after": 10},
                {"text": why, "size": 12, "color": SLATE_500, "align": PP_ALIGN.CENTER},
            ],
        )
        x += Inches(3.15)

    write_block(
        slide,
        Inches(0.7),
        Inches(6.2),
        Inches(12),
        Inches(0.4),
        [{"text": "Replace placeholders with real names, roles, and one-line credibility.", "size": 13, "italic": True, "color": SLATE_400}],
    )


def slide_13_roadmap(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, WHITE)
    footer(slide, 13)
    section_label(slide, "Roadmap & ask")
    title_block(slide, "Next 6–12 months", top=Inches(0.55))

    items = [
        "School LMS depth — assignments, gradebook, attendance",
        "10 pilot language centers in Uzbekistan",
        "Stronger ASR for Uzbek & other beta languages",
        "Mobile / offline lesson packs",
        "More exam tracks beyond IELTS",
    ]
    bullet_list(slide, items, Inches(0.7), Inches(2.2), Inches(7.2), Inches(3.2), size=17)

    card(slide, Inches(8.3), Inches(2.2), Inches(4.3), Inches(4.0), fill=ZINC_900)
    write_block(
        slide,
        Inches(8.55),
        Inches(2.5),
        Inches(3.8),
        Inches(3.5),
        [
            {"text": "THE ASK", "size": 12, "bold": True, "color": EMERALD_200, "font": FONT_DISPLAY, "space_after": 14},
            {"text": "Recognition + intros to schools / MoE / accelerators", "size": 16, "bold": True, "color": WHITE, "space_after": 16},
            {"text": "Or: 5 pilot schools this quarter", "size": 14, "color": RGBColor(0xD4, 0xD4, 0xD8), "space_after": 12},
            {"text": "Or: $___ for GTM + 2 hires", "size": 14, "color": RGBColor(0xD4, 0xD4, 0xD8), "space_after": 18},
            {"text": "Pick one. Clarity beats a vague ask.", "size": 13, "italic": True, "color": SLATE_400},
        ],
    )


def slide_14_close(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, WHITE)
    add_rect(slide, 0, 0, Inches(0.18), SLIDE_H, ZINC_900)
    footer(slide, 14)

    write_block(
        slide,
        Inches(0.7),
        Inches(2.0),
        Inches(12),
        Inches(1.2),
        [{
            "text": "SmartyLang",
            "size": 48,
            "bold": True,
            "font": FONT_DISPLAY,
            "color": ZINC_900,
            "space_after": 8,
        }],
    )
    write_block(
        slide,
        Inches(0.7),
        Inches(3.2),
        Inches(11.5),
        Inches(1.5),
        [
            {"text": "Every learner. Real speech. Instant feedback.", "size": 24, "color": SLATE_600, "space_after": 16},
            {"text": "Students don’t fail languages — feedback fails them.", "size": 18, "italic": True, "color": EMERALD_700, "space_after": 24},
            {"text": "smartylang.com", "size": 20, "bold": True, "font": FONT_DISPLAY, "color": ZINC_900, "space_after": 8},
            {"text": "Team  ·  contact  ·  github.com/mribroxim/SmartyLang", "size": 14, "color": SLATE_400},
        ],
    )


def fix_slide_02(prs):
    """Rebuild slide 2 cleanly — title was duplicated in first draft approach.
    Actually slide_02 already adds title_block then bullets; the subtitle param
    creates a second line which is fine. Leave as-is.
    """
    return


def main():
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H

    slide_01_title(prs)
    slide_02_problem(prs)
    slide_03_market_fail(prs)
    slide_04_solution(prs)
    slide_05_product(prs)
    slide_06_demo(prs)
    slide_07_market_size(prs)
    slide_08_customers(prs)
    slide_09_competition(prs)
    slide_10_gtm(prs)
    slide_11_traction(prs)
    slide_12_team(prs)
    slide_13_roadmap(prs)
    slide_14_close(prs)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    prs.save(str(OUT))
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
