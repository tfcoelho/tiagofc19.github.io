/**
 * Page transition overlay
 *
 * Intercepts internal navigation, fades screen to black, then navigates.
 * Collection pages open with #page-loader already black → seamless handoff.
 * Audio gap is hidden inside the dark transition.
 */
(function () {
  const overlay = document.createElement('div');
  overlay.id = 'nav-overlay';
  overlay.style.cssText = [
    'position:fixed',
    'inset:0',
    'background:#0a0a0a',
    'opacity:0',
    'z-index:999',
    'pointer-events:none',
    'transition:opacity 0.3s ease',
  ].join(';');
  document.body.appendChild(overlay);

  function fadeAudio(audio, targetVol, durationMs) {
    if (!audio) return;
    const startVol = audio.volume;
    const diff     = targetVol - startVol;
    const steps    = 20;
    const interval = durationMs / steps;
    let step = 0;
    const id = setInterval(() => {
      step++;
      audio.volume = Math.min(1, Math.max(0, startVol + diff * (step / steps)));
      if (step >= steps) clearInterval(id);
    }, interval);
  }

  function navigateTo(href) {
    overlay.style.pointerEvents = 'auto';

    // Fade audio out over the same duration as the overlay
    const audio = document.getElementById('music-audio');
    fadeAudio(audio, 0, 300);

    // Fade overlay to black, then navigate
    requestAnimationFrame(() => requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      setTimeout(() => { window.location.href = href; }, 310);
    }));
  }

  // Intercept <a> clicks for same-origin relative links
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || /^(https?:|\/\/|#|mailto:|tel:)/.test(href)) return;
    e.preventDefault();
    navigateTo(href);
  });

  // Expose for programmatic navigation (e.g. column clicks in intro.js)
  window.navigateTo = navigateTo;
})();
