(function () {
  'use strict';

  // ── Collection config — set via window.COLLECTION or ?col= ─
  const cfg     = window.COLLECTION || {};
  const params  = new URLSearchParams(location.search);
  const colName = cfg.name || params.get('col');
  const colBase = cfg.base || `collections/${colName}/`;

  const displayName = colName ? colName.replace(/[-_]/g, ' ') : '';

  // ── Restore saved theme early so loader renders correctly ─
  if (localStorage.getItem('theme') === 'light') document.body.classList.add('light');

  // ── Inject shared styles ──────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    /* Loading screen */
    #page-loader {
      position: fixed;
      inset: 0;
      z-index: 200;
      background: #0a0a0a;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0;
      pointer-events: auto;
    }
    #loader-sig {
      width: 140px;
      fill: rgba(255, 255, 255, 0.82);
      opacity: 0;
      transform: translateY(10px);
      will-change: opacity, transform;
    }
    #loader-line {
      width: 0;
      height: 1px;
      background: rgba(255, 255, 255, 0.15);
      will-change: width;
      margin-top: 0 rem;
      align-self: center;
    }
    #loader-name {
      font-size: 0.55rem;
      font-weight: 400;
      letter-spacing: 0.45em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.35);
      opacity: 0;
      transform: translateY(6px);
      will-change: opacity, transform;
      text-indent: 0.45em;
      margin-top: 0.9rem;
    }

    /* Blur placeholder */
    .gallery__item-blur {
      position: absolute;
      inset: -8%;
      background-size: cover;
      background-position: center;
      filter: blur(12px);
      transform: scale(1);
      transition: opacity 0.4s ease;
    }
    .gallery__item img.loaded ~ .gallery__item-blur,
    .gallery__item-blur.hidden {
      opacity: 0;
      pointer-events: none;
    }

    /* Photo scroll-in animation */
    .gallery__item img {
      transform: translateY(22px);
      transition: opacity 0.5s ease, transform 0.5s ease !important;
    }
    .gallery__item img.loaded {
      transform: translateY(0);
    }

    /* Collection switcher */
    #collection-switcher {
      position: fixed;
      top: 3.55rem;
      right: 2rem;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    #collection-title { display: none !important; }
    #switcher-menu {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.55rem;
    }
    #switcher-menu a {
      color: rgba(255,255,255,0.18);
      font-size: 0.5rem;
      font-weight: 400;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      text-decoration: none;
      transition: color 0.2s;
    }
    #switcher-menu a:hover { color: rgba(255,255,255,0.65); }
    #switcher-menu a.current { color: rgba(255,255,255,0.7); pointer-events: none; }

    @media (max-width: 600px) {
      #back-btn { font-weight: 400 !important; color: rgba(255,255,255,0.6) !important; letter-spacing: 0.3em !important; }
    }

    /* ── Theme toggle: show on collection pages ─────────────── */
    #theme-toggle {
      display: flex !important;
      opacity: 1;
    }

    /* ── Light mode overrides for collection pages ─────────── */
    body.light { background: transparent !important; }
    body.light #back-btn { color: rgba(0,0,0,0.5) !important; }
    body.light #back-btn:hover { color: rgba(0,0,0,0.8) !important; }
    body.light #switcher-menu a { color: rgba(0,0,0,0.22); }
    body.light #switcher-menu a:hover { color: rgba(0,0,0,0.65); }
    body.light #switcher-menu a.current { color: rgba(0,0,0,0.75); }
    body.light .gallery__item { background: rgba(0,0,0,0.04); }
    body.light #page-loader { background: #f4efe8; }
    body.light #loader-sig { fill: rgba(0,0,0,0.55) !important; }
    body.light #loader-name { color: rgba(0,0,0,0.35); }
    body.light #loader-line { background: rgba(0,0,0,0.1); }
  `;
  document.head.appendChild(style);

  // ── Build loader overlay ──────────────────────────────────
  const loader = document.createElement('div');
  loader.id = 'page-loader';

  const sigEl = document.getElementById('signature');
  let loaderSig = null;
  if (sigEl) {
    const svg = sigEl.querySelector('svg');
    if (svg) {
      loaderSig = svg.cloneNode(true);
      loaderSig.id = 'loader-sig';
      loaderSig.removeAttribute('aria-label');
      loader.appendChild(loaderSig);
    }
  }

  const loaderName = document.createElement('div');
  loaderName.id = 'loader-name';
  loaderName.textContent = displayName;

  const loaderLine = document.createElement('div');
  loaderLine.id = 'loader-line';

  loader.appendChild(loaderLine);
  loader.appendChild(loaderName);
  document.body.appendChild(loader);

  const startTime = Date.now();

  // Enter: signature fades in and rises
  setTimeout(() => {
    if (loaderSig) {
      loaderSig.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
      loaderSig.style.opacity    = '1';
      loaderSig.style.transform  = 'translateY(0)';
    }
    loaderName.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
    loaderName.style.opacity    = '1';
    loaderName.style.transform  = 'translateY(0)';
  }, 80);

  // Line expands outward
  setTimeout(() => {
    loaderLine.style.transition = 'width 0.7s ease';
    loaderLine.style.width      = '40px';
  }, 350);

  // ── Exit sequence ─────────────────────────────────────────
  function hideLoader() {
    const elapsed   = Date.now() - startTime;
    const remaining = Math.max(0, 900 - elapsed);

    setTimeout(() => {
      // Line retracts
      loaderLine.style.transition = 'width 0.4s ease';
      loaderLine.style.width      = '0';

      // Signature + name drift up and fade out
      if (loaderSig) {
        loaderSig.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        loaderSig.style.opacity    = '0';
        loaderSig.style.transform  = 'translateY(-12px)';
      }
      loaderName.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      loaderName.style.opacity    = '0';
      loaderName.style.transform  = 'translateY(-12px)';

      // Background dissolves slightly after
      setTimeout(() => {
        loader.style.transition = 'opacity 0.55s ease';
        loader.style.opacity    = '0';
        setTimeout(() => loader.remove(), 600);
      }, 280);
    }, remaining);
  }

  // ── Page setup ────────────────────────────────────────────
  const titleEl = document.getElementById('collection-title');

  if (!colName) {
    if (titleEl) titleEl.textContent = 'No collection specified';
    hideLoader();
    return;
  }

  if (titleEl) titleEl.textContent = displayName;
  document.title = displayName + ' — Tiago Coelho';

  // ── Collection switcher ───────────────────────────────────
  const ALL_COLLECTIONS = [
    { name: 'cars',       label: 'Cars' },
    { name: 'nature',     label: 'Nature' },
    { name: 'dirtbikes',  label: 'Dirt Bikes' },
    { name: 'music',      label: 'Music' },
    { name: 'skateboard', label: 'Skateboard' },
    { name: 'trips',      label: 'Trips' },
  ];

  const switcherMenu = document.createElement('div');
  switcherMenu.id = 'switcher-menu';

  ALL_COLLECTIONS.forEach(c => {
    const a = document.createElement('a');
    a.href = `../${c.name}/`;
    a.textContent = c.label;
    if (c.name === colName) a.classList.add('current');
    switcherMenu.appendChild(a);
  });

  const wrapper = document.createElement('div');
  wrapper.id = 'collection-switcher';
  if (titleEl) {
    titleEl.parentNode.insertBefore(wrapper, titleEl);
  } else {
    document.body.appendChild(wrapper);
  }
  wrapper.appendChild(switcherMenu);

  // ── Theme toggle ──────────────────────────────────────────
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('light');
      localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
    });
  }

  // ── Column references and running height accumulators ─────
  const colEls     = [
    document.getElementById('col-0'),
    document.getElementById('col-1'),
    document.getElementById('col-2'),
  ];
  const colHeights = [0, 0, 0];

  // ── All photo src paths for the lightbox ─────────────────
  const photos = [];
  let currentIndex = -1;

  // ── Lazy-load observer ────────────────────────────────────
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      img.src = img.dataset.src;
      img.onload  = () => img.classList.add('loaded');
      img.onerror = () => img.classList.add('loaded');
      observer.unobserve(img);
    });
  }, { rootMargin: '500px 0px' });

  // ── Add one photo to the shortest column ──────────────────
  function addPhoto(src, w, h, index, blur) {
    let shortest = 0;
    for (let i = 1; i < 3; i++) {
      if (colHeights[i] < colHeights[shortest]) shortest = i;
    }
    colHeights[shortest] += h / w;

    const item  = document.createElement('div');
    item.className = 'gallery__item';

    const inner = document.createElement('div');
    inner.className = 'gallery__item-inner';
    inner.style.paddingBottom = ((h / w) * 100).toFixed(4) + '%';

    const img = document.createElement('img');
    img.dataset.src = src;
    img.alt = '';
    img.addEventListener('click', () => openLightbox(index));

    // Blur placeholder — sits behind the image, fades out once loaded
    if (blur) {
      const blurEl = document.createElement('div');
      blurEl.className = 'gallery__item-blur';
      blurEl.style.backgroundImage = `url(${blur})`;
      img.addEventListener('load', () => {
        blurEl.classList.add('hidden');
      }, { once: true });
      inner.appendChild(blurEl);
    }

    inner.appendChild(img);
    item.appendChild(inner);
    colEls[shortest].appendChild(item);
    observer.observe(img);
  }

  // ── Fetch manifest and build the grid ────────────────────
  fetch(`${colBase}manifest.json`)
    .then((r) => {
      if (!r.ok) throw new Error('manifest not found');
      return r.json();
    })
    .then((manifest) => {
      manifest.forEach((entry, i) => {
        const src = `${colBase}${entry.file}`;
        photos.push(src);
        addPhoto(src, entry.w, entry.h, i, entry.blur || '');
      });
      hideLoader();
    })
    .catch(() => {
      if (titleEl) titleEl.textContent = 'Collection not found';
      hideLoader();
    });

  // ── Lightbox ──────────────────────────────────────────────
  const lightbox    = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');

  function openLightbox(index) {
    currentIndex = index;
    lightboxImg.src = photos[index];
    lightbox.classList.add('open');
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
  }

  function prevPhoto() {
    if (currentIndex > 0) openLightbox(currentIndex - 1);
  }

  function nextPhoto() {
    if (currentIndex < photos.length - 1) openLightbox(currentIndex + 1);
  }

  document.querySelector('.lightbox__close').addEventListener('click', closeLightbox);
  document.querySelector('.lightbox__nav--prev').addEventListener('click', prevPhoto);
  document.querySelector('.lightbox__nav--next').addEventListener('click', nextPhoto);

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape')      closeLightbox();
    if (e.key === 'ArrowLeft')   prevPhoto();
    if (e.key === 'ArrowRight')  nextPhoto();
  });
})();
