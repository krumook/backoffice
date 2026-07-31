# -*- coding: utf-8 -*-
import os

OUT = os.path.dirname(os.path.abspath(__file__))

FONT_LINKS = '''<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Noto+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet">'''

FONT_STACK = "'Space Grotesk', 'Noto Sans Thai', -apple-system, \"Segoe UI\", Helvetica, Arial, sans-serif"

STUDENT = "Iris"
SUBJECT_TH = "คณิตศาสตร์ ม.3"
SUBJECT_EN = "Mathematics — Matthayom 3 (IPST)"
SUBJECT_TITLE = SUBJECT_TH + " &middot; " + SUBJECT_EN
RATE_STR = "฿275"

# n, code, thai name, english gloss, slug, book, chapter_no_in_book, subtopics[(code, thai)]
TOPICS = [
 (1,"B1-1","อสมการเชิงเส้นตัวแปรเดียว","Linear Inequality in One Variable","Linear_Inequality",1,1,[
   ("B1-1.1","แนะนำอสมการเชิงเส้นตัวแปรเดียว"),
   ("B1-1.2","คำตอบของอสมการเชิงเส้นตัวแปรเดียว"),
   ("B1-1.3","การแก้อสมการเชิงเส้นตัวแปรเดียว"),
   ("B1-1.4","โจทย์ปัญหาเกี่ยวกับอสมการเชิงเส้นตัวแปรเดียว"),
 ]),
 (2,"B1-2","การแยกตัวประกอบของพหุนามที่มีดีกรีสูงกว่าสอง","Factoring Polynomials (Degree > 2)","Factoring_Polynomials",1,2,[
   ("B1-2.1","การแยกตัวประกอบของพหุนามที่อยู่ในรูปผลบวกและผลต่างของกำลังสาม"),
   ("B1-2.2","การแยกตัวประกอบของพหุนามที่มีดีกรีสูงกว่าสาม"),
 ]),
 (3,"B1-3","สมการกำลังสองตัวแปรเดียว","Quadratic Equation in One Variable","Quadratic_Equation",1,3,[
   ("B1-3.1","แนะนำสมการกำลังสองตัวแปรเดียว"),
   ("B1-3.2","การแก้สมการกำลังสองตัวแปรเดียว"),
   ("B1-3.3","โจทย์ปัญหาเกี่ยวกับสมการกำลังสองตัวแปรเดียว"),
 ]),
 (4,"B1-4","ความคล้าย","Similarity","Similarity",1,4,[
   ("B1-4.1","รูปเรขาคณิตที่คล้ายกัน"),
   ("B1-4.2","รูปสามเหลี่ยมที่คล้ายกัน"),
   ("B1-4.3","โจทย์ปัญหาเกี่ยวกับรูปสามเหลี่ยมที่คล้ายกัน"),
 ]),
 (5,"B1-5","กราฟของฟังก์ชันกำลังสอง","Graph of Quadratic Function","Quadratic_Function_Graph",1,5,[
   ("B1-5.1","แนะนำฟังก์ชัน"),
   ("B1-5.2","กราฟของฟังก์ชันกำลังสอง"),
 ]),
 (6,"B1-6","สถิติ (3)","Statistics (3)","Statistics_3",1,6,[
   ("B1-6.1","แผนภาพกล่อง"),
   ("B1-6.2","การอ่านและแปลความหมายจากแผนภาพกล่อง"),
 ]),
 (7,"B2-1","ระบบสมการเชิงเส้นสองตัวแปร","System of Linear Equations (Two Variables)","Linear_Equation_System",2,1,[
   ("B2-1.1","แนะนำระบบสมการเชิงเส้นสองตัวแปร"),
   ("B2-1.2","การแก้ระบบสมการเชิงเส้นสองตัวแปร"),
   ("B2-1.3","การแก้โจทย์ปัญหาโดยใช้ระบบสมการเชิงเส้นสองตัวแปร"),
 ]),
 (8,"B2-2","วงกลม","Circles","Circles",2,2,[
   ("B2-2.1","มุมที่จุดศูนย์กลางและมุมในส่วนโค้งของวงกลม"),
   ("B2-2.2","คอร์ดของวงกลม"),
   ("B2-2.3","เส้นสัมผัสวงกลม"),
 ]),
 (9,"B2-3","พีระมิด กรวย และทรงกลม","Pyramid, Cone, and Sphere","Pyramid_Cone_Sphere",2,3,[
   ("B2-3.1","ปริมาตรและพื้นที่ผิวของพีระมิด"),
   ("B2-3.2","ปริมาตรและพื้นที่ผิวของกรวย"),
   ("B2-3.3","ปริมาตรและพื้นที่ผิวของทรงกลม"),
 ]),
 (10,"B2-4","ความน่าจะเป็น","Probability","Probability",2,4,[
   ("B2-4.1","โอกาสของเหตุการณ์"),
   ("B2-4.2","ความน่าจะเป็น"),
 ]),
 (11,"B2-5","อัตราส่วนตรีโกณมิติ","Trigonometric Ratios","Trig_Ratios",2,5,[
   ("B2-5.1","ความหมายของอัตราส่วนตรีโกณมิติ"),
   ("B2-5.2","อัตราส่วนตรีโกณมิติของมุมแหลม"),
   ("B2-5.3","การนำอัตราส่วนตรีโกณมิติไปใช้ในการแก้ปัญหา"),
 ]),
]

BOOK_LABEL = {1: "Book 1 &middot; เทอม 1 (เล่ม 1)", 2: "Book 2 &middot; เทอม 2 (เล่ม 2)"}

