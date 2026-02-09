import confetti from "canvas-confetti";

/*
Standalone: Complete the least to the greatest
- 5 fixed levels (easy → hard) based on provided 5 boards
- Some levels hide many numbers (blank cells) to increase difficulty
- Validate movement: must follow the unique path (visit every cell exactly once)
- Validate number clues: numbered cells must be visited in ascending order
- Kid-friendly bright UI + logo top-right
*/

const $ = (id) => document.getElementById(id);

const introOverlay = $("introOverlay");
const startBtn = $("startBtn");
const endOverlay = $("endOverlay");
const replayBtn = $("replayBtn");
const viewGameBtn = $("viewGameBtn");
const levelLabel = $("levelLabel");
const goalLabel = $("goalLabel");
const statusLabel = $("statusLabel");
const progressLabel = $("progressLabel");
const boardWrap = $("boardWrap");
const gridEl = $("grid");
const overlay = $("overlay");
const resetBtn = $("resetBtn");
const nextBtn = $("nextBtn");
const helpBtn = $("helpBtn");

let builtOnce = false;

const LEVELS = [
  // Level 1: show all numbers (3x3)
  {
    id: 1,
    size: 3,
    // row-major
    cells: [
      { v: 47, show: true }, { v: 59, show: true }, { v: 73, show: true },
      { v: 54, show: true }, { v: 56, show: true }, { v: 78, show: true },
      { v: 99, show: true }, { v: 96, show: true }, { v: 95, show: true },
    ],
    // path of cell indices (row-major) in ascending order
    path: [0, 3, 4, 1, 2, 5, 8, 7, 6],
  },

  // Level 2: 4x4 (matches the 2nd square on left)
  {
    id: 2,
    size: 4,
    cells: (() => {
      const a = Array.from({ length: 16 }, () => ({ v: null, show: false }));
      const set = (r, c, v) => (a[r * 4 + c] = { v, show: true });
      set(0, 0, 83);
      set(1, 2, 12);
      set(2, 2, 48);
      set(3, 0, 35);
      set(3, 2, 71);
      return a;
    })(),
    path: [
      6, 5, 4, 8,
      12, 13, 9, 10,
      14, 15, 11, 7,
      3, 2, 1, 0,
    ],
  },

  // Level 3: 4x4 (matches the bottom-left square)
  {
    id: 3,
    size: 4,
    cells: (() => {
      const a = Array.from({ length: 16 }, () => ({ v: null, show: false }));
      const set = (r, c, v) => (a[r * 4 + c] = { v, show: true });
      set(0, 0, 61);
      set(0, 3, 38);
      set(2, 0, 64);
      set(2, 3, 35);
      set(3, 1, 63);
      set(3, 2, 36);
      return a;
    })(),
    path: [
      11, 15, 14, 10,
      6, 7, 3, 2,
      1, 0, 4, 5,
      9, 13, 12, 8,
    ],
  },

  // Level 4: 4x4 (matches the top-right square)
  {
    id: 4,
    size: 4,
    cells: (() => {
      const a = Array.from({ length: 16 }, () => ({ v: null, show: false }));
      const set = (r, c, v) => (a[r * 4 + c] = { v, show: true });
      set(0, 0, 38);
      set(0, 1, 18);
      set(0, 3, 73);
      set(1, 1, 56);
      set(2, 0, 93);
      set(2, 2, 66);
      return a;
    })(),
    path: [
      1, 0, 4, 5,
      9, 10, 6, 2,
      3, 7, 11, 15,
      14, 13, 12, 8,
    ],
  },

  // Level 5: 4x4 (matches the bottom-right square)
  {
    id: 5,
    size: 4,
    cells: (() => {
      const a = Array.from({ length: 16 }, () => ({ v: null, show: false }));
      const set = (r, c, v) => (a[r * 4 + c] = { v, show: true });
      set(0, 0, 85);
      set(2, 0, 58);
      set(2, 1, 45);
      set(2, 2, 48);
      set(2, 3, 84);
      return a;
    })(),
    path: [
      9, 10, 6, 5,
      4, 8, 12, 13,
      14, 15, 11, 7,
      3, 2, 1, 0,
    ],
  },
];

