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
  { slug: 'cars',        title: 'Cars',        strips: [1, 2, 3], href: 'collections/cars/' },
  { slug: 'nature',     title: 'Nature',     strips: [1, 2, 3], href: 'collections/nature/' },
  { slug: 'dirtbikes',  title: 'DirtBikes', strips: [1, 2, 3], href: 'collections/dirtbikes/' },
  { slug: 'music',      title: 'Music',      strips: [1, 2, 3], href: 'collections/music/' },
  { slug: 'skateboard', title: 'Skateboard', strips: [1, 2, 3], href: 'collections/skateboard/' },
  { slug: 'trips',      title: 'Trips',      strips: [1, 2, 3], href: 'collections/trips/' },
  // extra: not part of the intro — revealed by sliding the rail with "More"
  { slug: 'academic', title: 'Academic', strips: [1, 2, 3], href: 'collections/academic/', extra: true },
];

const STRIP_DURATION_MS = 500;  // how long each strip is shown
const STAGGER_MS        = 220;  // delay between each column appearing
const SETTLE_DELAY_MS   = 300;  // pause after last cover before shrinking

// ── Extra columns: hints that there is more to the right (mix and match) ──
const HINT_NUDGE        = true;   // after the intro, the rail peeks right and back (once per visit)
const HINT_BAR_ON_HOVER = true;   // scroll bar shows while the pointer is over the photos
const SHOW_MORE_BUTTON  = false;  // small "More →" / "← Back" text under the frame
const SCROLL_MS         = 650;    // duration of More/Back, wheel and keyboard scrolls