# Thai school 8-point grade scale (replaces IGCSE-style A*/A/B/below banding).
# key, low%, high%, Thai label, English label, main color, light (badge bg) color
GRADE_BANDS = [
    ("4",   80, 100, "4 (ดีเยี่ยม)",     "Excellent",     "#25935C", "#D5E2DB"),
    ("35",  75, 79,  "3.5 (ดีมาก)",     "Very Good",     "#259346", "#D5E2D9"),
    ("3",   70, 74,  "3 (ดี)",          "Good",          "#259328", "#D5E2D5"),
    ("25",  65, 69,  "2.5 (ค่อนข้างดี)", "Fairly Good",   "#499325", "#D9E2D5"),
    ("2",   60, 64,  "2 (พอใช้)",       "Fair",          "#7D7212", "#D9D6B4"),
    ("15",  55, 59,  "1.5 (พอใช้-ต่ำ)",  "Satisfactory",  "#B36B19", "#EEE6DD"),
    ("1",   50, 54,  "1 (ผ่าน)",        "Pass",          "#933B25", "#E2D7D5"),
    ("0",   0,  49,  "0 (ตก)",          "Fail",          "#932537", "#E2D5D7"),
]

def grade_for_pct(pct):
    """Return the GRADE_BANDS tuple matching a percentage score (0-100)."""
    for band in GRADE_BANDS:
        if band[1] <= pct <= band[2]:
            return band
    return GRADE_BANDS[-1]

def grade_css_vars():
    lines = []
    for (key, lo, hi, th, en, main, light) in GRADE_BANDS:
        lines.append("--grade-" + key + ": " + main + "; --grade-" + key + "-light: " + light + ";")
    return " ".join(lines)

def grade_card_rules(card_class_prefix, bar_selector_suffix=""):
    """CSS rules mapping e.g. '.ts-g4 { background: var(--grade-4-light); } .ts-g4 .ts-pct { color: var(--grade-4); } ...'"""
    out = []
    for (key, lo, hi, th, en, main, light) in GRADE_BANDS:
        cls = card_class_prefix + "g" + key
        out.append(
            "." + cls + " { background: var(--grade-" + key + "-light); } "
            "." + cls + " ." + bar_selector_suffix + "pct { color: var(--grade-" + key + "); } "
            "." + cls + " ." + bar_selector_suffix + "bar-fill { background: var(--grade-" + key + "); }"
        )
    return "\n  ".join(out)

# NOTE ON FILE NAMING: the app's real working-folder path on this user's machine is a deeply
# nested sandboxed path (AppData\Local\Packages\...\LocalCache\...\outputs\), ~235 characters
# before any filename is added. That leaves very little of Windows' 260-char MAX_PATH budget,
# so every file here uses a short, flat name with no subfolders (per file-naming-and-path-length.md) —
# descriptive names/headings still appear inside each page, only the filenames are short.
def topic_href(n, frm="root"):
    return "t" + str(n) + ".html"

def write(path, content):
    full = os.path.join(OUT, path)
    d = os.path.dirname(full)
    if d:
        os.makedirs(d, exist_ok=True)
    with open(full, "w", encoding="utf-8") as f:
        f.write(content)
    print("wrote", path, len(content), "chars")

HOME_HREF_FROM_ROOT = "home.html"
SCHEDULE_HREF_FROM_ROOT = "sched.html"
DASHBOARD_HREF_FROM_ROOT = "dash.html"
FEES_INDEX_HREF_FROM_ROOT = "fees.html"
FEES_MONTH_HREF_FROM_ROOT = "f0726.html"

HOME_HREF_FROM_SUB = HOME_HREF_FROM_ROOT
DASHBOARD_HREF_FROM_SUB = DASHBOARD_HREF_FROM_ROOT
FEES_INDEX_HREF_FROM_SUB = FEES_INDEX_HREF_FROM_ROOT