let levelIndex = 0;
let dragging = false;
let wrong = false;
let visited = new Set();
let step = 0; // index in LEVEL.path
let linePoints = []; // {x,y} in grid coords
let centers = []; // per cell index: {x,y}
let clueOrder = []; // sorted clue values
let clueNextIdx = 0; // next clue index expected (in clueOrder)

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function playSuccess() {
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.value = 0.0001;
    o.connect(g);
    g.connect(ac.destination);
    const now = ac.currentTime;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.16, now + 0.02);
    o.start(now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
    o.stop(now + 0.65);
  } catch {
    // ignore
  }
}

function setText(el, text) {
  el.textContent = text;
}

function buildLevel() {
  const lv = LEVELS[levelIndex];
  const size = lv.size;

  // compute a nice cell size so the grid is centered and compact
  const vw = window.innerWidth || 900;
  const vh = window.innerHeight || 700;
  const maxBoard = Math.min(vw - 72, vh - 220, 560);
  const cell = Math.floor(clamp((maxBoard - (size - 1) * 8) / size, 54, 86));
  document.documentElement.style.setProperty("--cell", `${cell}px`);
  document.documentElement.style.setProperty("--gap", `${Math.max(6, Math.floor(cell * 0.12))}px`);

  // layout grid
  gridEl.style.gridTemplateColumns = `repeat(${size}, var(--cell))`;
  gridEl.style.gridTemplateRows = `repeat(${size}, var(--cell))`;

  // build cells
  gridEl.innerHTML = "";
  const frag = document.createDocumentFragment();
  for (let i = 0; i < size * size; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.idx = String(i);
    const { v, show } = lv.cells[i];
    if (!show) cell.classList.add("blank");
    const span = document.createElement("span");
    span.className = `num ${show ? "" : "hidden"}`.trim();
    span.textContent = show && v != null ? String(v) : "";
    cell.appendChild(span);
    frag.appendChild(cell);
  }
  gridEl.appendChild(frag);

  // compute clue order
  clueOrder = lv.cells
    .filter((c) => c.show && typeof c.v === "number")
    .map((c) => c.v)
    .sort((a, b) => a - b);

  const startCell = lv.path[0];
  const startVal = lv.cells[startCell].v ?? clueOrder[0];

  setText(levelLabel, `Level ${lv.id}/5`);
  setText(goalLabel, `Connect numbers from ${Math.min(...clueOrder)} to ${Math.max(...clueOrder)}`);
  setText(statusLabel, `Tap the smallest number to start.`);

  nextBtn.classList.add("hidden");
  closeEnd();
  resetState();

  requestAnimationFrame(() => {
    updateOverlayAndCenters();
    renderLine();
  });

  builtOnce = true;
}

function closeIntro({ shouldBuild } = { shouldBuild: false }) {
  introOverlay.classList.add("hidden");
  document.body.classList.remove("modal-open");
  if (shouldBuild && !builtOnce) buildLevel();
}

