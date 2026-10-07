#!/usr/bin/env python3
"""
Turn a normal folder of photos into a collection page on the site.

Usage:
    python3 _new_collection.py <photo folder> <slug> [options]

Examples:
    python3 _new_collection.py ~/Pictures/Japan japan
    python3 _new_collection.py ~/Pictures/Japan japan --label "Japan 2026" --shuffle
    python3 _new_collection.py ~/Pictures/Japan japan --home --cover IMG_1234.HEIC

Steps:
  1. _to_webp.py      originals → collections/<slug>/*.webp  (resized, rotated, EXIF stripped)
  2. _generate.py     writes collections/<slug>/manifest.json  (sizes + blur placeholders)
  3. _shuffle.py      (only with --shuffle) random photo order
  4. index.html       created from an existing collection page (if missing)
  5. js/collection.js adds the collection to the top-bar switcher (if missing)
  6. --home           adds a column on the homepage intro (js/intro.js) with a
                      cover image in columns/<slug>/cover.webp
     --more           same, but the column sits off to the right and slides in
                      with the "More →" button instead of being in the intro

Safe to re-run: add more photos to the folder and run it again. Existing
photos are skipped, new ones are appended to the manifest, and pages and
JS entries are never duplicated. Originals are never modified.

Then preview locally, and commit + push to publish.
"""

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

import _to_webp  # also switches to the repo's .venv if needed
from PIL import Image, ImageOps

COLLECTIONS_DIR = Path(__file__).resolve().parent
REPO_ROOT       = COLLECTIONS_DIR.parent
TEMPLATE_PAGE   = COLLECTIONS_DIR / 'trips' / 'index.html'
COLLECTION_JS   = REPO_ROOT / 'js' / 'collection.js'
INTRO_JS        = REPO_ROOT / 'js' / 'intro.js'
COLUMNS_DIR     = REPO_ROOT / 'columns'

COVER_SIZE = (1350, 2700)  # homepage column cover (portrait 1:2)


def step(msg):
    print(f'\n── {msg} ' + '─' * max(0, 56 - len(msg)), flush=True)


def create_page(dest: Path, slug: str, label: str):
    page = dest / 'index.html'
    if page.exists():
        print(f'  {page.relative_to(REPO_ROOT)} already exists — left as is')
        return
    html = TEMPLATE_PAGE.read_text(newline='')
    html = re.sub(r"window\.COLLECTION = \{ name: '[^']*'",
                  f"window.COLLECTION = {{ name: '{slug}'", html)
    html = re.sub(r'<title>.*?</title>', f'<title>{label} — Tiago Coelho</title>', html)
    page.write_text(html, newline='')
    print(f'  created {page.relative_to(REPO_ROOT)}')


def add_js_entry(js_path: Path, array_name: str, slug_key: str, slug: str, line: str):
    """Append `line` to the `const <array_name> = [ ... ];` block unless the slug is present."""
    # newline='' keeps the file's own line endings (some JS files use CRLF)
    src = js_path.read_text(newline='')
    m = re.search(rf'(const {array_name} = \[\r?\n)(.*?)(\r?\n\s*\];)', src, re.S)
    if not m:
        print(f'  could not find {array_name} in {js_path.name} — add it by hand:\n    {line.strip()}')
        return
    if re.search(rf"{slug_key}:\s*'{re.escape(slug)}'", m.group(2)):
        print(f'  {js_path.relative_to(REPO_ROOT)}: already has {slug}')
        return
    eol = '\r\n' if '\r\n' in src else '\n'
    src = src[:m.end(2)] + eol + line + src[m.end(2):]
    js_path.write_text(src, newline='')
    print(f'  {js_path.relative_to(REPO_ROOT)}: added {slug}')


def make_cover(src: Path, slug: str, label: str, order: int):
    col_dir = COLUMNS_DIR / slug
    col_dir.mkdir(parents=True, exist_ok=True)
    cover = col_dir / 'cover.webp'
    with Image.open(src) as img:
        img = ImageOps.exif_transpose(img).convert('RGB')
        img = ImageOps.fit(img, COVER_SIZE, Image.Resampling.LANCZOS)
        img.save(cover, 'WEBP', quality=80, method=6)
    print(f'  {cover.relative_to(REPO_ROOT)} from {src.name}')

    meta = col_dir / 'meta.json'
    if not meta.exists():
        meta.write_text(json.dumps({'title': label, 'slug': slug, 'order': order}, indent=2) + '\n')