# ---------------------------------------------------------------------------
# DASHBOARD
# ---------------------------------------------------------------------------
def build_dashboard():
    css = """
  :root {
    --ink: #1f2a24; --muted: #5c6b63; --line: #dfe6e1; --bg: #fbfaf7; --card: #ffffff;
    --accent: #0f6e56; --accent-light: #e1f5ee;
    --loss: #993c1d; --loss-light: #faece7;
    --tip: #185fa5; --tip-light: #e6f1fb;
    --amber: #854f0b; --amber-light: #faeeda;
    --pink: #72243e; --pink-light: #fbeaf0;
    --purple: #3c3489; --purple-light: #eeedfe;
    """ + grade_css_vars() + """
    --weight: #1f2a24; --untested: #8b978f; --untested-light: #eef1ef;
  }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 40px 24px 64px; background: var(--bg); color: var(--ink);
    font-family: """ + FONT_STACK + """; line-height: 1.5; }
  .wrap { max-width: 1180px; margin: 0 auto; }
  header { padding-bottom: 20px; border-bottom: 2px solid var(--ink); margin-bottom: 20px; }
  header h1 { margin: 0 0 6px; font-size: 22px; font-weight: 600; }
  header .meta { color: var(--muted); font-size: 14px; }
  .back-link { display: inline-block; font-size: 13px; font-weight: 600; color: var(--tip); text-decoration: none; background: var(--tip-light); padding: 7px 14px; border-radius: 20px; margin-bottom: 18px; }
  .back-link:hover { background: var(--tip); color: #fff; }

  .legend-box { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 14px 18px; margin-bottom: 22px; font-size: 13px; color: var(--muted); }
  .legend-box b { color: var(--ink); }

  .section-label { font-size: 13px; font-weight: 600; color: var(--muted); margin: 0 0 10px; text-transform: uppercase; letter-spacing: 0.04em; }

  .topic-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 10px; }
  .ts-card { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 14px 16px; display: block; text-decoration: none; color: inherit; cursor: pointer; transition: box-shadow 0.15s ease, transform 0.15s ease; }
  .ts-card:hover { box-shadow: 0 3px 14px rgba(31,42,36,0.14); transform: translateY(-2px); }
  .ts-card .ts-name { font-size: 13.5px; font-weight: 700; color: var(--ink); margin-bottom: 9px; text-transform: uppercase; }
  .ts-card .ts-name .en { display: block; font-size: 10.5px; font-weight: 500; color: var(--muted); text-transform: none; margin-top: 2px; }
  .ts-row { display: flex; align-items: baseline; justify-content: space-between; }
  .ts-row .ts-label { font-size: 10.5px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.03em; }
  .ts-card .ts-pct { font-size: 20px; font-weight: 700; }
  .ts-card .ts-frac { font-size: 12px; color: var(--muted); margin-left: 6px; }
  .ts-bar { height: 5px; border-radius: 3px; background: #fff; margin-top: 4px; margin-bottom: 12px; overflow: hidden; }
  .ts-bar-fill { height: 100%; border-radius: 3px; }
  """ + grade_card_rules("ts-", "ts-") + """
  .ts-untested { background: var(--untested-light); } .ts-untested .ts-pct { color: var(--untested); } .ts-untested .ts-bar-fill { background: var(--untested); }

  .ts-weight-row { margin-top: 2px; }
  .ts-card .ts-wpct { font-size: 14px; font-weight: 700; color: var(--weight); }
  .ts-card .ts-wfrac { font-size: 11.5px; color: var(--muted); margin-left: 6px; }
  .ts-wbar { margin-bottom: 0; }
  .ts-wbar .ts-bar-fill.ts-wbar-fill { background: var(--weight) !important; }

  .overall-line { font-size: 12.5px; color: var(--muted); margin: 4px 0 0; }
  .topic-box .topic-summary { margin-bottom: 14px; }
  .overall-line b { color: var(--ink); }

  .band-legend { display: flex; justify-content: center; gap: 18px; font-size: 12px; color: var(--muted); flex-wrap: wrap; align-items: center; margin: 0 0 30px; }
  .band-dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 5px; vertical-align: middle; }
  """ + " ".join(".dot-g" + key + " { background: var(--grade-" + key + "); }" for (key,lo,hi,th,en,main,light) in GRADE_BANDS) + """
  .dot-untested { background: var(--untested); }

  .cat { display: inline-block; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; white-space: nowrap; }
  .cat-slip { background: var(--amber-light); color: var(--amber); }
  .cat-miscon { background: var(--pink-light); color: var(--pink); }
  .cat-blank { background: var(--purple-light); color: var(--purple); }

  .mistake-table { width: 100%; border-collapse: collapse; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; margin-top: 4px; }
  .mistake-table th { background: var(--ink); padding: 10px 14px; text-align: left; }
  .mistake-table td { padding: 9px 14px; font-size: 13px; color: var(--ink); border-top: 1px solid var(--line); }
  .mistake-table tr.placeholder td { color: var(--muted); font-style: italic; text-align: center; padding: 20px 14px; }

  .details-link { display: inline-block; background: var(--ink); color: #fff; text-decoration: none; font-size: 13px; font-weight: 600; padding: 10px 18px; border-radius: 8px; margin-bottom: 30px; }
  .details-link:hover { background: var(--accent); }

  .note { background: var(--accent-light); border: 1px solid var(--line); border-radius: 10px; padding: 14px 18px; font-size: 13px; color: var(--accent); margin-bottom: 28px; }

  footer { margin-top: 30px; font-size: 12px; color: var(--muted); text-align: center; }
"""

    topic_cards_by_book = {1: [], 2: []}
    for (n, code, th, en, slug, book, ch, subs) in TOPICS:
        card = (
            '    <a href="' + topic_href(n) + '" class="ts-card ts-untested">\n'
            '      <div class="ts-name">' + str(n) + '&nbsp;&middot;&nbsp;' + th + '<span class="en">' + en + '</span></div>\n'
            '      <div class="ts-row"><span class="ts-label">Score</span><span><span class="ts-pct">&mdash;</span><span class="ts-frac">not yet tested</span></span></div>\n'
            '      <div class="ts-bar"><div class="ts-bar-fill" style="width:0%;"></div></div>\n'
            '      <div class="ts-row ts-weight-row"><span class="ts-label">Weight in papers</span><span><span class="ts-wpct">&mdash;</span><span class="ts-wfrac">0/0</span></span></div>\n'
            '      <div class="ts-bar ts-wbar"><div class="ts-bar-fill ts-wbar-fill" style="width:0%;"></div></div>\n'
            '    </a>\n'
        )
        topic_cards_by_book[book].append(card)

    book_sections = ""
    for book in (1, 2):
        book_sections += (
            '  <div class="legend-box topic-box">\n'
            '  <div class="section-label">' + BOOK_LABEL[book] + ' &middot; coverage by topic &middot; click a card for full detail</div>\n'
            '  <div class="topic-summary">\n' + "".join(topic_cards_by_book[book]) + '  </div>\n'
            '  </div>\n'
        )

    html = """<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<title>""" + STUDENT + """ &mdash; """ + SUBJECT_TH + """ Syllabus Coverage Tracker</title>
""" + FONT_LINKS + """
<style>""" + css + """</style>
</head>
<body>
<div class="wrap">

  <a class="back-link" href=\"""" + HOME_HREF_FROM_ROOT + """\">&larr; Back to home</a>

  <header>
    <h1>""" + STUDENT + """ &mdash; """ + SUBJECT_TH + """ syllabus coverage tracker</h1>
    <div class="meta">""" + SUBJECT_TITLE + """ &middot; built from every past test marked so far &middot; updated as new tests are added</div>
  </header>

  <div class="legend-box">
    <div class="section-label" style="margin-bottom: 6px;">Tests / past papers covered so far</div>
    <div>No tests marked yet &mdash; grade Iris&rsquo;s first quiz or exam and I&rsquo;ll populate this list with a link and score band for each one.</div>
  </div>

""" + book_sections + """
  <div class="overall-line">Overall across all 0 tests marked: <b>&mdash; (not yet tested)</b> &mdash; will be based on every question tested so far, grouped by book and chapter, once the first test is graded.</div>

  <div class="band-legend">
""" + "".join(
        '    <div><span class="band-dot dot-g' + key + '"></span>' + th + ' &middot; ' + str(lo) + ('&ndash;' + str(hi) if lo != hi else '') + '</div>\n'
        for (key, lo, hi, th, en, main, light) in GRADE_BANDS
    ) + """    <div><span class="band-dot dot-untested"></span>Not yet tested</div>
  </div>

  <div class="legend-box">
    <div class="section-label" style="margin-bottom: 12px;">Where mistakes are concentrated across all topics</div>
    <table class="mistake-table">
      <thead>
        <tr>
          <th><span class="cat cat-slip">Careless slip</span></th>
          <th><span class="cat cat-miscon">Misconception</span></th>
          <th><span class="cat cat-blank">Left blank</span></th>
        </tr>
      </thead>
      <tbody>
        <tr class="placeholder"><td colspan="3">No tests marked yet &mdash; this table fills in automatically once questions have been graded.</td></tr>
      </tbody>
    </table>
  </div>

  <a class="details-link" href=\"""" + topic_href(1) + """\">Open full syllabus detail (Topic 1) &rarr;</a>

  <div class="note">Add a new test: append it to the &ldquo;tests covered&rdquo; list above with its own link and score, then open the relevant topic page(s) and add a row (or extend an existing row) for every question from that test, and recalculate the Score line there and the section summary here. Every question from a marked test should appear somewhere in the tracker.</div>

  <footer>""" + SUBJECT_TITLE + """ &middot; topic codes reference the current textbook&rsquo;s chapter/section numbers (Book &middot; Chapter.Section) &middot; every question from all marked tests is accounted for &middot; update after each new test</footer>

</div>
</body>
</html>
"""
    write(DASHBOARD_HREF_FROM_ROOT, html)