function openIntro() {
  introOverlay.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function openEnd() {
  endOverlay?.classList.remove("hidden");
}

function closeEnd() {
  endOverlay?.classList.add("hidden");
}

function resetState() {
  dragging = false;
  wrong = false;
  visited = new Set();
  step = 0;
  linePoints = [];
  clueNextIdx = 0;
  renderLine();
  updateVisitedClasses();

  const lv = LEVELS[levelIndex];
  const total = lv.size * lv.size;
  setText(progressLabel, `0/${total}`);
}

function updateVisitedClasses() {
  const cells = gridEl.querySelectorAll(".cell");
  for (const el of cells) {
    const idx = Number(el.dataset.idx);
    if (visited.has(idx)) el.classList.add("visited");
    else el.classList.remove("visited");
  }
}

function updateOverlayAndCenters() {
  const rectGrid = gridEl.getBoundingClientRect();
  const rectWrap = boardWrap.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  overlay.width = Math.max(1, Math.floor(rectGrid.width * dpr));
  overlay.height = Math.max(1, Math.floor(rectGrid.height * dpr));
  overlay.style.width = `${rectGrid.width}px`;
  overlay.style.height = `${rectGrid.height}px`;
  overlay.style.left = `${rectGrid.left - rectWrap.left}px`;
  overlay.style.top = `${rectGrid.top - rectWrap.top}px`;

  const cells = gridEl.querySelectorAll(".cell");
  centers = [];
  for (const el of cells) {
    const idx = Number(el.dataset.idx);
    const rect = el.getBoundingClientRect();
    centers[idx] = {
      x: rect.left - rectGrid.left + rect.width / 2,
      y: rect.top - rectGrid.top + rect.height / 2,
    };
  }
}

function drawPath(points, mode = "ok", alpha = 1) {
  const ctx = overlay.getContext("2d");
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, overlay.width / dpr, overlay.height / dpr);
  if (!points || points.length === 0) {
    ctx.restore();
    return;
  }
  ctx.globalAlpha = alpha;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const w = overlay.width / dpr;
  const h = overlay.height / dpr;
  ctx.lineWidth = Math.max(10, Math.min(w, h) * 0.045);
  ctx.strokeStyle = mode === "bad" ? getComputedStyle(document.documentElement).getPropertyValue("--bad") : getComputedStyle(document.documentElement).getPropertyValue("--ok");
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();
  ctx.restore();
}

function renderLine(givenPoints = null, mode = null) {
  const pts = givenPoints || linePoints;
  drawPath(pts, mode || (wrong ? "bad" : "ok"), 1);
}

