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

import base64
import json
import subprocess
import sys
import tempfile
from pathlib import Path

# ── Edit this to point at your collection folder ──────────
FOLDER = "cars"  # relative to this script, or absolute path
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


def blur_data_url(path: Path, size: int = 20) -> str:
    """
    Generate a tiny JPEG placeholder and return it as a base64 data URL.
    Uses sips (macOS built-in) to resize, then reads the bytes.
    Falls back to Pillow if sips is unavailable.
    """
    try:
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
            tmp_path = tmp.name

        # Resize to `size`px on the longest side and convert to JPEG
        subprocess.run(
            ['sips', '-Z', str(size), '-s', 'format', 'jpeg',
             '-s', 'formatOptions', '60', str(path), '--out', tmp_path],
            capture_output=True, timeout=10
        )
        data = Path(tmp_path).read_bytes()
        Path(tmp_path).unlink(missing_ok=True)
        if data:
            return 'data:image/jpeg;base64,' + base64.b64encode(data).decode()
    except Exception:
        pass

    # Pillow fallback
    try:
        from PIL import Image
        import io
        with Image.open(path) as img:
            img.thumbnail((size, size))
            buf = io.BytesIO()
            img.convert('RGB').save(buf, format='JPEG', quality=60)
            return 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()
    except Exception:
        pass

    return ''


def main():
    folder = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(FOLDER)
    folder = (Path(__file__).parent / folder).resolve()

    if not folder.is_dir():
        print(f'Error: "{folder}" is not a directory.', file=sys.stderr)
        sys.exit(1)

    # Collect image files
    all_files = {
        f.name: f for f in folder.iterdir()
        if f.is_file() and f.suffix.lower() in SUPPORTED
    }

    if not all_files:
        print(f'No supported image files found in {folder}')
        sys.exit(0)

    # Preserve order from existing manifest; append new files at the end
    existing_manifest = []
    existing_order = []
    manifest_path = folder / 'manifest.json'
    if manifest_path.exists():
        try:
            existing_manifest = json.loads(manifest_path.read_text())
            existing_order = [e['file'] for e in existing_manifest]
        except Exception:
            pass

    ordered_names = existing_order + sorted(n for n in all_files if n not in existing_order)
    files = [all_files[n] for n in ordered_names if n in all_files]

    manifest = []
    skipped  = []

    # Build lookup of existing entries to avoid re-generating blur for unchanged files
    existing_by_file = {e['file']: e for e in existing_manifest}

    for f in files:
        w, h = get_dimensions(f)
        if w and h:
            existing = existing_by_file.get(f.name, {})
            blur = existing.get('blur') or blur_data_url(f)
            entry = {'file': f.name, 'w': w, 'h': h}
            if blur:
                entry['blur'] = blur
            manifest.append(entry)
            reused = 'blur reused' if existing.get('blur') else ('blur ok' if blur else '')
            print(f'  {f.name}: {w}x{h}{"  (" + reused + ")" if reused else ""}')
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