# ---------------------------------------------------------------------------
# TOPIC PAGES
# ---------------------------------------------------------------------------
def build_topic_pages():
    css = """
  :root {
    --ink: #1f2a24; --muted: #5c6b63; --line: #dfe6e1; --bg: #fbfaf7; --card: #ffffff;
    --accent: #0f6e56; --accent-light: #e1f5ee;
    --loss: #993c1d; --loss-light: #faece7;
    --tip: #185fa5; --tip-light: #e6f1fb;
    --amber: #854f0b; --amber-light: #faeeda;
    --pink: #72243e; --pink-light: #fbeaf0;
    --purple: #3c3489; --purple-light: #eeedfe;
    """ + grade_css_vars() + """
    --untested: #8b978f;
  }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 40px 24px 64px; background: var(--bg); color: var(--ink);
    font-family: """ + FONT_STACK + """; line-height: 1.5; }
  .wrap { max-width: 1180px; margin: 0 auto; }
  header { padding-bottom: 20px; border-bottom: 2px solid var(--ink); margin-bottom: 20px; }
  header h1 { margin: 0 0 6px; font-size: 21px; font-weight: 600; }
  header .en-name { display: block; font-size: 13px; font-weight: 500; color: var(--muted); margin-top: 3px; }
  header .meta { color: var(--muted); font-size: 14px; }

  .back-link { display: inline-block; font-size: 13px; font-weight: 600; color: var(--tip); text-decoration: none; background: var(--tip-light); padding: 7px 14px; border-radius: 20px; margin-bottom: 18px; }
  .back-link:hover { background: var(--tip); color: #fff; }

  h2.section-title { font-size: 16px; font-weight: 600; margin: 30px 0 14px; padding-top: 6px; color: var(--ink); scroll-margin-top: 16px; }
  h2.section-title:first-of-type { margin-top: 0; }
  h2.section-title .count { font-weight: 400; color: var(--muted); font-size: 13px; }

  table { width: 100%; border-collapse: collapse; background: var(--card); border-radius: 12px; overflow: hidden; border: 1px solid var(--line); font-size: 13px; table-layout: fixed; margin-bottom: 8px; }
  thead th { background: var(--ink); color: #fff; text-align: left; padding: 10px 12px; font-weight: 600; font-size: 12px; letter-spacing: 0.02em; }
  tbody td { padding: 10px 12px; border-top: 1px solid var(--line); vertical-align: top; }
  tbody tr:nth-child(even) { background: #fafaf8; }
  td.code { font-weight: 600; width: 88px; color: var(--accent); word-break: break-word; line-height: 1.3; }
  td.topic { width: 260px; }
  td.topic .en { display: block; font-size: 11px; color: var(--muted); margin-top: 2px; font-weight: 400; }
  td.papers { width: 110px; }
  td.papers span.paper-tag { display: block; font-size: 11px; color: var(--muted); margin-bottom: 3px; white-space: nowrap; }
  td.comment { color: var(--muted); width: auto; }
  td.improve { color: var(--ink); width: 200px; }

  .cat { display: inline-block; font-size: 11px; font-weight: 600; padding: 2px 9px; border-radius: 20px; margin-right: 6px; white-space: nowrap; }
  .cat-correct { background: var(--accent-light); color: var(--accent); }
  .cat-slip { background: var(--amber-light); color: var(--amber); }
  .cat-hw { background: var(--loss-light); color: var(--loss); }
  .cat-miscon { background: var(--pink-light); color: var(--pink); }
  .cat-blank { background: var(--purple-light); color: var(--purple); }

  .score { font-weight: 700; margin-bottom: 6px; font-size: 12.5px; }
  """ + " ".join(".sc-g" + key + " { color: var(--grade-" + key + "); }" for (key,lo,hi,th,en,main,light) in GRADE_BANDS) + """
  .sc-untested { color: var(--untested); }

  tr.untested td { color: var(--muted); }
  tr.untested td.code { color: var(--untested); }
  tr.untested td.dash { text-align: center; }

  .legend { display: flex; gap: 14px; font-size: 11.5px; color: var(--muted); flex-wrap: wrap; align-items: center; margin: 10px 0 30px; }
  .legend .grade-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 4px; vertical-align: middle; }

  footer { margin-top: 30px; font-size: 12px; color: var(--muted); text-align: center; }

  .topic-nav { display:flex; justify-content:space-between; align-items:center; margin: 20px 0; font-size: 13px; }
  .topic-nav a { color: var(--tip); text-decoration:none; font-weight:600; }
  .topic-nav a:hover { text-decoration:underline; }
  .topic-nav .spacer { color: var(--muted); }
  .score-badge { display:inline-block; font-size:20px; font-weight:700; margin-left:14px; vertical-align:middle; color: var(--untested); }
  """ + " ".join(".score-badge.sb-g" + key + " { color: var(--grade-" + key + "); }" for (key,lo,hi,th,en,main,light) in GRADE_BANDS) + """
  .score-frac { font-size:13px; color: var(--muted); margin-left:6px; }

  .improve-summary { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 16px 18px; margin: 18px 0 6px; }
  .improve-title { font-size: 13px; font-weight: 700; color: var(--ink); text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 12px; }
  .improve-row { font-size: 13px; color: var(--muted); margin-bottom: 10px; line-height: 1.5; }
  .improve-row:last-child { margin-bottom: 0; }
  .improve-row b { color: var(--ink); }
  .improve-row .cat { margin-right: 8px; }
"""

    for (n, code, th, en, slug, book, ch, subs) in TOPICS:
        rows = ""
        for (subcode, subth) in subs:
            rows += (
                '      <tr class="untested"><td class="code">' + subcode + '</td>'
                '<td class="topic">' + subth + '</td>'
                '<td class="papers dash">&mdash;</td>'
                '<td class="comment dash">&mdash;</td>'
                '<td class="improve dash">&mdash;</td></tr>\n'
            )

        prev_html = '<span class="spacer"></span>'
        if n > 1:
            pt = TOPICS[n-2]
            prev_html = '<a href="' + topic_href(n-1, "topic") + '">&larr; ' + str(n-1) + '. ' + pt[2] + '</a>'
        next_html = '<span class="spacer"></span>'
        if n < len(TOPICS):
            nt = TOPICS[n]
            next_html = '<a href="' + topic_href(n+1, "topic") + '">' + str(n+1) + '. ' + nt[2] + ' &rarr;</a>'

        html = """<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<title>""" + STUDENT + """ &mdash; """ + str(n) + """. """ + th + """ &mdash; Topic Detail</title>
""" + FONT_LINKS + """
<style>""" + css + """</style>
</head>
<body>
<div class="wrap">

  <header>
    <h1>""" + str(n) + """&nbsp;&middot;&nbsp;""" + th + """ <span class="score-badge">&mdash;</span><span class="score-frac">not yet tested</span>
      <span class="en-name">""" + en + """</span>
    </h1>
    <div class="meta">""" + BOOK_LABEL[book] + """ &middot; &#3610;&#3607;&#3607;&#3637;&#3656; """ + str(ch) + """ &middot; every question from every marked test so far</div>
  </header>

  <a class="back-link" href=\"""" + DASHBOARD_HREF_FROM_SUB + """\">&larr; Back to dashboard</a>

  <div class="legend">
    <div><span class="cat cat-correct">Correct</span></div>
    <div><span class="cat cat-slip">Careless slip</span></div>
    <div><span class="cat cat-hw">Handwriting</span></div>
    <div><span class="cat cat-miscon">Misconception</span></div>
    <div><span class="cat cat-blank">Left blank</span></div>
    <div>&mdash; Not yet tested in a marked test</div>
  </div>
  <div class="legend">
""" + "".join(
        '    <div><span class="grade-dot" style="background:' + main + ';"></span>' + th + '</div>\n'
        for (key, lo, hi, th, en, main, light) in GRADE_BANDS
    ) + """  </div>

  <h2 class="section-title" id="sec-""" + str(n) + """">""" + str(n) + """&nbsp;&middot;&nbsp;""" + th + """</h2>
  <table>
    <colgroup><col style="width:88px;"><col style="width:260px;"><col style="width:110px;"><col><col style="width:200px;"></colgroup>
    <thead><tr><th>Code</th><th>Topic</th><th>Test(s)</th><th>Comment (per test)</th><th>How to improve</th></tr></thead>
    <tbody>
""" + rows + """    </tbody>
  </table>

  <div class="improve-summary">
    <div class="improve-title">Areas to improve in this topic</div>
    <div class="improve-row"><span class="cat cat-slip">Careless slip</span>No tests marked yet in this topic &mdash; nothing to report.</div>
    <div class="improve-row"><span class="cat cat-miscon">Misconception</span>No tests marked yet in this topic &mdash; nothing to report.</div>
    <div class="improve-row"><span class="cat cat-blank">Left blank</span>No tests marked yet in this topic &mdash; nothing to report.</div>
  </div>

  <div class="topic-nav">
    """ + prev_html + """
    <a href=\"""" + DASHBOARD_HREF_FROM_SUB + """\">Dashboard</a>
    """ + next_html + """
  </div>

  <footer>""" + SUBJECT_TITLE + """ &middot; topic codes reference the textbook&rsquo;s chapter/section numbers &middot; update after each new test</footer>

</div>
</body>
</html>
"""
        write(topic_href(n), html)