function animateSnapBack() {
  const pts = linePoints.slice();
  let alpha = 1;
  const tick = () => {
    alpha -= 0.1;
    drawPath(pts, "bad", clamp(alpha, 0, 1));
    if (alpha <= 0) {
      resetState();
      const lv = LEVELS[levelIndex];
      const startVal = lv.cells[lv.path[0]].v ?? clueOrder[0];
      setText(statusLabel, `Tap ${startVal} to start.`);
      return;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function flashWrong() {
  boardWrap.classList.remove("shake");
  // force reflow
  void boardWrap.offsetHeight;
  boardWrap.classList.add("shake");
}

function posToCell(clientX, clientY) {
  const rect = gridEl.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const lv = LEVELS[levelIndex];
  const thresh = Math.max(20, Math.min(rect.width / lv.size, rect.height / lv.size) / 2);

  let bestIdx = null;
  let bestDist = Infinity;
  for (let i = 0; i < lv.size * lv.size; i++) {
    const c = centers[i];
    if (!c) continue;
    const d = Math.hypot(x - c.x, y - c.y);
    if (d <= thresh && d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  return bestIdx;
}

function getPointerXY(e) {
  if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  return { x: e.clientX, y: e.clientY };
}

function onDown(e) {
  e.preventDefault();
  const lv = LEVELS[levelIndex];
  updateOverlayAndCenters();

  const p = getPointerXY(e);
  const hit = posToCell(p.x, p.y);
  if (hit == null) return;

  const start = lv.path[0];
  const startVal = lv.cells[start].v ?? clueOrder[0];
  if (hit !== start) {
    setText(statusLabel, `Tap ${startVal} to start.`);
    flashWrong();
    wrong = true;
    renderLine(null, "bad");
    return;
  }

  dragging = true;
  wrong = false;
  visited = new Set([start]);
  step = 0;
  linePoints = [centers[start]];

  // advance clue index if start is a clue
  const startCell = lv.cells[start];
  clueNextIdx = 0;
  if (startCell.show && typeof startCell.v === "number" && clueOrder[0] === startCell.v) clueNextIdx = 1;

  const nextClue = clueOrder[clueNextIdx];
  setText(statusLabel, nextClue != null ? `Next: ${nextClue}` : `Go!`);
  setText(progressLabel, `${visited.size}/${lv.size * lv.size}`);
  nextBtn.classList.add("hidden");
  updateVisitedClasses();
  renderLine();
}

function onMove(e) {
  if (!dragging) return;
  e.preventDefault();
  const lv = LEVELS[levelIndex];

  const p = getPointerXY(e);
  const hit = posToCell(p.x, p.y);

  // draw to pointer
  const rect = gridEl.getBoundingClientRect();
  const pointerPt = { x: p.x - rect.left, y: p.y - rect.top };
  const pts = linePoints.slice();
  pts.push(pointerPt);
  renderLine(pts, wrong ? "bad" : "ok");

  if (hit == null) return;
  if (visited.has(hit)) return;

  const expectedIdx = lv.path[step + 1];
  if (expectedIdx == null) return;

  if (hit !== expectedIdx) {
    wrong = true;
    setText(statusLabel, "Oops! Try again.");
    flashWrong();
    renderLine(null, "bad");
    return;
  }

  // number clue validation: if this cell shows a number, it must be the next clue
  const cell = lv.cells[hit];
  if (cell.show && typeof cell.v === "number") {
    const expectedClue = clueOrder[clueNextIdx];
    if (expectedClue != null && cell.v !== expectedClue) {
      wrong = true;
      setText(statusLabel, `Wrong number! Need: ${expectedClue}`);
      flashWrong();
      renderLine(null, "bad");
      return;
    }
    clueNextIdx += 1;
  }

  // accept step
  step += 1;
  visited.add(hit);
  linePoints.push(centers[hit]);
  updateVisitedClasses();

  const total = lv.size * lv.size;
  setText(progressLabel, `${visited.size}/${total}`);

  const nextClue = clueOrder[clueNextIdx];
  if (nextClue != null) setText(statusLabel, `Next: ${nextClue}`);
  else setText(statusLabel, "Almost there!");

  wrong = false;
  renderLine();

  if (visited.size === total) {
    setText(statusLabel, "Complete!");
    playSuccess();
    confetti({ particleCount: 130, spread: 70, origin: { y: 0.3 } });
    if (levelIndex >= LEVELS.length - 1) {
      nextBtn.classList.add("hidden");
      openEnd();
    } else {
      nextBtn.classList.remove("hidden");
    }
  }
}

function onUp() {
  if (!dragging) return;
  dragging = false;
  if (wrong) {
    animateSnapBack();
  } else {
    renderLine();
  }
}

resetBtn.addEventListener("click", () => {
  resetState();
  const lv = LEVELS[levelIndex];
  const startVal = lv.cells[lv.path[0]].v ?? clueOrder[0];
  setText(statusLabel, `Tap ${startVal} to start.`);
});

nextBtn.addEventListener("click", () => {
  levelIndex = Math.min(LEVELS.length - 1, levelIndex + 1);
  buildLevel();
});

startBtn.addEventListener("click", () => {
  closeIntro({ shouldBuild: true });
});

helpBtn?.addEventListener("click", () => {
  openIntro();
});

viewGameBtn?.addEventListener("click", () => {
  closeEnd();
});

replayBtn?.addEventListener("click", () => {
  closeEnd();
  levelIndex = 0;
  buildLevel();
});

boardWrap.addEventListener("mousedown", onDown);
boardWrap.addEventListener("touchstart", onDown, { passive: false });
window.addEventListener("mousemove", onMove);
window.addEventListener("touchmove", onMove, { passive: false });
window.addEventListener("mouseup", onUp);
window.addEventListener("touchend", onUp);
window.addEventListener("touchcancel", onUp);

// ensure overlay resizes
window.addEventListener("resize", () => {
  updateOverlayAndCenters();
  renderLine();
});

// initial (wait for Start)
setText(levelLabel, "Level 1/5");
setText(goalLabel, "Connect numbers from least to greatest");
setText(statusLabel, "Tap the smallest number to start.");

