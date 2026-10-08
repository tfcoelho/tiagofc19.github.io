#!/usr/bin/env python3
"""
Reorder a collection's photos by drag and drop, with a live preview of the
site's 3-column layout. Saves the new order to manifest.json.

Usage:
    python3 _reorder.py <slug>          # e.g. python3 _reorder.py academic

Opens http://localhost:8765/ in your browser:
  left   — every photo in order; drag to reorder
  right  — preview of the collection page, exactly as the site lays it out
  Save   — writes the order to collections/<slug>/manifest.json
           (sizes and blur placeholders are kept; nothing else changes)

Stop with Ctrl+C. Only reachable from this computer.
"""

import json
import sys
import webbrowser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

COLLECTIONS_DIR = Path(__file__).resolve().parent
REPO_ROOT       = COLLECTIONS_DIR.parent
PORT            = 8765

PAGE = r"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Reorder — __SLUG__</title>
<script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js"></script>
<style>
  :root { --bg:#0a0a0a; --panel:#141414; --line:#262626; --text:#e8e8e8; --muted:#8a8a8a; --accent:#6aa6ff; }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { background:var(--bg); color:var(--text); font:13px/1.4 'Helvetica Neue',Helvetica,Arial,sans-serif;
         height:100vh; display:flex; flex-direction:column; }
  header { display:flex; align-items:center; gap:12px; padding:12px 16px; border-bottom:1px solid var(--line); }
  header h1 { font-size:11px; letter-spacing:.3em; text-transform:uppercase; font-weight:400; }
  header .hint { color:var(--muted); flex:1; }
  #status { color:var(--muted); min-width:110px; text-align:right; }
  #status.dirty { color:#f0b35a; } #status.saved { color:#7fd18b; }
  button { background:#222; color:var(--text); border:1px solid #333; border-radius:6px; padding:6px 12px; font:inherit; }
  button:hover { background:#2c2c2c; }
  button.primary { background:var(--accent); border-color:var(--accent); color:#06121f; font-weight:600; }
  button:disabled { opacity:.4; }
  main { flex:1; display:grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); min-height:0; }
  section { overflow:auto; padding:16px; min-height:0; }
  section + section { border-left:1px solid var(--line); }
  h2 { font-size:10px; letter-spacing:.25em; text-transform:uppercase; color:var(--muted); font-weight:400; margin-bottom:12px; }

  /* order grid */
  #order { display:grid; grid-template-columns:repeat(auto-fill,minmax(110px,1fr)); gap:8px; }
  .tile { position:relative; aspect-ratio:1; border-radius:6px; overflow:hidden; background:#1c1c1c;
          cursor:grab; outline:2px solid transparent; transition:outline-color .15s; }
  .tile img { width:100%; height:100%; object-fit:cover; display:block; pointer-events:none; }
  .tile .n { position:absolute; top:4px; left:4px; background:rgba(0,0,0,.65); color:#fff; font-size:11px;
             padding:1px 6px; border-radius:10px; }
  .tile .name { position:absolute; left:0; right:0; bottom:0; padding:12px 6px 4px; font-size:10px; color:#ddd;
                background:linear-gradient(transparent,rgba(0,0,0,.75)); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .tile.hl, .p-item.hl { outline:2px solid var(--accent); outline-offset:-2px; }
  .sortable-ghost { opacity:.25; }
  .sortable-chosen { cursor:grabbing; }

  /* preview — same rules as the site: 3 columns, 3px gap, each photo goes to the shortest column */
  #preview { display:flex; gap:3px; align-items:flex-start; max-width:720px; margin:0 auto; }
  .p-col { flex:1; display:flex; flex-direction:column; gap:3px; min-width:0; }
  .p-item { position:relative; background:#111; }
  .p-item img { width:100%; display:block; }
  .p-item .n { position:absolute; top:4px; left:4px; background:rgba(0,0,0,.6); color:#fff; font-size:10px;
               padding:1px 5px; border-radius:9px; }
</style>
</head>
<body>
<header>
  <h1>__SLUG__</h1>
  <span class="hint">Drag photos on the left. The right side shows the page as visitors will see it.</span>
  <span id="status">loading…</span>
  <button id="reset" title="Back to the last saved order">Reset</button>
  <button id="save" class="primary" disabled>Save</button>
</header>
<main>
  <section><h2>Order</h2><div id="order"></div></section>
  <section><h2>Preview</h2><div id="preview"></div></section>
</main>
<script>
const SLUG = "__SLUG__";
const base = `/collections/${SLUG}/`;
let saved = [], entries = [];
const $ = s => document.querySelector(s);
const status = (t, cls = '') => { $('#status').textContent = t; $('#status').className = cls; };

function tile(e) {
  const d = document.createElement('div');
  d.className = 'tile'; d.dataset.file = e.file;
  d.innerHTML = `<img loading="lazy" src="${base}${encodeURIComponent(e.file)}"><span class="n"></span><span class="name">${e.file}</span>`;
  return d;
}

function renderOrder() {
  const box = $('#order'); box.innerHTML = '';
  entries.forEach(e => box.appendChild(tile(e)));
  number();
}

function number() {
  [...$('#order').children].forEach((t, i) => t.querySelector('.n').textContent = i + 1);
}

function renderPreview() {
  const box = $('#preview'); box.innerHTML = '';
  const cols = [0, 1, 2].map(() => { const c = document.createElement('div'); c.className = 'p-col'; box.appendChild(c); return c; });
  const heights = [0, 0, 0];
  entries.forEach((e, i) => {
    let s = 0; for (let k = 1; k < 3; k++) if (heights[k] < heights[s]) s = k;
    heights[s] += e.h / e.w;
    const d = document.createElement('div');
    d.className = 'p-item'; d.dataset.file = e.file;
    d.innerHTML = `<img loading="lazy" src="${base}${encodeURIComponent(e.file)}" style="aspect-ratio:${e.w}/${e.h}"><span class="n">${i + 1}</span>`;
    cols[s].appendChild(d);
  });
}

function sync() {
  const byFile = Object.fromEntries(entries.map(e => [e.file, e]));
  entries = [...$('#order').children].map(t => byFile[t.dataset.file]);
  number(); renderPreview();
  const dirty = entries.some((e, i) => e.file !== saved[i]);
  $('#save').disabled = !dirty;
  status(dirty ? 'unsaved changes' : 'saved', dirty ? 'dirty' : 'saved');
}

// highlight the same photo in both panels
document.addEventListener('mouseover', ev => {
  const el = ev.target.closest('[data-file]');
  document.querySelectorAll('.hl').forEach(x => x.classList.remove('hl'));
  if (el) document.querySelectorAll(`[data-file="${CSS.escape(el.dataset.file)}"]`).forEach(x => x.classList.add('hl'));
});
// click a preview photo → scroll to it in the order grid
$('#preview').addEventListener('click', ev => {
  const el = ev.target.closest('[data-file]');
  if (el) document.querySelector(`#order [data-file="${CSS.escape(el.dataset.file)}"]`).scrollIntoView({ behavior: 'smooth', block: 'center' });
});

async function load() {
  const r = await fetch(`${base}manifest.json`, { cache: 'no-store' });
  entries = await r.json();
  saved = entries.map(e => e.file);
  renderOrder(); renderPreview(); status('saved', 'saved');
  $('#save').disabled = true;
}

$('#save').addEventListener('click', async () => {
  status('saving…');
  const r = await fetch('/save', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                                   body: JSON.stringify(entries.map(e => e.file)) });
  if (!r.ok) { status('save failed: ' + await r.text(), 'dirty'); return; }
  saved = entries.map(e => e.file);
  $('#save').disabled = true; status('saved', 'saved');
});

$('#reset').addEventListener('click', () => { if (confirm('Discard changes and go back to the saved order?')) load(); });
window.addEventListener('beforeunload', e => { if (!$('#save').disabled) { e.preventDefault(); e.returnValue = ''; } });

new Sortable($('#order'), { animation: 180, ghostClass: 'sortable-ghost', chosenClass: 'sortable-chosen', onEnd: sync });
load();
</script>
</body>
</html>
"""


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, slug, **kwargs):
        self.slug = slug
        super().__init__(*args, directory=str(REPO_ROOT), **kwargs)

    def log_message(self, *args):
        pass  # keep the terminal quiet

    def do_GET(self):
        if self.path in ('/', '/index.html'):
            body = PAGE.replace('__SLUG__', self.slug).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def do_POST(self):
        if self.path != '/save':
            self.send_error(404)
            return
        manifest_path = COLLECTIONS_DIR / self.slug / 'manifest.json'
        try:
            order = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
            current = json.loads(manifest_path.read_text())
            by_file = {e['file']: e for e in current}
            if sorted(order) != sorted(by_file):
                raise ValueError('photo list changed on disk — reload the page')
            manifest_path.write_text(json.dumps([by_file[f] for f in order], indent=2) + '\n')
        except Exception as e:
            msg = str(e).encode()
            self.send_response(400)
            self.send_header('Content-Length', str(len(msg)))
            self.end_headers()
            self.wfile.write(msg)
            return
        print(f'  saved new order → {manifest_path.relative_to(REPO_ROOT)}')
        self.send_response(204)
        self.end_headers()


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    slug = sys.argv[1].strip('/')
    if not (COLLECTIONS_DIR / slug / 'manifest.json').exists():
        sys.exit(f'Error: collections/{slug}/manifest.json not found.')

    server = ThreadingHTTPServer(('127.0.0.1', PORT), partial(Handler, slug=slug))
    url = f'http://localhost:{PORT}/'
    print(f'Reordering collections/{slug} → {url}\n  Ctrl+C to stop')
    webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nStopped.')


if __name__ == '__main__':
    main()
