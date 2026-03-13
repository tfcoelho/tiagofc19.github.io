#!/usr/bin/env python3
"""
Shuffle manifest.json in a collection folder.

Usage:
    python3 _shuffle.py <folder>    # e.g. python3 _shuffle.py music
    python3 _shuffle.py .           # run inside the folder itself
"""

import json
import random
import sys
from pathlib import Path

# ── Edit this to point at your collection folder ──────────
FOLDER = "skateboard"  # relative to this script, or absolute path
# ──────────────────────────────────────────────────────────

folder = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(FOLDER)
folder = (Path(__file__).parent / folder).resolve()

manifest_path = folder / 'manifest.json'

if not manifest_path.exists():
    print(f'Error: {manifest_path} not found.', file=sys.stderr)
    sys.exit(1)

with open(manifest_path) as f:
    manifest = json.load(f)

random.shuffle(manifest)

with open(manifest_path, 'w') as f:
    json.dump(manifest, f, indent=2)
    f.write('\n')

print(f'✓ Shuffled {len(manifest)} photos in {manifest_path}')
