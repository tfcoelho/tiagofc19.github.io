/**
 * Easter egg: click the signature 5 times quickly.
 * The signature unravels like a pulled thread, reels itself into a snake,
 * and you play Snake. Esc (or ×) writes the signature back into place.
 *
 * SIG holds the signature's centre line (traced from the filled outline in
 * index.html by skeletonizing it), in the same 3758×1722 viewBox units.
 */
(function () {
  const SIG = {
    vb: [3758, 1722],
    width: 34.9,
    strokes: [[[1084,939],[1072,920],[1064,914],[994,896],[889,881],[848,878],[773,878],[711,883],[657,891],[617,899],[576,911],[566,918],[558,934],[561,943],[570,951],[615,958],[656,962],[775,963],[1049,955],[1072,952],[1084,943],[1091,942],[1172,949],[1241,952],[1275,956],[1281,960],[1291,975],[1297,979],[1429,1022],[1482,1043],[1581,1084],[1600,1099],[1640,1101],[1674,1130],[1709,1132],[1723,1147],[1750,1164],[1788,1175]],[[1839,1242],[1792,1178],[1796,1164],[1795,1153],[1790,1105],[1785,1084],[1781,1022],[1777,1005],[1784,981],[1780,960],[1780,912],[1787,907],[1839,907],[1863,913],[1939,893],[1948,887],[1961,873]],[[1972,872],[1986,886],[1997,891],[2078,889],[2095,895],[2106,893],[2169,872],[2310,806],[2429,757],[2464,751],[2481,759],[2507,755],[2512,752],[2528,726],[2536,720],[2611,696],[2636,690]],[[2745,664],[2713,695],[2572,807],[2533,807],[2521,800]],[[2512,757],[2519,772],[2519,794],[2516,802],[2497,828],[2487,837],[2475,843],[2449,850],[2444,849],[2442,844],[2448,816],[2457,799],[2464,777],[2476,762]],[[2570,813],[2570,843],[2573,850],[2580,851],[2612,841],[2759,721],[2776,711],[2813,700],[2915,618],[3067,509]],[[3085,631],[3053,639],[3043,644],[2787,839],[2770,850],[2758,855],[2731,860],[2722,857],[2719,849],[2726,821],[2739,802],[2797,740],[2810,705]],[[3136,752],[3127,751],[3097,760],[2988,842],[2957,860],[2922,870],[2917,869],[2924,839],[2930,825],[2984,762],[3073,669],[3086,635],[3091,629],[3262,493],[3341,433],[3395,397]],[[3213,690],[3140,751],[3125,786],[3091,829],[3083,858],[3085,863],[3089,865],[3122,859],[3153,842]],[[3232,885],[3248,881],[3260,875],[3272,867],[3286,852],[3289,844],[3294,817],[3292,810],[3284,806],[3243,816],[3225,826],[3212,838],[3205,856],[3207,872],[3214,881],[3228,884]],[[2364,629],[2376,633],[2397,628],[2413,622],[2677,488],[2687,478],[2693,465],[2692,458],[2684,455],[2657,458],[2593,483],[2530,512],[2457,551],[2388,591],[2374,603],[2364,623],[2356,630],[2198,722],[2145,746],[2104,757],[2100,762],[2089,783],[2079,792],[2039,816],[2005,825]],[[2092,899],[2083,915],[2077,921],[2024,945],[1823,1052],[1788,1063]],[[1782,1088],[1755,1095],[1738,1104],[1723,1114],[1712,1129]],[[1672,1133],[1664,1145],[1655,1153],[1497,1246],[1247,1409],[1218,1417],[1208,1414]],[[1029,1531],[1067,1508],[1203,1414],[1208,1407],[1216,1389],[1223,1382],[1581,1127],[1591,1118],[1598,1103]],[[1642,1098],[1658,1077],[1717,1034],[1743,1018],[1774,1007]],[[1787,975],[1816,965],[1840,948],[1846,940],[1857,916]],[[1782,905],[1781,859],[1802,793],[1808,751],[1807,742],[1801,725],[1787,709],[1773,701],[1750,698],[1736,701],[1720,711],[1698,733],[1678,762],[1668,785],[1666,809],[1670,831],[1676,845],[1684,857],[1696,866],[1706,869],[1723,870],[1778,864]],[[1777,912],[1723,911],[1521,924],[1340,939],[1297,943],[1290,947],[1282,955]],[[1340,842],[1334,824],[1333,806],[1340,739],[1345,724]],[[1298,689],[1270,698],[1240,703],[1198,706],[1128,704]],[[1123,695],[1122,649],[1128,564]],[[1037,704],[1048,733],[1056,743],[1092,783],[1116,795]],[[1157,899],[1136,862],[1119,801],[1123,781],[1123,722],[1125,707],[1123,700],[1118,698],[1066,698],[1034,702],[959,688],[924,689]],[[1354,654],[1367,656]],[[1487,709],[1464,702],[1451,704],[1431,717],[1415,737],[1403,760],[1399,782],[1402,804],[1411,820],[1421,827],[1433,831],[1464,829],[1481,822],[1512,799],[1530,794],[1544,798],[1553,804],[1574,836],[1583,844],[1595,847],[1614,842]],[[1883,765],[1882,800],[1887,821],[1893,832],[1905,840],[1941,850],[1962,869],[1968,870],[1974,866],[1989,849],[2001,830],[1995,795],[1990,779],[1960,745],[1945,735],[1935,734],[1906,744]],[[2069,712],[2071,724],[2076,735],[2100,755]]]
  };

  const sigEl = document.getElementById('signature');
  const svg   = sigEl && sigEl.querySelector('svg');
  if (!svg) return;

  // ── Tunables ───────────────────────────────────────────────
  const CLICKS_NEEDED = 5;
  const CLICK_GAP_MS  = 600;     // max time between clicks
  const ROPE_STEP     = 2;       // px between rope points
  const PULL_MS       = 2600;
  const HANDOFF_MS    = 260;
  const REWIND_MS     = 1900;
  const START_LEN     = 4;       // snake cells at start
  const STEP_MS       = 120;     // ms per move (constant speed)
  const FOOD_MARGIN   = 2;       // empty cells between food and the walls

  // ── Styles ─────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #signature.visible svg { pointer-events: auto; -webkit-user-select: none; user-select: none; -webkit-tap-highlight-color: transparent; }
    #snake-backdrop {
      position: fixed; inset: 0; z-index: 14; opacity: 0;
      background: rgba(0,0,0,0.4);
      backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
      transition: opacity 0.6s ease; touch-action: none;
    }
    body.light #snake-backdrop { background: rgba(244,239,232,0.35); }
    #snake-board {
      position: fixed; z-index: 15; opacity: 0; border-radius: 22px;
      background: var(--glass-bg);
      backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur);
      box-shadow: var(--glass-shadow);
      transform: scale(0.96);
      transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
      pointer-events: none;
    }
    #snake-canvas { position: fixed; inset: 0; z-index: 16; pointer-events: none; }
    #snake-hud {
      position: fixed; left: 50%; z-index: 17; opacity: 0;
      transform: translate(-50%, 6px);
      display: flex; align-items: center; gap: 12px;
      padding: 9px 10px 9px 16px; border-radius: 22px;
      background: var(--glass-bg);
      backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur);
      box-shadow: var(--glass-shadow);
      color: #fff; font-size: 0.63rem; font-weight: 500; letter-spacing: 0.04em;
      white-space: nowrap; transition: opacity 0.4s ease, transform 0.4s ease;
    }
    #snake-hud.on { opacity: 1; transform: translate(-50%, 0); }
    #snake-hud b { font-weight: 700; }
    #snake-hud button {
      background: rgba(255,255,255,0.12); border: none; color: #fff; cursor: pointer;
      width: 22px; height: 22px; border-radius: 50%; font-size: 13px; line-height: 22px; padding: 0;
    }
    #snake-hud button:hover { background: rgba(255,255,255,0.25); }
    body.light #snake-hud { color: #203038; }
    body.light #snake-hud button { background: rgba(0,0,0,0.08); color: #203038; }
    body.light #snake-hud button:hover { background: rgba(0,0,0,0.16); }
  `;
  document.head.appendChild(style);

  // ── Helpers ────────────────────────────────────────────────
  const clamp01 = t => Math.max(0, Math.min(1, t));
  const ease    = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
  const smooth  = (a, b, t) => { t = clamp01((t - a) / (b - a)); return t*t*(3 - 2*t); };
  const lerp    = (a, b, t) => a + (b - a) * t;
  const dist    = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // Resample a polyline to n evenly spaced points
  function resample(pts, n) {
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i-1] + dist(pts[i-1], pts[i]));
    const total = cum[cum.length - 1] || 1;
    const out = [];
    let j = 0;
    for (let k = 0; k < n; k++) {
      const s = total * k / (n - 1);
      while (j < pts.length - 2 && cum[j+1] < s) j++;
      const seg = (cum[j+1] - cum[j]) || 1;
      const t = clamp01((s - cum[j]) / seg);
      out.push({ x: lerp(pts[j].x, pts[j+1].x, t), y: lerp(pts[j].y, pts[j+1].y, t) });
    }
    return out;
  }

  // Signature centre line in screen px, resampled with a pen-up flag per point
  function signatureRope() {
    const r = svg.getBoundingClientRect();
    const s = Math.min(r.width / SIG.vb[0], r.height / SIG.vb[1]);
    const ox = r.left + (r.width  - SIG.vb[0] * s) / 2;
    const oy = r.top  + (r.height - SIG.vb[1] * s) / 2;
    const map = p => ({ x: ox + p[0] * s, y: oy + p[1] * s });

    const segs = []; // {a, b, gap}
    let prev = null;
    for (const stroke of SIG.strokes) {
      const pts = stroke.map(map);
      if (prev) segs.push({ a: prev, b: pts[0], gap: true });
      for (let i = 1; i < pts.length; i++) segs.push({ a: pts[i-1], b: pts[i], gap: false });
      prev = pts[pts.length - 1];
    }
    const pts = [], gap = [];
    for (const sg of segs) {
      const n = Math.max(1, Math.round(dist(sg.a, sg.b) / ROPE_STEP));
      for (let k = 0; k < n; k++) {
        pts.push({ x: lerp(sg.a.x, sg.b.x, k / n), y: lerp(sg.a.y, sg.b.y, k / n) });
        gap.push(sg.gap);
      }
    }
    pts.push({ ...segs[segs.length - 1].b });
    gap.push(false);
    return { pts, gap, width: Math.max(1.2, SIG.width * s) };
  }

  // ── Trigger ────────────────────────────────────────────────
  let clicks = 0, lastClick = 0, active = false;
  svg.addEventListener('click', () => {
    if (active || !sigEl.classList.contains('visible')) return;
    const now = performance.now();
    clicks = now - lastClick < CLICK_GAP_MS ? clicks + 1 : 1;
    lastClick = now;
    if (clicks >= CLICKS_NEEDED) { clicks = 0; start(); }
  });

  // ── Game state ─────────────────────────────────────────────
  let backdrop, board, canvas, ctx, hud, dpr, color, sigRGB, gameRGB, raf;

  // 0 = signature colour, 1 = game colour
  const mixColor = t => `rgb(${sigRGB.map((c, i) => Math.round(lerp(c, gameRGB[i], t))).join(',')})`;
  let phase;            // 'pull' | 'handoff' | 'ready' | 'play' | 'over' | 'rewind'
  let rope, ropeGap, sigWidth, snakeWidth;
  let cell, cols, rows, bx, by;
  let body, prevBody, dir, queue, food, score, best, stepMs, lastStep, overAt;
  let pullFrom, headPath, phaseStart, handoffFrom, rewindFrom, rewindTo;

  const cellCenter = c => ({ x: bx + (c.x + 0.5) * cell, y: by + (c.y + 0.5) * cell });

  function start() {
    active = true;
    // Light mode: the signature's blue-grey is too faint on the frosted board,
    // so the thread darkens to a deep slate as it unravels (and back on rewind).
    sigRGB  = (getComputedStyle(svg).fill.match(/\d+/g) || [255, 255, 255]).slice(0, 3).map(Number);
    gameRGB = document.body.classList.contains('light') ? [32, 48, 56] : sigRGB;
    color   = mixColor(0);

    backdrop = document.createElement('div'); backdrop.id = 'snake-backdrop';
    board    = document.createElement('div'); board.id = 'snake-board';
    canvas   = document.createElement('canvas'); canvas.id = 'snake-canvas';
    hud      = document.createElement('div'); hud.id = 'snake-hud';
    document.body.append(backdrop, board, canvas, hud);
    ctx = canvas.getContext('2d');
    sizeCanvas();
    layoutBoard();

    const sr = signatureRope();
    rope = sr.pts; ropeGap = sr.gap; sigWidth = sr.width;
    snakeWidth = Math.max(3, sigWidth * 2);

    // Head travels from the signature's last point to the start cell, ending
    // with a straight run along the row so the snake arrives moving right.
    const startHead = { x: Math.floor(cols / 2), y: Math.floor(rows / 2) };
    const A = cellCenter({ x: startHead.x - 7, y: startHead.y });
    const B = cellCenter(startHead);
    const H0 = rope[rope.length - 1];
    const curve = [];
    const c1 = { x: H0.x, y: H0.y + 220 }, c2 = { x: A.x - 260, y: A.y };
    for (let i = 0; i <= 60; i++) {
      const t = i / 60, u = 1 - t;
      curve.push({
        x: u*u*u*H0.x + 3*u*u*t*c1.x + 3*u*t*t*c2.x + t*t*t*A.x,
        y: u*u*u*H0.y + 3*u*u*t*c1.y + 3*u*t*t*c2.y + t*t*t*A.y
      });
    }
    curve.push(B);
    headPath = resample(curve, 400);
    pullFrom = rope.map(p => ({ ...p }));

    svg.style.transition = 'opacity 0.15s ease';
    svg.style.opacity = '0';
    requestAnimationFrame(() => backdrop.style.opacity = '1');

    window.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', sizeCanvas);
    backdrop.addEventListener('pointerdown', onPointerDown);
    backdrop.addEventListener('pointermove', onPointerMove);
    backdrop.addEventListener('pointerup', onPointerUp);
    backdrop.addEventListener('pointercancel', onPointerUp);

    best = 0;
    try { best = +localStorage.getItem('snakeBest') || 0; } catch (e) {}

    phase = 'pull';
    phaseStart = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function sizeCanvas() {
    dpr = window.devicePixelRatio || 1;
    canvas.width  = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function layoutBoard() {
    cell = innerWidth < 600 ? 18 : 22;
    cols = Math.min(30, Math.floor((innerWidth - 32) / cell));
    rows = Math.min(18, Math.floor((innerHeight - 200) / cell));
    bx = Math.round((innerWidth - cols * cell) / 2);
    by = Math.round((innerHeight - rows * cell) / 2 + 20);
    Object.assign(board.style, {
      left: bx - 8 + 'px', top: by - 8 + 'px',
      width: cols * cell + 16 + 'px', height: rows * cell + 16 + 'px'
    });
    hud.style.top = by - 62 + 'px';
  }

  // ── Main loop ──────────────────────────────────────────────
  function frame(now) {
    raf = requestAnimationFrame(frame);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    const t = now - phaseStart;

    if (phase === 'pull')    return drawPull(clamp01(t / PULL_MS), now);
    if (phase === 'handoff') return drawHandoff(clamp01(t / HANDOFF_MS), now);
    if (phase === 'rewind')  return drawRewind(clamp01(t / REWIND_MS));

    if (phase === 'play') {
      while (now - lastStep >= stepMs && phase === 'play') { lastStep += stepMs; step(); }
    }
    drawFood(now);
    const frac = phase === 'play' ? clamp01((now - lastStep) / stepMs) : 1;
    let alpha = 1;
    if (phase === 'over') {
      const since = now - overAt;
      alpha = since < 700 ? 0.35 + 0.65 * Math.abs(Math.cos(since / 90)) : 0.5;
    }
    drawSnake(snakePoints(frac), snakeWidth, alpha);
  }

  // Signature → thread → pulled to the board, reeled in to snake length
  function drawPull(t, now) {
    const head = headPath[Math.round(ease(t) * (headPath.length - 1))];
    const n = rope.length;
    const d0 = ROPE_STEP;
    const dEnd = (START_LEN - 1) * cell / (n - 1);
    const d = lerp(d0, dEnd, smooth(0.3, 0.95, t));
    rope[n - 1] = { ...head };
    for (let i = n - 2; i >= 0; i--) {
      const a = rope[i], b = rope[i + 1];
      const L = dist(a, b);
      if (L > d) { const k = d / L; rope[i] = { x: b.x + (a.x - b.x) * k, y: b.y + (a.y - b.y) * k }; }
    }
    const w = lerp(sigWidth, snakeWidth, smooth(0.15, 0.85, t));
    color = mixColor(smooth(0.1, 0.7, t));
    drawRope(rope, w, smooth(0.05, 0.35, t));

    if (t > 0.45 && board.style.opacity !== '1') {
      board.style.opacity = '1'; board.style.transform = 'scale(1)';
    }
    if (t >= 1) {
      resetGame();
      handoffFrom = resample(rope, 80);
      phase = 'handoff'; phaseStart = now;
    }
  }

  function drawHandoff(t, now) {
    const to = resample(snakePoints(1), 80);
    const k = ease(t);
    drawLine(handoffFrom.map((p, i) => ({ x: lerp(p.x, to[i].x, k), y: lerp(p.y, to[i].y, k) })), snakeWidth, 1);
    if (t >= 1) {
      phase = 'ready'; phaseStart = now;
      setHud(`Arrow keys or swipe to play &nbsp;·&nbsp; Best <b>${best}</b>`);
    }
  }

  // Snake → signature written back into place
  function drawRewind(t) {
    const n = rewindTo.length;
    const pts = new Array(n);
    let gapAlpha = 1;
    for (let i = 0; i < n; i++) {
      const s = 0.55 * (i / (n - 1));
      const k = ease(clamp01((t - s) / 0.45));
      pts[i] = { x: lerp(rewindFrom[i].x, rewindTo[i].x, k), y: lerp(rewindFrom[i].y, rewindTo[i].y, k) };
    }
    gapAlpha = 1 - smooth(0.6, 0.95, t);
    color = mixColor(1 - smooth(0.3, 0.9, t));
    drawRope(pts, lerp(snakeWidth, sigWidth, smooth(0.1, 0.8, t)), gapAlpha);
    if (t >= 1) finish();
  }

  // ── Drawing ────────────────────────────────────────────────
  function strokeStyle(w, alpha) {
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
  }

  function drawLine(pts, w, alpha) {
    if (pts.length < 2) return;
    strokeStyle(w, alpha);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Inked parts at full opacity, pen-up links at gapAlpha
  function drawRope(pts, w, gapAlpha) {
    for (const pass of [false, true]) {
      const a = pass ? gapAlpha : 1;
      if (a <= 0.01) continue;
      strokeStyle(w, a);
      ctx.beginPath();
      let pen = false;
      for (let i = 1; i < pts.length; i++) {
        if (ropeGap[i - 1] === pass) {
          if (!pen) { ctx.moveTo(pts[i-1].x, pts[i-1].y); pen = true; }
          ctx.lineTo(pts[i].x, pts[i].y);
        } else pen = false;
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawFood(now) {
    if (!food) return;
    const c = cellCenter(food);
    const r = cell * 0.13 + Math.sin(now / 220) * 0.8;
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Snake path tail→head along the grid: corners stay on cell centres while the
  // head slides into its new cell and the tail slides out of the old one.
  function snakePoints(frac) {
    const at = c => cellCenter(c);
    const last = body.length - 1;
    const tailFrom = at(prevBody[prevBody.length - 1]), tailTo = at(body[last]);
    const headFrom = at(body[1] || body[0]), headTo = at(body[0]);
    const pts = [{ x: lerp(tailFrom.x, tailTo.x, frac), y: lerp(tailFrom.y, tailTo.y, frac) }];
    for (let i = last; i >= 1; i--) pts.push(at(body[i]));
    pts.push({ x: lerp(headFrom.x, headTo.x, frac), y: lerp(headFrom.y, headTo.y, frac) });
    return pts.filter((p, i) => i === 0 || dist(p, pts[i - 1]) > 0.01);
  }

  // Polyline with every corner rounded off
  function drawSnake(pts, w, alpha) {
    if (pts.length < 2) return;
    strokeStyle(w, alpha);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    const n = pts.length;
    for (let i = 1; i < n - 1; i++) {
      // Inner segments are shared by two corners; the end segments belong to one
      const dPrev = dist(pts[i - 1], pts[i]) / (i === 1 ? 1 : 2);
      const dNext = dist(pts[i], pts[i + 1]) / (i === n - 2 ? 1 : 2);
      ctx.arcTo(pts[i].x, pts[i].y, pts[i+1].x, pts[i+1].y, Math.min(cell * 0.5, dPrev, dNext));
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // ── Snake logic (body[0] is the head) ──────────────────────
  function resetGame() {
    const h = { x: Math.floor(cols / 2), y: Math.floor(rows / 2) };
    body = [];
    for (let i = 0; i < START_LEN; i++) body.push({ x: h.x - i, y: h.y });
    prevBody = body.map(c => ({ ...c }));
    dir = { x: 1, y: 0 };
    queue = [];
    score = 0;
    stepMs = STEP_MS;
    placeFood();
  }

  function placeFood() {
    // Keep food at least FOOD_MARGIN cells away from the walls
    const free = [];
    for (let x = FOOD_MARGIN; x < cols - FOOD_MARGIN; x++)
      for (let y = FOOD_MARGIN; y < rows - FOOD_MARGIN; y++)
        if (!body.some(c => c.x === x && c.y === y)) free.push({ x, y });
    food = free[Math.floor(Math.random() * free.length)];
  }

  function step() {
    if (queue.length) dir = queue.shift();
    const head = { x: body[0].x + dir.x, y: body[0].y + dir.y };
    const eats = food && head.x === food.x && head.y === food.y;
    const hitsSelf = body.slice(0, eats ? body.length : body.length - 1)
      .some(c => c.x === head.x && c.y === head.y);
    if (head.x < 0 || head.y < 0 || head.x >= cols || head.y >= rows || hitsSelf) return gameOver();

    prevBody = body.map(c => ({ ...c }));
    body.unshift(head);
    if (eats) {
      score++;
      placeFood();
      setHud(`Score <b>${score}</b> &nbsp;·&nbsp; Best <b>${Math.max(best, score)}</b>`);
    } else {
      body.pop();
    }
  }

  function gameOver() {
    phase = 'over';
    overAt = performance.now();
    prevBody = body.map(c => ({ ...c }));
    if (score > best) {
      best = score;
      try { localStorage.setItem('snakeBest', best); } catch (e) {}
    }
    setHud(`Game over · <b>${score}</b> &nbsp;·&nbsp; Space or tap to retry`);
  }

  function play(d) {
    if (phase === 'over') return;
    if (phase === 'ready') {
      phase = 'play';
      lastStep = performance.now();
      setHud(`Score <b>0</b> &nbsp;·&nbsp; Best <b>${best}</b>`);
    }
    if (phase !== 'play') return;
    const last = queue.length ? queue[queue.length - 1] : dir;
    if (d.x === -last.x && d.y === -last.y) return;
    if (d.x === last.x && d.y === last.y) return;
    if (queue.length < 2) queue.push(d);
  }

  function retry() {
    resetGame();
    phase = 'ready';
    setHud(`Arrow keys or swipe to play &nbsp;·&nbsp; Best <b>${best}</b>`);
  }

  // ── HUD ────────────────────────────────────────────────────
  function setHud(html) {
    hud.innerHTML = `<span>${html}</span><button aria-label="Close">×</button>`;
    hud.querySelector('button').addEventListener('click', exit);
    hud.classList.add('on');
  }

  // ── Input ──────────────────────────────────────────────────
  const KEYS = {
    ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
    w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0]
  };

  function onKey(e) {
    const k = KEYS[e.key] || KEYS[e.key.toLowerCase && e.key.toLowerCase()];
    if (e.key === 'Escape') exit();
    else if (e.key === ' ' && phase === 'over') retry();
    else if (k) play({ x: k[0], y: k[1] });
    else return;
    e.preventDefault();
    e.stopImmediatePropagation();
  }

  // Swipes turn as soon as the finger has moved SWIPE_PX (no waiting for lift-off).
  // The origin then resets, so one continuous gesture can chain several turns.
  const SWIPE_PX = 16;
  let touch = null;
  function onPointerDown(e) { touch = { x: e.clientX, y: e.clientY, swiped: false }; }
  function onPointerMove(e) {
    if (!touch) return;
    const dx = e.clientX - touch.x, dy = e.clientY - touch.y;
    if (Math.hypot(dx, dy) < SWIPE_PX) return;
    play(Math.abs(dx) > Math.abs(dy) ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) });
    touch = { x: e.clientX, y: e.clientY, swiped: true };
  }
  function onPointerUp() {
    if (touch && !touch.swiped && phase === 'over') retry();
    touch = null;
  }

  // ── Exit ───────────────────────────────────────────────────
  function exit() {
    if (!['ready', 'play', 'over'].includes(phase)) return;
    const sr = signatureRope();
    rope = sr.pts; ropeGap = sr.gap; sigWidth = sr.width;
    rewindTo = rope;
    rewindFrom = resample(snakePoints(phase === 'play' ? clamp01((performance.now() - lastStep) / stepMs) : 1), rope.length);
    food = null;
    hud.classList.remove('on');
    board.style.opacity = '0'; board.style.transform = 'scale(0.96)';
    backdrop.style.opacity = '0';
    phase = 'rewind';
    phaseStart = performance.now();
  }

  function finish() {
    cancelAnimationFrame(raf);
    svg.style.opacity = '1';
    canvas.style.transition = 'opacity 0.2s ease';
    canvas.style.opacity = '0';
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('resize', sizeCanvas);
    setTimeout(() => {
      [backdrop, board, canvas, hud].forEach(el => el.remove());
      svg.style.transition = '';
      active = false;
    }, 250);
  }
})();
