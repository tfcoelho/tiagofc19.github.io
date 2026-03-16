(function () {
  'use strict';

  // ── Collection config — set via window.COLLECTION or ?col= ─
  const cfg     = window.COLLECTION || {};
  const params  = new URLSearchParams(location.search);
  const colName = cfg.name || params.get('col');
  const colBase = cfg.base || `collections/${colName}/`;

  const displayName = colName ? colName.replace(/[-_]/g, ' ') : '';

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
    #collection-title {
      position: static !important;
    }
    #switcher-menu {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.55rem;
      margin-top: 0.65rem;
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

    @media (max-width: 600px) {
      #collection-title { cursor: pointer; }
      #collection-title::after { content: ' ›'; opacity: 0.5; }
      #collection-title.open::after { content: ' ‹'; }
      #switcher-menu {
        display: none;
        position: fixed;
        inset: 0;
        z-index: 50;
        background: rgba(10,10,10,0.96);
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2rem;
        margin-top: 0;
      }
      #switcher-menu.open { display: flex; }
      #switcher-menu a {
        font-size: 0.72rem;
        letter-spacing: 0.4em;
        color: rgba(255,255,255,0.55);
      }
      #switcher-menu a:hover { color: #fff; }
    }
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

  ALL_COLLECTIONS.filter(c => c.name !== colName).forEach(c => {
    const a = document.createElement('a');
    a.href = `../${c.name}/`;
    a.textContent = c.label;
    switcherMenu.appendChild(a);
  });

  if (titleEl) {
    // Wrap title + menu in a shared fixed container so they align
    const wrapper = document.createElement('div');
    wrapper.id = 'collection-switcher';
    titleEl.parentNode.insertBefore(wrapper, titleEl);
    wrapper.appendChild(titleEl);
    wrapper.appendChild(switcherMenu);

    // Mobile: tap title to toggle overlay
    titleEl.addEventListener('click', () => {
      if (window.innerWidth <= 600) {
        titleEl.classList.toggle('open');
        switcherMenu.classList.toggle('open');
      }
    });

    // Close overlay when tapping the backdrop (not a link)
    switcherMenu.addEventListener('click', e => {
      if (e.target === switcherMenu) {
        titleEl.classList.remove('open');
        switcherMenu.classList.remove('open');
      }
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