# ---------------------------------------------------------------------------
# HOME HUB
# ---------------------------------------------------------------------------
def build_hub():
    css = """
  :root {
    --ink: #1f2a24; --muted: #5c6b63; --line: #dfe6e1; --bg: #fbfaf7; --card: #ffffff;
    --accent: #0f6e56; --accent-light: #e1f5ee;
    --tip: #185fa5; --tip-light: #e6f1fb;
    --amber: #854f0b; --amber-light: #faeeda;
    --grade-a: #1B88A7; --grade-a-light: #E2F3F8;
  }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 56px 24px 64px; background: var(--bg); color: var(--ink);
    font-family: """ + FONT_STACK + """; line-height: 1.5; }
  .wrap { max-width: 900px; margin: 0 auto; }
  header { text-align: center; margin-bottom: 44px; }
  .eyebrow { font-size: 13px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; }
  header h1 { margin: 0 0 10px; font-size: 32px; font-weight: 700; }
  header .meta { color: var(--muted); font-size: 14.5px; }

  .hub-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
  .hub-card {
    background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 26px 22px;
    text-decoration: none; color: inherit; display: flex; flex-direction: column; align-items: flex-start;
    gap: 10px; transition: box-shadow 0.15s ease, transform 0.15s ease; border-top: 4px solid var(--hub-color, var(--accent));
  }
  .hub-card:hover { box-shadow: 0 6px 22px rgba(31,42,36,0.14); transform: translateY(-3px); }
  .hub-icon { font-size: 26px; line-height: 1; }
  .hub-card h2 { margin: 0; font-size: 16.5px; font-weight: 700; }
  .hub-card p { margin: 0; font-size: 13px; color: var(--muted); line-height: 1.5; }
  .hub-goto { margin-top: auto; padding-top: 10px; font-size: 12.5px; font-weight: 600; color: var(--hub-color, var(--accent)); }

  .hub-card.c1 { --hub-color: var(--tip); }
  .hub-card.c2 { --hub-color: var(--amber); }
  .hub-card.c3 { --hub-color: var(--grade-a); }

  footer { margin-top: 46px; font-size: 12px; color: var(--muted); text-align: center; }

  @media (max-width: 720px) { .hub-grid { grid-template-columns: 1fr; } }
"""
    html = """<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<title>""" + STUDENT + """ &mdash; Home</title>
""" + FONT_LINKS + """
<style>""" + css + """</style>
</head>
<body>
<div class="wrap">

  <header>
    <div class="eyebrow">""" + STUDENT + """ &middot; Tutoring hub</div>
    <h1>What would you like to check?</h1>
    <div class="meta">Class schedule, session fees, and """ + SUBJECT_TH + """ syllabus progress &mdash; all in one place.</div>
  </header>

  <div class="hub-grid">
    <a class="hub-card c1" href=\"""" + SCHEDULE_HREF_FROM_ROOT + """\">
      <div class="hub-icon">&#128197;</div>
      <h2>View class schedule</h2>
      <p>Recurring weekly session times and how long the current pattern holds.</p>
      <div class="hub-goto">Open schedule &rarr;</div>
    </a>

    <a class="hub-card c2" href=\"""" + FEES_INDEX_HREF_FROM_ROOT + """\">
      <div class="hub-icon">&#129534;</div>
      <h2>Monthly fees</h2>
      <p>Session log and running total by month, at """ + RATE_STR + """/hour.</p>
      <div class="hub-goto">Open fees &rarr;</div>
    </a>

    <a class="hub-card c3" href=\"""" + DASHBOARD_HREF_FROM_ROOT + """\">
      <div class="hub-icon">&#128208;</div>
      <h2>""" + SUBJECT_TH + """ progress</h2>
      <p>Syllabus coverage by topic, weight in tests, and where mistakes concentrate.</p>
      <div class="hub-goto">Open progress tracker &rarr;</div>
    </a>
  </div>

  <footer>""" + STUDENT + """ &middot; Matthayom 3 &middot; updated as classes happen</footer>

</div>
</body>
</html>
"""
    write(HOME_HREF_FROM_ROOT, html)

