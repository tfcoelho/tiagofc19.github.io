// Pointer cursors — skipped on macOS (Chromium has a known cursor-area bug there)
if (navigator.userAgentData?.platform !== 'macOS' && !/Mac/.test(navigator.userAgent)) {
  const s = document.createElement('style');
  s.textContent = `
    a, a *, button, button *,
    .col, .col *, #portfolio, #portfolio *,
    #music-island, #music-island *,
    #about-btn, #back-btn, #theme-toggle { cursor: pointer; }
  `;
  document.head.appendChild(s);
}

/**
 * Column intro animation
 *
 *  1. Columns appear one by one in random order (scale from bottom)
 *  2. Each column cycles through its strips exactly once
 *  3. Cover fades in, strips done
 *  4. Once ALL columns have shown their cover → portfolio shrinks & centers,
 *     signature fades in at top
 */

const COLUMNS = [
  { slug: 'car',        title: 'Car',        strips: [1, 2, 3] },
  { slug: 'nature',     title: 'Nature',     strips: [1, 2, 3] },
  { slug: 'dirtbikes',  title: 'Dirt Bikes', strips: [1, 2, 3] },
  { slug: 'music',      title: 'Music',      strips: [1, 2, 3], href: 'collections/music/' },
  { slug: 'skateboard', title: 'Skateboard', strips: [1, 2, 3], href: 'collections/skateboard/' },
  { slug: 'trips',      title: 'Trips',      strips: [1, 2, 3] },
];

const STRIP_DURATION_MS = 500;  // how long each strip is shown
const STAGGER_MS        = 220;  // delay between each column appearing
const SETTLE_DELAY_MS   = 300;  // pause after last cover before shrinking

// ── Helpers ────────────────────────────────────────────────────────────────
function loadImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => resolve(null); // null = doesn't exist
    img.src = src;
  });
}

async function loadStrips(slug, indices) {
  const results = await Promise.all(
    indices.map(n => loadImage(`columns/${slug}/strip_${n}.webp`))
  );
  return results
    .map((img) => {
      if (!img) return null;
      img.alt = '';
      img.draggable = false;
      return img;
    })
    .filter(Boolean);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Cycles through strips exactly once, then resolves when cover is shown
function runSequence(colEl) {
  return new Promise(resolve => {
    const strip  = colEl.querySelector('.col__strip');
    const strips = [...strip.querySelectorAll('img:not(.cover)')];
    const cover  = strip.querySelector('img.cover');

    // no strips — nothing to cycle
    if (strips.length === 0) { resolve(); return; }

    // activate first image now (column just became visible — it will slide in)
    strips[0].classList.add('active');
    let idx = 0;

    function advance() {
      const prev = strips[idx];
      idx++;
      prev.classList.remove('active');
      prev.classList.add('exit');
      if (idx < strips.length) {
        strips[idx].classList.add('active');
        setTimeout(advance, STRIP_DURATION_MS);
      } else {
        // all strips shown — reveal cover (if it exists)
        if (cover) cover.classList.add('active');
        resolve();
      }
    }

    setTimeout(advance, STRIP_DURATION_MS);
  });
}

// ── Main (async IIFE — works with file:// and http:// alike) ───────────────
(async () => {
  const portfolio    = document.getElementById('portfolio');
  const signature    = document.getElementById('signature');
  const themeToggle  = document.getElementById('theme-toggle');
  const musicIsland  = document.getElementById('music-island');
  const copyright    = document.getElementById('copyright');
  const aboutBtn     = document.getElementById('about-btn');

  // Restore saved theme
  if (localStorage.getItem('theme') === 'light') document.body.classList.add('light');

  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light');
    localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
  });

  // Discover strips for all columns in parallel, then build DOM
  const colMeta = await Promise.all(COLUMNS.map(async col => {
    const [strips, coverImg] = await Promise.all([
      loadStrips(col.slug, col.strips),
      loadImage(`columns/${col.slug}/cover.webp`),
    ]);
    return { col, strips, coverImg };
  }));

  colMeta.forEach(({ col, strips, coverImg }, i) => {
    const el = document.createElement('div');
    el.className = 'col';
    el.dataset.slug = col.slug;
    // alternate: even columns from bottom, odd from top
    if (i % 2 !== 0) el.dataset.from = 'top';

    const strip = document.createElement('div');
    strip.className = 'col__strip';

    if (strips.length > 0) {
      strips.forEach(img => strip.appendChild(img));
    }

    if (coverImg) {
      coverImg.alt = col.title;
      coverImg.draggable = false;
      coverImg.classList.add('cover');
      if (strips.length === 0) coverImg.classList.add('active');
      strip.appendChild(coverImg);
    }

    const label = document.createElement('div');
    label.className = 'col__label';
    label.textContent = col.title;

    el.appendChild(strip);
    el.appendChild(label);

    el.addEventListener('click', () => {
      window.location.href = col.href || `projects/${col.slug}.html`;
    });

    portfolio.appendChild(el);
  });

  // ── Intro sequence ───────────────────────────────────────────────────────
  const colEls   = [...document.querySelectorAll('.col')];
  const order    = shuffle(colEls.map((_, i) => i));
  const promises = [];

  order.forEach((colIdx, step) => {
    const p = new Promise(resolve => {
      setTimeout(() => {
        const el = colEls[colIdx];

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.classList.add('visible');
          });
        });

        runSequence(el).then(resolve);
      }, step * STAGGER_MS);
    });

    promises.push(p);
  });

  // When every column has settled on its cover → shrink & center, then show signature
  Promise.all(promises).then(() => {
    setTimeout(() => {
      portfolio.classList.add('settled');
      if (window.innerWidth <= 768) {
        portfolio.style.height = '45vh';
        portfolio.style.width  = '100%';
      }
      // wait for the portfolio shrink transition (0.9s) to finish before showing signature
      setTimeout(() => {
        signature.classList.add('visible');
        themeToggle.classList.add('visible');
        if (musicIsland) musicIsland.classList.add('visible');
        if (copyright)   copyright.classList.add('visible');
        if (aboutBtn)    aboutBtn.classList.add('visible');

        // enable hover 1s after intro completes
        setTimeout(() => portfolio.classList.add('hover-ready'), 500);
      }, 950);
    }, SETTLE_DELAY_MS);
  });
})();