// CSS-style cubic-bezier easing — same curve as the portfolio's own transitions
function cubicBezier(x1, y1, x2, y2) {
  const bez = (t, a, b) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
  return x => {
    let lo = 0, hi = 1, t = x;
    for (let i = 0; i < 20; i++) {           // solve bez_x(t) = x by bisection
      t = (lo + hi) / 2;
      if (bez(t, x1, x2) < x) lo = t; else hi = t;
    }
    return bez(t, y1, y2);
  };
}
const easeInOut = cubicBezier(0.4, 0, 0.2, 1);

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

  // Main columns first, extras after — extras wait off to the right of the frame
  const ordered = [...COLUMNS.filter(c => !c.extra), ...COLUMNS.filter(c => c.extra)];
  const VISIBLE = ordered.filter(c => !c.extra).length;
  const EXTRA   = ordered.length - VISIBLE;

  // Rail: every column side by side; #portfolio shows VISIBLE of them at a time
  const clip = document.createElement('div');
  clip.className = 'portfolio__clip';
  const rail = document.createElement('div');
  rail.className = 'portfolio__rail';
  rail.style.width = `${ordered.length / VISIBLE * 100}%`;
  // Off-screen columns take the average hover flex, so each one stays exactly 1/N of the rail
  rail.style.setProperty('--off-flex', ((VISIBLE - 1) * 0.7 + 1.8) / VISIBLE);
  clip.appendChild(rail);
  portfolio.appendChild(clip);

  // Discover strips for all columns in parallel, then build DOM
  const colMeta = await Promise.all(ordered.map(async col => {
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

    if (col.extra) el.classList.add('extra', 'off');

    const label = document.createElement('div');
    label.className = 'col__label';
    label.textContent = col.title;

    el.appendChild(strip);
    el.appendChild(label);

    el.addEventListener('click', () => {
      window.navigateTo(col.href || `projects/${col.slug}.html`);
    });

    rail.appendChild(el);
  });

  // ── Scrollable rail — extra columns sit to the right of the frame ────────
  // Native horizontal scroll (trackpad momentum, touch), snapping to whole
  // columns, with a thin overlay bar on the photos (like Safari's scrollbar).
  const railCols = [...rail.children];
  let moreBtn = null;
  let startHint = null;

  if (EXTRA) {
    const bar   = document.createElement('div');
    bar.id = 'portfolio-scroll';
    const thumb = document.createElement('div');
    thumb.className = 'portfolio-scroll__thumb';
    thumb.style.width = `${VISIBLE / ordered.length * 100}%`;
    bar.appendChild(thumb);
    portfolio.appendChild(bar);
    if (HINT_BAR_ON_HOVER) portfolio.classList.add('bar-on-hover');

    if (SHOW_MORE_BUTTON) {
      moreBtn = document.createElement('button');
      moreBtn.id = 'portfolio-more';
      moreBtn.textContent = 'More →';
      portfolio.appendChild(moreBtn);
    }

    const colWidth  = () => clip.scrollWidth / ordered.length;
    const maxScroll = () => clip.scrollWidth - clip.clientWidth;
    const ready     = () => portfolio.classList.contains('hover-ready');

    let firstShown = 0, extrasPlayed = false, dragging = false;
    let scrollTimer = 0, barTimer = 0;

    function showBar() {
      bar.classList.add('visible');
      clearTimeout(barTimer);
      barTimer = setTimeout(() => {
        if (!dragging && !bar.matches(':hover')) bar.classList.remove('visible');
      }, 1000);
    }
    bar.addEventListener('pointerenter', showBar);
    bar.addEventListener('pointerleave', showBar);
    if (moreBtn) moreBtn.addEventListener('pointerenter', showBar);

    // Eased scroll (native smooth scroll is too quick and can't be tuned).
    // Snap is paused while animating; `snapAfter: false` keeps it paused.
    let animFrame = 0;
    function stopAnim() {
      if (!animFrame) return;
      cancelAnimationFrame(animFrame);
      animFrame = 0;
      clip.style.scrollSnapType = '';
    }
    function animateTo(left, duration = SCROLL_MS, snapAfter = true) {
      stopAnim();
      const from = clip.scrollLeft;
      const to   = Math.min(maxScroll(), Math.max(0, left));
      if (Math.abs(to - from) < 1) return Promise.resolve();
      clip.style.scrollSnapType = 'none';
      const t0 = performance.now();
      return new Promise(resolve => {
        const tick = now => {
          const t = Math.min(1, (now - t0) / duration);
          clip.scrollLeft = from + (to - from) * easeInOut(t);
          if (t < 1) { animFrame = requestAnimationFrame(tick); return; }
          animFrame = 0;
          if (snapAfter) clip.style.scrollSnapType = '';
          resolve();
        };
        animFrame = requestAnimationFrame(tick);
      });
    }
    const nearestCol = () => Math.round(clip.scrollLeft / colWidth());
    // the user grabbing the rail always wins over an animation
    clip.addEventListener('touchstart', stopAnim, { passive: true });
    clip.addEventListener('wheel', e => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) stopAnim();
    }, { passive: true });

    // Peek: ease a little to the right and back, so it's clear there's more
    startHint = () => {
      if (!HINT_NUDGE) return;
      try {
        if (sessionStorage.getItem('railHintShown')) return;
        sessionStorage.setItem('railHintShown', '1');
      } catch (e) { /* storage blocked — show it anyway */ }
      const peek = colWidth() * 0.35;
      animateTo(peek, 600, false)
        .then(() => new Promise(r => setTimeout(r, 120)))
        .then(() => clip.scrollLeft >= peek - 1 && animateTo(0, 600));
    };

    clip.addEventListener('scroll', () => {
      const max = maxScroll();
      const p   = max > 0 ? clip.scrollLeft / max : 0;
      // the thumb travels the free part of the track (translate % is of its own width)
      thumb.style.transform = `translateX(${p * (ordered.length / VISIBLE - 1) * 100}%)`;
      if (moreBtn) moreBtn.textContent = p > 0.5 ? '← Back' : 'More →';
      showBar();

      // no hover-expand while moving, so column widths stay even
      portfolio.classList.add('scrolling');
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => portfolio.classList.remove('scrolling'), 150);

      const first = Math.round(clip.scrollLeft / colWidth());
      if (first !== firstShown) {
        firstShown = first;
        railCols.forEach((el, i) => el.classList.toggle('off', i < first || i >= first + VISIBLE));
      }

      // extras play their strip sequence the first time they come into view
      if (!extrasPlayed && clip.scrollLeft > colWidth() * 0.5) {
        extrasPlayed = true;
        railCols.slice(VISIBLE).forEach(el => runSequence(el));
      }
    }, { passive: true });

    if (moreBtn) moreBtn.addEventListener('click', () => {
      if (!ready()) return;
      const atEnd = clip.scrollLeft > maxScroll() / 2;
      animateTo(atEnd ? 0 : maxScroll());
    });

    // Mouse wheel (vertical) → one column per notch; horizontal stays native
    let wheelAcc = 0;
    clip.addEventListener('wheel', e => {
      if (e.ctrlKey || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      if (animFrame) return;
      wheelAcc += e.deltaY;
      if (Math.abs(wheelAcc) < 30) return;
      animateTo((nearestCol() + Math.sign(wheelAcc)) * colWidth());
      wheelAcc = 0;
    }, { passive: false });

    // Drag the bar (or press anywhere on it to jump there)
    function scrollFromPointer(x) {
      const r      = bar.getBoundingClientRect();
      const thumbW = r.width * VISIBLE / ordered.length;
      const p      = Math.min(1, Math.max(0, (x - r.left - thumbW / 2) / (r.width - thumbW)));
      clip.scrollLeft = p * maxScroll();
    }
    bar.addEventListener('pointerdown', e => {
      if (!ready()) return;
      stopAnim();
      dragging = true;
      bar.setPointerCapture(e.pointerId);
      bar.classList.add('dragging');
      clip.style.scrollSnapType = 'none'; // follow the pointer freely, snap on release
      scrollFromPointer(e.clientX);
    });
    bar.addEventListener('pointermove', e => { if (dragging) scrollFromPointer(e.clientX); });
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      bar.classList.remove('dragging');
      animateTo(nearestCol() * colWidth(), 350);
      showBar();
    }
    bar.addEventListener('pointerup', endDrag);
    bar.addEventListener('pointercancel', endDrag);

    // Keyboard: ← →
    document.addEventListener('keydown', e => {
      if (!ready() || animFrame || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
      animateTo((nearestCol() + (e.key === 'ArrowRight' ? 1 : -1)) * colWidth());
    });
  }

  // ── Intro sequence ───────────────────────────────────────────────────────
  const colEls   = railCols.slice(0, VISIBLE);
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
        if (moreBtn)     moreBtn.classList.add('visible');

        // enable hover 1s after intro completes
        setTimeout(() => {
          portfolio.classList.add('hover-ready');
          if (startHint) setTimeout(startHint, 600);
        }, 500);
      }, 950);
    }, SETTLE_DELAY_MS);
  });
})();