# ---------------------------------------------------------------------------
# CLASS SCHEDULE
# ---------------------------------------------------------------------------
def build_schedule():
    css = """
  :root {
    --ink: #1f2a24; --muted: #5c6b63; --line: #dfe6e1; --bg: #fbfaf7; --card: #ffffff;
    --accent: #0f6e56; --accent-light: #e1f5ee; --tip: #185fa5; --tip-light: #e6f1fb;
  }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 40px 24px 64px; background: var(--bg); color: var(--ink);
    font-family: """ + FONT_STACK + """; line-height: 1.5; }
  .wrap { max-width: 900px; margin: 0 auto; }
  header { padding-bottom: 20px; border-bottom: 2px solid var(--ink); margin-bottom: 24px; }
  header h1 { margin: 0 0 6px; font-size: 22px; font-weight: 600; }
  header .meta { color: var(--muted); font-size: 14px; }
  .back-link { display: inline-block; font-size: 13px; font-weight: 600; color: var(--tip); text-decoration: none; background: var(--tip-light); padding: 7px 14px; border-radius: 20px; margin-bottom: 18px; }
  .back-link:hover { background: var(--tip); color: #fff; }
  .section-label { font-size: 13px; font-weight: 600; color: var(--muted); margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.04em; }
  .schedule-list { background: var(--card); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; margin-bottom: 28px; }
  .schedule-row { display: flex; align-items: center; gap: 16px; padding: 16px 20px; border-top: 1px solid var(--line); }
  .schedule-row:first-child { border-top: none; }
  .day-pill { display: inline-block; min-width: 52px; text-align: center; font-size: 12.5px; font-weight: 700; color: var(--accent); background: var(--accent-light); padding: 5px 10px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.02em; }
  .schedule-time { font-size: 16px; font-weight: 600; color: var(--ink); flex: 1; }
  .schedule-note { font-size: 12.5px; color: var(--muted); }
  .note { background: var(--accent-light); border: 1px solid var(--line); border-radius: 10px; padding: 16px 20px; font-size: 13.5px; color: var(--accent); margin-bottom: 28px; display: flex; gap: 12px; align-items: flex-start; }
  .note .emoji { font-size: 18px; }
  .note b { display: block; margin-bottom: 3px; color: var(--ink); }
  footer { margin-top: 30px; font-size: 12px; color: var(--muted); text-align: center; }
"""
    html = """<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<title>""" + STUDENT + """ &mdash; Class Schedule</title>
""" + FONT_LINKS + """
<style>""" + css + """</style>
</head>
<body>
<div class="wrap">

  <a class="back-link" href=\"""" + HOME_HREF_FROM_ROOT + """\">&larr; Back to home</a>

  <header>
    <h1>""" + STUDENT + """&rsquo;s class schedule</h1>
    <div class="meta">Recurring weekly sessions &middot; last confirmed 2026-07-30</div>
  </header>

  <div class="section-label">Recurring weekly schedule</div>
  <div class="schedule-list">
    <div class="schedule-row">
      <span class="day-pill">TUE</span>
      <span class="schedule-time">19:00 &ndash; 20:00</span>
      <span class="schedule-note">1 hour &middot; """ + SUBJECT_TH + """</span>
    </div>
    <div class="schedule-row">
      <span class="day-pill">WED</span>
      <span class="schedule-time">19:00 &ndash; 20:00</span>
      <span class="schedule-note">1 hour &middot; """ + SUBJECT_TH + """</span>
    </div>
  </div>

  <div class="note">
    <span class="emoji">&#127890;</span>
    <div><b>Current pattern</b>Tue &amp; Wed 19:00&ndash;20:00 is the standing weekly schedule as of 2026-07-30. No end date has been given yet &mdash; let me know when this changes (school term breaks, exam periods, etc.) and I&rsquo;ll update this page.</div>
  </div>

  <footer>""" + STUDENT + """ &middot; class schedule &middot; update this page whenever a session is added, moved, or cancelled</footer>

</div>
</body>
</html>
"""
    write(SCHEDULE_HREF_FROM_ROOT, html)

