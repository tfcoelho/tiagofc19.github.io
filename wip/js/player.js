/**
 * Music Island Player
 *
 * Add your tracks below. Audio files go in /music/.
 * Each track needs: title, artist, src (audio file), cover (image).
 *
 * Example:
 *   { title: 'Song Name', artist: 'Artist', src: 'music/song.mp3', cover: 'music/cover.jpg' }
 */

const TRACKS = [
  // { title: 'Song Name', artist: 'Artist', src: 'music/song.mp3', cover: 'music/cover.jpg' },
  { title: 'On My Knees', artist: 'RÜFÜS DU SOL', src: 'music/Rufus Du Sol - On My Knees.mp3', cover: 'music/surrender_cover.jpg' },
  { title: 'Inhale', artist: 'RÜFÜS DU SOL', src: 'music/RUFUS DU SOL - Inhale.mp3', cover: 'music/inhale_cover.jpg' },
];

// ── Init ───────────────────────────────────────────────────────────────────
(function () {
  const island = document.getElementById('music-island');

  if (TRACKS.length === 0) {
    island.style.display = 'none';
    return;
  }

  const audio      = document.getElementById('music-audio');
  const artSm      = island.querySelector('.island__art');
  const artLg      = island.querySelector('.island__art-lg');
  const titleSm    = island.querySelector('.island__compact-title');
  const titleLg    = island.querySelector('.island__track-title');
  const artistEl   = island.querySelector('.island__track-artist');
  const seek       = island.querySelector('.island__seek');
  const timeCur    = island.querySelector('.island__time-cur');
  const timeDur    = island.querySelector('.island__time-dur');
  const btnPrev    = island.querySelector('.island__btn-prev');
  const btnPP      = island.querySelector('.island__btn-pp');
  const btnNext    = island.querySelector('.island__btn-next');
  const indicator  = island.querySelector('.island__indicator');
  const compact    = island.querySelector('.island__compact');

  let current = 0;

  function fmt(s) {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  function updateSeekFill() {
    const pct = seek.value + '%';
    seek.style.background =
      `linear-gradient(to right, rgba(255,255,255,0.8) ${pct}, rgba(255,255,255,0.2) ${pct})`;
  }

  function loadTrack(idx) {
    const t = TRACKS[idx];
    audio.src           = t.src;
    artSm.src           = t.cover;
    artLg.src           = t.cover;
    titleSm.textContent = t.title;
    titleLg.textContent = t.title;
    artistEl.textContent = t.artist;
    seek.value          = 0;
    timeCur.textContent = '0:00';
    timeDur.textContent = '0:00';
    updateSeekFill();
  }

  function play()        { audio.play(); island.classList.add('playing'); }
  function pause()       { audio.pause(); island.classList.remove('playing'); }
  function togglePlay()  { audio.paused ? play() : pause(); }

  function prevTrack() {
    const wasPlaying = !audio.paused;
    current = (current - 1 + TRACKS.length) % TRACKS.length;
    loadTrack(current);
    if (wasPlaying) play();
  }

  function nextTrack() {
    const wasPlaying = !audio.paused;
    current = (current + 1) % TRACKS.length;
    loadTrack(current);
    if (wasPlaying) play();
  }

  // ── Interactions ───────────────────────────────────────────────────────

  // Compact: clicking indicator area toggles play; rest of bar expands
  indicator.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePlay();
  });

  compact.addEventListener('click', () => {
    if (!island.classList.contains('expanded')) {
      island.classList.add('expanded');
    }
  });

  // Click outside collapses
  document.addEventListener('click', (e) => {
    if (!island.contains(e.target)) {
      island.classList.remove('expanded');
    }
  });

  btnPP.addEventListener('click',   (e) => { e.stopPropagation(); togglePlay(); });
  btnPrev.addEventListener('click', (e) => { e.stopPropagation(); prevTrack(); });
  btnNext.addEventListener('click', (e) => { e.stopPropagation(); nextTrack(); });

  seek.addEventListener('input', (e) => {
    e.stopPropagation();
    if (audio.duration) {
      audio.currentTime = (seek.value / 100) * audio.duration;
    }
    updateSeekFill();
  });

  // ── Audio events ───────────────────────────────────────────────────────

  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    seek.value = (audio.currentTime / audio.duration) * 100;
    timeCur.textContent = fmt(audio.currentTime);
    updateSeekFill();
  });

  audio.addEventListener('loadedmetadata', () => {
    timeDur.textContent = fmt(audio.duration);
  });

  audio.addEventListener('ended', () => {
    nextTrack();
    play();
  });

  // Load first track on init
  loadTrack(0);
})();