def pick_cover(src_dir: Path, cover_arg: str | None, webps: list[Path]) -> Path | None:
    if cover_arg:
        p = Path(cover_arg).expanduser()
        if not p.is_absolute():
            p = src_dir / p
        if not p.exists():
            sys.exit(f'Error: cover image "{p}" not found.')
        return p
    # Default: first portrait photo, else the first photo
    for w in webps:
        with Image.open(w) as img:
            if img.height > img.width:
                return w
    return webps[0] if webps else None


def main():
    p = argparse.ArgumentParser(description='Create/update a photo collection page from a folder')
    p.add_argument('folder', type=Path, help='folder with the original photos (anywhere on your computer)')
    p.add_argument('slug', help='URL name, e.g. "japan" → /collections/japan/')
    p.add_argument('--label', help='display name (default: slug in Title Case)')
    p.add_argument('--max', type=int, default=_to_webp.DEFAULT_MAX,
                   help=f'max long side in px (default {_to_webp.DEFAULT_MAX})')
    p.add_argument('--quality', type=int, default=_to_webp.DEFAULT_QUALITY,
                   help=f'webp quality 0-100 (default {_to_webp.DEFAULT_QUALITY})')
    p.add_argument('--shuffle', action='store_true', help='randomise photo order in the manifest')
    p.add_argument('--home', action='store_true', help='also add a column on the homepage intro')
    p.add_argument('--more', action='store_true',
                   help='add a homepage column outside the intro, revealed with "More →"')
    p.add_argument('--cover', help='photo to use as homepage cover (default: first portrait photo)')
    p.add_argument('--force', action='store_true', help='re-convert photos that already exist')
    args = p.parse_args()

    slug = args.slug.strip().lower()
    if not re.fullmatch(r'[a-z0-9][a-z0-9_-]*', slug):
        sys.exit('Error: slug must be lowercase letters, numbers, - or _ (e.g. "japan-2026").')
    label = args.label or slug.replace('-', ' ').replace('_', ' ').title()

    src_dir = args.folder.expanduser().resolve()
    dest = COLLECTIONS_DIR / slug
    if src_dir == dest:
        sys.exit('Error: the photo folder is the collection folder itself — point at the originals.')

    step(f'1. Converting photos → collections/{slug}/')
    webps = _to_webp.convert_folder(src_dir, dest, args.max, args.quality, args.force)
    if not webps:
        sys.exit('Nothing to publish.')

    step('2. Generating manifest + blur placeholders')
    subprocess.run([sys.executable, str(COLLECTIONS_DIR / '_generate.py'), str(dest)], check=True)

    if args.shuffle:
        step('3. Shuffling')
        subprocess.run([sys.executable, str(COLLECTIONS_DIR / '_shuffle.py'), str(dest)], check=True)

    step('4. Page')
    create_page(dest, slug, label)

    step('5. Collection switcher')
    add_js_entry(COLLECTION_JS, 'ALL_COLLECTIONS', 'name', slug,
                 f"    {{ name: '{slug}', label: '{label}' }},")

    if args.home or args.more:
        step('6. Homepage column' + (' (behind "More")' if args.more else ''))
        extra = ', extra: true' if args.more else ''
        add_js_entry(INTRO_JS, 'COLUMNS', 'slug', slug,
                     f"  {{ slug: '{slug}', title: '{label}', strips: [1, 2, 3], "
                     f"href: 'collections/{slug}/'{extra} }},")
        order = len([d for d in COLUMNS_DIR.iterdir() if d.is_dir()]) + 1
        cover_exists = (COLUMNS_DIR / slug / 'cover.webp').exists()
        cover_src = pick_cover(src_dir, args.cover, webps)
        if cover_exists and not args.cover:
            print(f'  columns/{slug}/cover.webp already exists — pass --cover to replace it')
        elif cover_src:
            make_cover(cover_src, slug, label, order)

    print(f'\n✓ Done → collections/{slug}/  ({len(webps)} photos)')
    print('  Preview:  python3 -m http.server 8000  →  '
          f'http://localhost:8000/collections/{slug}/')
    print('  Publish:  commit + push')


if __name__ == '__main__':
    main()