# ---------------------------------------------------------------------------
# FEES: INDEX + JULY 2026
# ---------------------------------------------------------------------------
FEES_CSS_MONTH = """
  :root {
    --ink: #1f2a24; --muted: #5c6b63; --line: #dfe6e1; --bg: #fbfaf7; --card: #ffffff;
    --accent: #0f6e56; --accent-light: #e1f5ee; --tip: #185fa5; --tip-light: #e6f1fb; --amber: #854f0b; --amber-light: #faeeda;
  }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 40px 24px 64px; background: var(--bg); color: var(--ink);
    font-family: """ + FONT_STACK + """; line-height: 1.5; }
  .wrap { max-width: 1180px; margin: 0 auto; }
  header { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 16px; padding-bottom: 20px; border-bottom: 2px solid var(--ink); margin-bottom: 24px; }
  header h1 { margin: 0 0 6px; font-size: 22px; font-weight: 600; }
  header .meta { color: var(--muted); font-size: 14px; }
  .total-box { text-align: right; }
  .total-box .num { font-size: 32px; font-weight: 700; color: var(--amber); line-height: 1; }
  .total-box .sub { font-size: 13px; color: var(--muted); margin-top: 4px; }
  .back-link { display: inline-block; font-size: 13px; font-weight: 600; color: var(--tip); text-decoration: none; background: var(--tip-light); padding: 7px 14px; border-radius: 20px; margin-bottom: 18px; }
  .back-link:hover { background: var(--tip); color: #fff; }
  table { width: 100%; border-collapse: collapse; background: var(--card); border-radius: 12px; overflow: hidden; border: 1px solid var(--line); font-size: 13px; margin-bottom: 24px; }
  thead th { background: var(--ink); color: #fff; text-align: left; padding: 11px 12px; font-weight: 600; font-size: 12px; letter-spacing: 0.02em; }
  tbody td { padding: 10px 12px; border-top: 1px solid var(--line); vertical-align: middle; }
  tbody tr:nth-child(even) { background: #fafaf8; }
  td.cost { text-align: right; font-weight: 700; }
  .status-pill { display: inline-block; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; white-space: nowrap; }
  .status-charged { background: var(--accent-light); color: var(--accent); }
  .status-nocharge { background: var(--amber-light); color: var(--amber); }
  tr.total td { border-top: 2px solid var(--ink); font-weight: 700; background: var(--accent-light); color: var(--accent); }
  tr.placeholder td { color: var(--muted); font-style: italic; text-align: center; padding: 22px 14px; }
  .note { background: var(--tip-light); border: 1px solid var(--line); border-radius: 10px; padding: 16px 20px; font-size: 13.5px; color: var(--tip); margin-bottom: 28px; display: flex; gap: 12px; align-items: flex-start; }
  .note .emoji { font-size: 18px; }
  .note b { display: block; margin-bottom: 3px; color: var(--ink); }
  footer { margin-top: 30px; font-size: 12px; color: var(--muted); text-align: center; }
"""

# (day_abbr, date_str, start, finish, duration_hours, status, remark)
# status: "charged" or "nocharge". remark is shown as-is (Thai + short English gloss).
JULY_2026_SESSIONS = [
    ("Wed", "2026-07-01", "19:00", "20:00", 1.0, "charged",  ""),
    ("Tue", "2026-07-07", "19:00", "20:00", 1.0, "charged",  ""),
    ("Wed", "2026-07-08", "19:00", "20:00", 1.0, "charged",  ""),
    ("Tue", "2026-07-14", "19:00", "20:00", 1.0, "nocharge", "ลาติดธุระ (on leave — personal errand)"),
    ("Wed", "2026-07-15", "19:00", "20:00", 1.0, "nocharge", "คุณครูลาเคลียงงาน (tutor's leave — clearing up work)"),
    ("Tue", "2026-07-21", "19:00", "20:00", 1.0, "charged",  ""),
    ("Wed", "2026-07-22", "19:00", "20:00", 1.0, "nocharge", "ลาติดธุระ (on leave — personal errand)"),
    ("Tue", "2026-07-28", "19:00", "20:00", 1.0, "nocharge", "ลาติดธุระ (on leave — personal errand)"),
    ("Wed", "2026-07-29", "19:00", "20:00", 1.0, "nocharge", "ลาติดธุระ (on leave — personal errand)"),
]
RATE_PER_HOUR = 275

def month_totals(sessions):
    charged = [s for s in sessions if s[5] == "charged"]
    nocharge = [s for s in sessions if s[5] == "nocharge"]
    total = sum(s[4] * RATE_PER_HOUR for s in charged)
    return len(sessions), len(charged), len(nocharge), total

_JULY_SESSION_COUNT, _JULY_CHARGED_COUNT, _JULY_NOCHARGE_COUNT, _JULY_TOTAL = month_totals(JULY_2026_SESSIONS)
_JULY_TOTAL_STR = "฿" + format(int(_JULY_TOTAL), ",")

