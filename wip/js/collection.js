(function () {
  'use strict';

  // ── Collection config — set via window.COLLECTION or ?col= ─
  // window.COLLECTION = { name: 'music', base: '../collections/music/' }
  const cfg     = window.COLLECTION || {};
  const params  = new URLSearchParams(location.search);
  const colName = cfg.name || params.get('col');
  const colBase = cfg.base || `collections/${colName}/`;

  const titleEl = document.getElementById('collection-title');

  if (!colName) {
    titleEl.textContent = 'No collection specified';
    return;
  }

  // Display name: replace hyphens/underscores with spaces
  const displayName = colName.replace(/[-_]/g, ' ');
  titleEl.textContent = displayName;
  document.title = displayName + ' — Tiago Coelho';

  // ── Column references and running height accumulators ─────
  const colEls     = [
    document.getElementById('col-0'),
    document.getElementById('col-1'),
    document.getElementById('col-2'),
  ];
  const colHeights = [0, 0, 0]; // sum of (h/w) ratios — used for masonry placement

  // ── All photo src paths, in manifest order, for the lightbox
  const photos = [];
  let currentIndex = -1;

  // ── Lazy-load observer ────────────────────────────────────
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      img.src = img.dataset.src;
      img.onload  = () => img.classList.add('loaded');
      img.onerror = () => img.classList.add('loaded'); // don't block on broken images
      observer.unobserve(img);
    });
  }, { rootMargin: '500px 0px' });

  // ── Add one photo to the shortest column ──────────────────
  function addPhoto(src, w, h, index) {
    // Pick the column with the smallest total height ratio
    let shortest = 0;
    for (let i = 1; i < 3; i++) {
      if (colHeights[i] < colHeights[shortest]) shortest = i;
    }
    colHeights[shortest] += h / w;

    // Outer wrapper (clip + background placeholder colour)
    const item = document.createElement('div');
    item.className = 'gallery__item';

    // Inner div sets the aspect ratio via padding-bottom trick
    const inner = document.createElement('div');
    inner.className = 'gallery__item-inner';
    inner.style.paddingBottom = ((h / w) * 100).toFixed(4) + '%';

    // The image itself — loads lazily via IntersectionObserver
    const img = document.createElement('img');
    img.dataset.src = src;
    img.alt = '';
    img.addEventListener('click', () => openLightbox(index));

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
        addPhoto(src, entry.w, entry.h, i);
      });
    })
    .catch(() => {
      titleEl.textContent = 'Collection not found';
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

  // Close / nav buttons
  document.querySelector('.lightbox__close').addEventListener('click', closeLightbox);
  document.querySelector('.lightbox__nav--prev').addEventListener('click', prevPhoto);
  document.querySelector('.lightbox__nav--next').addEventListener('click', nextPhoto);

  // Click on backdrop to close
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape')      closeLightbox();
    if (e.key === 'ArrowLeft')   prevPhoto();
    if (e.key === 'ArrowRight')  nextPhoto();
  });
})();
