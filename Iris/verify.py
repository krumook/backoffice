# -*- coding: utf-8 -*-
import os, re, glob

OUT = os.path.dirname(os.path.abspath(__file__))
# REAL base path confirmed from the tutor's own screen recording (address bar), not the
# friendlier path given in tool instructions. This is the sandboxed app-package path Windows
# actually resolves file:// links against.
BASE_WINDOWS = (
    r"C:\Users\user\AppData\Local\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\Claude"
    r"\local-agent-mode-sessions\ecd4d787-b391-441b-a8ea-0077799b2858"
    r"\4eace835-dc78-4716-9c80-f4d3d7d42d1b\local_0009dfbc-2b1a-4776-9022-0a539da8de22\outputs"
) + "\\"

html_files = sorted(glob.glob(os.path.join(OUT, "**", "*.html"), recursive=True))
rel_files = [os.path.relpath(f, OUT) for f in html_files]
print("HTML files found:", len(rel_files))
for r in rel_files:
    print(" -", r)

errors = []

print("\n--- Path length check (against REAL sandboxed base, len={}) ---".format(len(BASE_WINDOWS)))
for r in rel_files:
    full = BASE_WINDOWS + r.replace("/", "\\")
    margin = 260 - len(full)
    flag = "OK" if margin >= 15 else "TOO TIGHT"
    print(f"{len(full):4d}  margin={margin:4d}  {flag}  {r}")
    if margin < 15:
        errors.append(f"Path length margin too tight for {r}: {margin}")

print("\n--- Link resolution check ---")
href_re = re.compile(r'href="([^"]+)"')
target_blank_re = re.compile(r'target\s*=\s*"_blank"', re.I)
for r in rel_files:
    full_path = os.path.join(OUT, r)
    with open(full_path, encoding="utf-8") as f:
        content = f.read()
    if target_blank_re.search(content):
        errors.append(f"{r}: found target=_blank")
    base_dir = os.path.dirname(full_path)
    for href in href_re.findall(content):
        if href.startswith("http") or href.startswith("mailto:") or href.startswith("#"):
            continue
        resolved = os.path.normpath(os.path.join(base_dir, href))
        if not os.path.isfile(resolved):
            errors.append(f"{r}: broken link -> {href} (resolved: {resolved})")

print("\n--- Tag balance check ---")
for tag in ["div", "table", "tr", "td", "a", "html", "body", "head", "style"]:
    for r in rel_files:
        full_path = os.path.join(OUT, r)
        with open(full_path, encoding="utf-8") as f:
            content = f.read()
        opens = len(re.findall(r"<" + tag + r"(\s|>)", content, re.I))
        closes = len(re.findall(r"</" + tag + r"\s*>", content, re.I))
        if opens != closes:
            errors.append(f"{r}: tag imbalance for <{tag}>: {opens} open vs {closes} close")

print("\n--- Topic subcode presence check ---")
import build as B
all_subcodes = []
for (n, code, th, en, slug, book, ch, subs) in B.TOPICS:
    for (sc, sth) in subs:
        all_subcodes.append((n, sc))
for (n, sc) in all_subcodes:
    path = os.path.join(OUT, B.topic_href(n))
    with open(path, encoding="utf-8") as f:
        content = f.read()
    count = content.count(">" + sc + "<")
    if count != 1:
        errors.append(f"topic {n}: subcode {sc} appears {count} times (expected 1)")

print("\n=== SUMMARY ===")
if errors:
    print(f"{len(errors)} ISSUE(S) FOUND:")
    for e in errors:
        print(" -", e)
else:
    print("All checks passed.")