def build_fees_month():
    session_count, charged_count, nocharge_count, month_total = month_totals(JULY_2026_SESSIONS)

    rows = ""
    for (day, date, start, finish, dur, status, remark) in JULY_2026_SESSIONS:
        if status == "charged":
            cost = dur * RATE_PER_HOUR
            status_html = '<span class="status-pill status-charged">Charged</span>'
            cost_str = "฿" + format(int(cost), ",")
            remark_str = remark if remark else "&mdash;"
        else:
            status_html = '<span class="status-pill status-nocharge">No charge</span>'
            cost_str = "฿0"
            remark_str = remark
        rows += (
            "      <tr><td>" + day + "</td><td>" + date + "</td><td>" + start + "</td><td>" + finish + "</td>"
            "<td>" + SUBJECT_TH + "</td><td>" + (str(int(dur)) if dur == int(dur) else str(dur)) + " hr</td>"
            "<td>฿" + str(RATE_PER_HOUR) + "</td><td>" + status_html + "</td>"
            '<td class="cost">' + cost_str + "</td><td>" + remark_str + "</td></tr>\n"
        )

    month_total_str = "฿" + format(int(month_total), ",")

    html = """<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<title>""" + STUDENT + """ &mdash; July 2026 Fee Summary</title>
""" + FONT_LINKS + """
<style>""" + FEES_CSS_MONTH + """</style>
</head>
<body>
<div class="wrap">

  <a class="back-link" href=\"""" + FEES_INDEX_HREF_FROM_SUB + """\">&larr; Back to all months</a>

  <header>
    <div>
      <h1>July 2026 &mdash; fee summary</h1>
      <div class="meta">""" + SUBJECT_TH + """ tutoring &middot; """ + RATE_STR + """ / hour &middot; """ + str(session_count) + """ sessions logged, """ + str(charged_count) + """ charged</div>
    </div>
    <div class="total-box">
      <div class="num">""" + month_total_str + """</div>
      <div class="sub">total due this month</div>
    </div>
  </header>

  <table>
    <thead>
      <tr><th>Day</th><th>Date</th><th>Start</th><th>Finish</th><th>Subject</th><th>Duration</th><th>Rate</th><th>Status</th><th>Cost</th><th>Remark</th></tr>
    </thead>
    <tbody>
""" + rows + """      <tr class="total"><td colspan="8">Total (""" + str(charged_count) + """ charged sessions, """ + str(nocharge_count) + """ no-charge)</td><td class="cost">""" + month_total_str + """</td><td></td></tr>
    </tbody>
  </table>

  <div class="note">
    <span class="emoji">&#128161;</span>
    <div><b>Next month</b>Tell me the sessions held (or the recurring schedule and any changes/leave days) and I&rsquo;ll build next month&rsquo;s page the same way.</div>
  </div>

  <footer>""" + STUDENT + """ &middot; monthly fee summary &middot; """ + RATE_STR + """ / hour &middot; a new page is made for each month</footer>

</div>
</body>
</html>
"""
    write(FEES_MONTH_HREF_FROM_ROOT, html)

def build_fees_index():
    css = """
  :root {
    --ink: #1f2a24; --muted: #5c6b63; --line: #dfe6e1; --bg: #fbfaf7; --card: #ffffff;
    --accent: #0f6e56; --accent-light: #e1f5ee; --tip: #185fa5; --tip-light: #e6f1fb; --amber: #854f0b; --amber-light: #faeeda;
  }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 40px 24px 64px; background: var(--bg); color: var(--ink);
    font-family: """ + FONT_STACK + """; line-height: 1.5; }
  .wrap { max-width: 780px; margin: 0 auto; }
  header { padding-bottom: 20px; border-bottom: 2px solid var(--ink); margin-bottom: 24px; }
  header h1 { margin: 0 0 6px; font-size: 22px; font-weight: 600; }
  header .meta { color: var(--muted); font-size: 14px; }
  .back-link { display: inline-block; font-size: 13px; font-weight: 600; color: var(--tip); text-decoration: none; background: var(--tip-light); padding: 7px 14px; border-radius: 20px; margin-bottom: 18px; }
  .back-link:hover { background: var(--tip); color: #fff; }
  .month-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px; }
  .month-card { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; text-decoration: none; color: inherit; transition: box-shadow 0.15s ease, transform 0.15s ease; }
  .month-card:hover { box-shadow: 0 4px 16px rgba(31,42,36,0.12); transform: translateY(-2px); }
  .month-name { font-size: 15.5px; font-weight: 700; }
  .month-sub { font-size: 12.5px; color: var(--muted); margin-top: 3px; }
  .month-total { font-size: 18px; font-weight: 700; color: var(--amber); text-align: right; white-space: nowrap; }
  .month-goto { font-size: 12px; color: var(--tip); font-weight: 600; margin-top: 3px; text-align: right; }
  .note { background: var(--accent-light); border: 1px solid var(--line); border-radius: 10px; padding: 14px 18px; font-size: 13px; color: var(--accent); margin-bottom: 28px; }
  footer { margin-top: 30px; font-size: 12px; color: var(--muted); text-align: center; }
"""
    html = """<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<title>""" + STUDENT + """ &mdash; Monthly Fee Summaries</title>
""" + FONT_LINKS + """
<style>""" + css + """</style>
</head>
<body>
<div class="wrap">

  <a class="back-link" href=\"""" + HOME_HREF_FROM_SUB + """\">&larr; Back to home</a>

  <header>
    <h1>Monthly fee summaries</h1>
    <div class="meta">""" + SUBJECT_TH + """ tutoring &middot; """ + RATE_STR + """ / hour &middot; pick a month to see the full session list and total</div>
  </header>

  <div class="month-list">
    <a class="month-card" href=\"""" + FEES_MONTH_HREF_FROM_ROOT + """\">
      <div>
        <div class="month-name">July 2026</div>
        <div class="month-sub">""" + str(_JULY_SESSION_COUNT) + """ sessions logged &middot; """ + str(_JULY_CHARGED_COUNT) + """ charged</div>
      </div>
      <div>
        <div class="month-total">""" + _JULY_TOTAL_STR + """</div>
        <div class="month-goto">Open &rarr;</div>
      </div>
    </a>
  </div>

  <div class="note">Add a new month: tell me the sessions held (or the recurring schedule plus any leave days), I&rsquo;ll build that month&rsquo;s page, and add it to the list above.</div>

  <footer>""" + STUDENT + """ &middot; fee summaries by month &middot; """ + RATE_STR + """ / hour</footer>

</div>
</body>
</html>
"""
    write(FEES_INDEX_HREF_FROM_ROOT, html)

build_topic_pages()
build_dashboard()
build_hub()
build_schedule()
build_fees_month()
build_fees_index()

print("DONE")
