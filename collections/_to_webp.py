#!/usr/bin/env python3
"""
Convert a folder of photos to web-sized .webp files.

Usage:
    python3 _to_webp.py <folder>                    # writes to <folder>/webp/
    python3 _to_webp.py <folder> --out <dir>        # writes to <dir>
    python3 _to_webp.py <folder> --max 2048 --quality 75

Works on any folder on your computer (absolute or relative to where you run it).

What it does, per image:
  - fixes rotation (phone photos store it as a flag, not in the pixels)
  - shrinks so the long side is at most --max px (never enlarges)
  - saves as .webp at --quality, keeping the colour profile
  - drops EXIF metadata (camera info, GPS location)
Originals are never modified. Files already converted are skipped unless --force.

Supported input: jpg, jpeg, png, heic, heif, tiff, tif, webp
Requires: Pillow + pillow-heif (installed in the repo's .venv — this script
switches to it automatically).
"""

import argparse
import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
VENV_PY   = REPO_ROOT / '.venv' / 'bin' / 'python'

# Re-run with the repo's .venv if Pillow isn't available in this Python
try:
    from PIL import Image, ImageOps
except ImportError:
    if VENV_PY.exists() and Path(sys.prefix).resolve() != VENV_PY.parent.parent.resolve():
        os.execv(str(VENV_PY), [str(VENV_PY), *sys.argv])
    sys.exit('Pillow not found. Set it up with:\n'
             f'  python3 -m venv {REPO_ROOT}/.venv && '
             f'{VENV_PY} -m pip install pillow pillow-heif')

try:
    from pillow_heif import register_heif_opener
    register_heif_opener()
except ImportError:
    pass  # HEIC files will be reported as unreadable

SUPPORTED = {'.jpg', '.jpeg', '.png', '.heic', '.heif', '.tiff', '.tif', '.webp'}

DEFAULT_MAX     = 2560  # px, long side
DEFAULT_QUALITY = 80


def human(n: int) -> str:
    for unit in ('B', 'KB', 'MB'):
        if n < 1024:
            return f'{n:.0f}{unit}'
        n /= 1024
    return f'{n:.1f}GB'


def convert(src: Path, dst: Path, max_side: int, quality: int):
    """Convert one image. Returns (w, h) of the output."""
    with Image.open(src) as img:
        icc = img.info.get('icc_profile')
        img = ImageOps.exif_transpose(img)
        has_alpha = img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info)
        img = img.convert('RGBA' if has_alpha else 'RGB')
        img.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
        save_kwargs = {'quality': quality, 'method': 6}
        if icc:
            save_kwargs['icc_profile'] = icc
        img.save(dst, 'WEBP', **save_kwargs)
        return img.size


def convert_folder(src_dir: Path, out_dir: Path, max_side=DEFAULT_MAX,
                   quality=DEFAULT_QUALITY, force=False) -> list[Path]:
    """Convert every supported image in src_dir into out_dir. Returns output paths."""
    src_dir = src_dir.expanduser().resolve()
    out_dir = out_dir.expanduser().resolve()

    if not src_dir.is_dir():
        sys.exit(f'Error: "{src_dir}" is not a directory.')

    sources = sorted(
        f for f in src_dir.iterdir()
        if f.is_file() and f.suffix.lower() in SUPPORTED and not f.name.startswith('.')
    )
    if not sources:
        print(f'No supported images found in {src_dir}')
        return []

    out_dir.mkdir(parents=True, exist_ok=True)

    outputs, seen, failed = [], {}, []
    total_in = total_out = 0

    for src in sources:
        dst = out_dir / (src.stem + '.webp')

        if dst.name in seen:
            print(f'  {src.name}: skipped (same name as {seen[dst.name]})')
            continue
        seen[dst.name] = src.name

        if dst.resolve() == src.resolve():
            print(f'  {src.name}: skipped (output would overwrite the original)')
            continue

        if dst.exists() and not force and dst.stat().st_mtime >= src.stat().st_mtime:
            print(f'  {src.name}: already converted')
            outputs.append(dst)
            continue

        try:
            w, h = convert(src, dst, max_side, quality)
        except Exception as e:
            print(f'  {src.name}: FAILED ({e})')
            failed.append(src.name)
            continue

        size_in, size_out = src.stat().st_size, dst.stat().st_size
        total_in += size_in
        total_out += size_out
        print(f'  {src.name} → {dst.name}  {w}x{h}  {human(size_in)} → {human(size_out)}')
        outputs.append(dst)

    print(f'\n✓ {len(outputs)} images in {out_dir}')
    if total_in:
        print(f'  converted {human(total_in)} → {human(total_out)}')
    if failed:
        print(f'  Failed {len(failed)}: {", ".join(failed)}')
    return outputs


def main():
    p = argparse.ArgumentParser(description='Convert a folder of photos to web-sized .webp')
    p.add_argument('folder', type=Path, help='folder with the original photos')
    p.add_argument('--out', type=Path, help='output folder (default: <folder>/webp)')
    p.add_argument('--max', type=int, default=DEFAULT_MAX,
                   help=f'max long side in px (default {DEFAULT_MAX})')
    p.add_argument('--quality', type=int, default=DEFAULT_QUALITY,
                   help=f'webp quality 0-100 (default {DEFAULT_QUALITY})')
    p.add_argument('--force', action='store_true', help='re-convert files that already exist')
    args = p.parse_args()

    out = args.out or (args.folder / 'webp')
    convert_folder(args.folder, out, args.max, args.quality, args.force)


if __name__ == '__main__':
    main()
