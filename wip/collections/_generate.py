#!/usr/bin/env python3
"""
Generate manifest.json for a photo collection folder.

Usage:
    python3 _generate.py <folder>    # target a specific folder
    python3 _generate.py .           # run inside the folder itself

Output:
    manifest.json  in the target folder, with entries:
    [{"file": "photo.jpg", "w": 4000, "h": 2667}, ...]

Image dimensions are read via:
  1. sips  (built-in on macOS, fastest — no dependencies)
  2. Pillow (pip install Pillow — cross-platform fallback)

Supported formats: jpg, jpeg, png, webp, heic, heif, tiff, tif
"""

import json
import subprocess
import sys
from pathlib import Path

# ── Edit this to point at your collection folder ──────────
FOLDER = "skateboard"  # relative to this script, or absolute path
# ──────────────────────────────────────────────────────────

SUPPORTED = {'.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.tiff', '.tif'}


def dimensions_via_sips(path: Path):
    """Read pixel dimensions with macOS sips (no third-party deps)."""
    try:
        result = subprocess.run(
            ['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', str(path)],
            capture_output=True, text=True, timeout=10
        )
        w = h = None
        for line in result.stdout.splitlines():
            line = line.strip()
            if line.startswith('pixelWidth'):
                w = int(line.split()[-1])
            elif line.startswith('pixelHeight'):
                h = int(line.split()[-1])
        if w and h:
            return w, h
    except Exception:
        pass
    return None, None


def dimensions_via_pillow(path: Path):
    """Read pixel dimensions with Pillow (pip install Pillow)."""
    try:
        from PIL import Image
        with Image.open(path) as img:
            return img.size  # (width, height)
    except Exception:
        pass
    return None, None


def get_dimensions(path: Path):
    w, h = dimensions_via_sips(path)
    if w and h:
        return w, h
    return dimensions_via_pillow(path)


def main():
    folder = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(FOLDER)
    folder = (Path(__file__).parent / folder).resolve()

    if not folder.is_dir():
        print(f'Error: "{folder}" is not a directory.', file=sys.stderr)
        sys.exit(1)

    # Collect image files, sorted alphabetically
    files = sorted(
        f for f in folder.iterdir()
        if f.is_file() and f.suffix.lower() in SUPPORTED
    )

    if not files:
        print(f'No supported image files found in {folder}')
        sys.exit(0)

    manifest = []
    skipped  = []

    for f in files:
        w, h = get_dimensions(f)
        if w and h:
            manifest.append({'file': f.name, 'w': w, 'h': h})
            print(f'  {f.name}: {w}x{h}')
        else:
            skipped.append(f.name)
            print(f'  {f.name}: skipped (could not read dimensions)')

    out_path = folder / 'manifest.json'
    with open(out_path, 'w') as fp:
        json.dump(manifest, fp, indent=2)
        fp.write('\n')

    print(f'\n✓ {len(manifest)} photos → {out_path}')
    if skipped:
        print(f'  Skipped {len(skipped)}: {", ".join(skipped)}')


if __name__ == '__main__':
    main()
