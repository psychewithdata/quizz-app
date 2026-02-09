import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, RotateCcw, Sparkles } from "lucide-react";
import "./leastToGreatest.css";

type Coord = readonly [number, number];
type LevelDef = {
  id: 1 | 2 | 3 | 4 | 5;
  title: string;
  size: number;
  numbers: Array<number | null>; // row-major, null = blank
  solutionPath: Coord[]; // length = size*size
};

const idxOf = (size: number, r: number, c: number) => r * size + c;
const keyOf = (r: number, c: number) => `${r},${c}`;

const LEVELS: LevelDef[] = [
  {
    id: 1,
    title: "Dễ: Có đủ số",
    size: 3,
    numbers: [
      47, 59, 73,
      54, 56, 78,
      99, 96, 95,
    ],
    solutionPath: [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0, 2],
      [1, 2],
      [2, 2],
      [2, 1],
      [2, 0],
    ],
  },
  {
    id: 2,
    title: "Vừa: Ít số hơn",
    size: 4,
    numbers: (() => {
      const a = Array<number | null>(16).fill(null);
      a[idxOf(4, 0, 0)] = 83;
      a[idxOf(4, 1, 2)] = 12;
      a[idxOf(4, 2, 2)] = 48;
      a[idxOf(4, 3, 0)] = 35;
      a[idxOf(4, 3, 2)] = 71;
      return a;
    })(),
    solutionPath: [
      [1, 2],
      [1, 1],
      [1, 0],
      [2, 0],
      [3, 0],
      [3, 1],
      [2, 1],
      [2, 2],
      [3, 2],
      [3, 3],
      [2, 3],
      [1, 3],
      [0, 3],
      [0, 2],
      [0, 1],
      [0, 0],
    ],
  },
  {
    id: 3,
    title: "Khó: Nhiều ô trống",
    size: 4,
    numbers: (() => {
      const a = Array<number | null>(16).fill(null);
      a[idxOf(4, 0, 0)] = 61;
      a[idxOf(4, 0, 1)] = 38;
      a[idxOf(4, 2, 0)] = 64;
      a[idxOf(4, 2, 3)] = 35;
      a[idxOf(4, 3, 1)] = 63;
      a[idxOf(4, 3, 2)] = 36;
      return a;
    })(),
    solutionPath: [
      [2, 3],
      [3, 3],
      [3, 2],
      [2, 2],
      [1, 2],
      [1, 3],
      [0, 3],
      [0, 2],
      [0, 1],
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1],
      [3, 1],
      [3, 0],
      [2, 0],
    ],
  },
  {
    id: 4,
    title: "Khó hơn: Rẽ nhiều",
    size: 4,
    numbers: (() => {
      const a = Array<number | null>(16).fill(null);
      a[idxOf(4, 0, 0)] = 38;
      a[idxOf(4, 0, 1)] = 18;
      a[idxOf(4, 0, 3)] = 73;
      a[idxOf(4, 1, 1)] = 56;
      a[idxOf(4, 2, 0)] = 93;
      a[idxOf(4, 2, 2)] = 66;
      return a;
    })(),
    solutionPath: [
      [0, 1],
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1],
      [2, 2],
      [1, 2],
      [0, 2],
      [0, 3],
      [1, 3],
      [2, 3],
      [3, 3],
      [3, 2],
      [3, 1],
      [3, 0],
      [2, 0],
    ],
  },
  {
    id: 5,
    title: "Siêu khó: Ít gợi ý",
    size: 4,
    numbers: (() => {
      const a = Array<number | null>(16).fill(null);
      a[idxOf(4, 0, 0)] = 85;
      a[idxOf(4, 2, 0)] = 58;
      a[idxOf(4, 2, 1)] = 45;
      a[idxOf(4, 2, 2)] = 48;
      a[idxOf(4, 2, 3)] = 84;
      return a;
    })(),
    solutionPath: [
      [2, 1],
      [2, 2],
      [1, 2],
      [1, 1],
      [1, 0],
      [2, 0],
      [3, 0],
      [3, 1],
      [3, 2],
      [3, 3],
      [2, 3],
      [1, 3],
      [0, 3],
      [0, 2],
      [0, 1],
      [0, 0],
    ],
  },
];

type Center = { x: number; y: number };

function playSuccessTone() {
  try {
    const ac = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
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

const LeastToGreatestGame = () => {
  const navigate = useNavigate();

  const [levelIndex, setLevelIndex] = useState(0);
  const level = LEVELS[levelIndex];

  const [introOpen, setIntroOpen] = useState(true);
  const [statusText, setStatusText] = useState("Chạm vào số nhỏ nhất để bắt đầu.");
  const [won, setWon] = useState(false);

  const gridRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cellRefs = useRef<Array<HTMLDivElement | null>>([]);
  const centersRef = useRef<Array<Center>>([]);
  const dprRef = useRef(1);

  const draggingRef = useRef(false);
  const wrongRef = useRef(false);
  const visitedRef = useRef<Set<number>>(new Set());
  const stepRef = useRef(0); // index in solutionPath
  const lineRef = useRef<Center[]>([]);
  const nextClueIndexRef = useRef(0);

  const clueValues = useMemo(() => {
    const vals = level.numbers.filter((n): n is number => typeof n === "number");
    vals.sort((a, b) => a - b);
    return vals;
  }, [level.numbers]);

  const clueIndexByCell = useMemo(() => {
    const map = new Map<number, number>();
    const sorted = [...clueValues];
    for (let i = 0; i < level.numbers.length; i++) {
      const n = level.numbers[i];
      if (typeof n === "number") {
        map.set(i, sorted.indexOf(n));
      }
    }
    return map;
  }, [clueValues, level.numbers]);

  const startCell = useMemo(() => {
    const startCoord = level.solutionPath[0];
    return idxOf(level.size, startCoord[0], startCoord[1]);
  }, [level.size, level.solutionPath]);

  const startNumber = useMemo(() => {
    const n = level.numbers[startCell];
    if (typeof n !== "number") return null;
    return n;
  }, [level.numbers, startCell]);

  const resizeAndCenters = useMemo(() => {
    return () => {
      const gridEl = gridRef.current;
      const canvas = canvasRef.current;
      if (!gridEl || !canvas) return;

      const rectGrid = gridEl.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      dprRef.current = dpr;

      canvas.style.width = `${rectGrid.width}px`;
      canvas.style.height = `${rectGrid.height}px`;
      canvas.width = Math.max(1, Math.floor(rectGrid.width * dpr));
      canvas.height = Math.max(1, Math.floor(rectGrid.height * dpr));

      const centers: Center[] = [];
      for (let i = 0; i < level.size * level.size; i++) {
        const el = cellRefs.current[i];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        centers[i] = {
          x: rect.left - rectGrid.left + rect.width / 2,
          y: rect.top - rectGrid.top + rect.height / 2,
        };
      }
      centersRef.current = centers;

      renderLine();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level.size, levelIndex]);

  useLayoutEffect(() => {
    resizeAndCenters();
  }, [resizeAndCenters]);

  useEffect(() => {
    const gridEl = gridRef.current;
    if (!gridEl) return;
    const ro = new ResizeObserver(() => resizeAndCenters());
    ro.observe(gridEl);
    window.addEventListener("resize", resizeAndCenters);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", resizeAndCenters);
    };
  }, [resizeAndCenters]);

  const reset = () => {
    draggingRef.current = false;
    wrongRef.current = false;
    visitedRef.current = new Set();
    stepRef.current = 0;
    lineRef.current = [];
    nextClueIndexRef.current = 0;
    setWon(false);
    setStatusText("Chạm vào số nhỏ nhất để bắt đầu.");
    renderLine();
  };

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelIndex]);

  const renderLine = (points?: Center[], mode: "correct" | "wrong" = "correct", alpha = 1) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = dprRef.current || 1;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    const pts = points ?? lineRef.current;
    if (!pts || pts.length === 0) {
      ctx.restore();
      return;
    }

    ctx.globalAlpha = alpha;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    ctx.lineWidth = Math.max(10, Math.min(w, h) * 0.045);
    ctx.strokeStyle =
      mode === "wrong" ? "rgba(255, 0, 80, 0.85)" : "rgba(30, 144, 255, 0.85)";

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();

    ctx.restore();
  };

  const animateSnapBack = () => {
    const pts = lineRef.current.slice();
    let alpha = 1;
    const tick = () => {
      alpha -= 0.1;
      renderLine(pts, "wrong", Math.max(0, alpha));
      if (alpha <= 0) {
        reset();
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const flashWrong = () => {
    const gridEl = gridRef.current;
    if (!gridEl) return;
    gridEl.classList.remove("ltg-shake");
    // force reflow
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    gridEl.offsetHeight;
    gridEl.classList.add("ltg-shake");
  };

  const posToCell = (clientX: number, clientY: number) => {
    const gridEl = gridRef.current;
    if (!gridEl) return null;
    const rect = gridEl.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    let best: { idx: number; dist: number } | null = null;
    const centers = centersRef.current;
    const thresh = Math.max(20, Math.min(rect.width / level.size, rect.height / level.size) / 2);
    for (let i = 0; i < level.size * level.size; i++) {
      const c = centers[i];
      if (!c) continue;
      const d = Math.hypot(x - c.x, y - c.y);
      if (d <= thresh && (!best || d < best.dist)) best = { idx: i, dist: d };
    }
    return best?.idx ?? null;
  };

  const isAdjacent = (aIdx: number, bIdx: number) => {
    const ar = Math.floor(aIdx / level.size);
    const ac = aIdx % level.size;
    const br = Math.floor(bIdx / level.size);
    const bc = bIdx % level.size;
    const dr = Math.abs(ar - br);
    const dc = Math.abs(ac - bc);
    return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (won) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const hit = posToCell(e.clientX, e.clientY);
    if (hit == null) return;
    if (hit !== startCell) {
      setStatusText("Bắt đầu ở số nhỏ nhất nhé!");
      flashWrong();
      return;
    }

    draggingRef.current = true;
    wrongRef.current = false;
    visitedRef.current = new Set([startCell]);
    stepRef.current = 0;
    lineRef.current = [centersRef.current[startCell]];

    const startN = level.numbers[startCell];
    nextClueIndexRef.current = 0;
    if (typeof startN === "number") {
      if (clueValues[0] === startN) nextClueIndexRef.current = 1;
    }

    setStatusText(startNumber ? `Bắt đầu: ${startNumber}` : "Bắt đầu!");
    renderLine();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const gridEl = gridRef.current;
    if (!gridEl) return;

    const hit = posToCell(e.clientX, e.clientY);
    const rect = gridEl.getBoundingClientRect();
    const pointerPoint: Center = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const pts = lineRef.current.slice();
    pts.push(pointerPoint);
    renderLine(pts, wrongRef.current ? "wrong" : "correct");

    if (hit == null) return;
    if (visitedRef.current.has(hit)) return;

    const lastCoord = level.solutionPath[stepRef.current];
    const lastIdx = idxOf(level.size, lastCoord[0], lastCoord[1]);
    if (!isAdjacent(lastIdx, hit)) return;

    const expectedCoord = level.solutionPath[stepRef.current + 1];
    const expectedIdx = expectedCoord ? idxOf(level.size, expectedCoord[0], expectedCoord[1]) : null;
    if (expectedIdx == null || hit !== expectedIdx) {
      wrongRef.current = true;
      setStatusText("Sai rồi! Thử lại nhé.");
      flashWrong();
      renderLine(undefined, "wrong");
      return;
    }

    const maybeNum = level.numbers[hit];
    if (typeof maybeNum === "number") {
      const expectedNum = clueValues[nextClueIndexRef.current];
      if (expectedNum != null && maybeNum !== expectedNum) {
        wrongRef.current = true;
        setStatusText(`Sai số! Cần tìm: ${expectedNum}`);
        flashWrong();
        renderLine(undefined, "wrong");
        return;
      }
      nextClueIndexRef.current += 1;
    }

    visitedRef.current.add(hit);
    stepRef.current += 1;
    lineRef.current.push(centersRef.current[hit]);

    const target = clueValues[nextClueIndexRef.current] ?? null;
    setStatusText(
      target ? `Tiếp theo: tìm số ${target}` : `Đi tiếp để về đích!`
    );

    renderLine();

    if (visitedRef.current.size === level.size * level.size) {
      setWon(true);
      setStatusText("Hoàn thành!");
      playSuccessTone();
      confetti({
        particleCount: 130,
        spread: 70,
        origin: { y: 0.3 },
      });
    }
  };

  const handlePointerUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (wrongRef.current) {
      animateSnapBack();
    } else {
      renderLine();
    }
  };

  const visitedSetForRender = visitedRef.current;

  const cardTitle = `Complete the least to the greatest — Level ${level.id}/5`;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <Button variant="ghost" onClick={() => navigate("/practice")} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <div className="text-sm text-muted-foreground hidden md:block">{cardTitle}</div>
          <div className="w-[96px]" />
        </div>

        <Card className="relative overflow-hidden border-0 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-200 via-yellow-100 to-sky-200" />

          <div className="absolute -top-10 -left-10 h-44 w-44 rounded-full bg-white/50 blur-2xl ltg-float-1" />
          <div className="absolute top-16 -right-16 h-56 w-56 rounded-full bg-white/40 blur-2xl ltg-float-2" />
          <div className="absolute -bottom-16 left-1/4 h-64 w-64 rounded-full bg-white/35 blur-2xl ltg-float-3" />

          <div className="relative p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/70 border border-white/80 px-3 py-1 text-xs font-bold text-primary shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  {level.title}
                </div>
                <h1 className="mt-2 text-xl sm:text-2xl font-extrabold text-slate-900">
                  {cardTitle}
                </h1>
                <p className="mt-1 text-sm sm:text-base text-slate-700 font-semibold">
                  {statusText}
                </p>
              </div>

              <button
                type="button"
                className="shrink-0 rounded-2xl bg-white/70 border border-white/80 p-2 shadow-sm hover:bg-white/80 transition"
                onClick={() => setIntroOpen(true)}
                aria-label="Xem hướng dẫn"
                title="Hướng dẫn"
              >
                <img
                  src="/least-to-greatest-logo.svg"
                  alt="Logo game"
                  className="h-12 w-12"
                  draggable={false}
                />
              </button>
            </div>

            <div className="mt-4 sm:mt-5">
              <div
                className="relative mx-auto w-fit rounded-3xl bg-white/75 border border-white/80 p-4 shadow-lg select-none touch-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <div
                  ref={gridRef}
                  className="grid gap-2 sm:gap-3"
                  style={{
                    gridTemplateColumns: `repeat(${level.size}, minmax(0, 1fr))`,
                  }}
                >
                  {Array.from({ length: level.size * level.size }).map((_, i) => {
                    const num = level.numbers[i];
                    const isVisited = visitedSetForRender.has(i);
                    const isStart = i === startCell;
                    const showNumber = typeof num === "number";

                    return (
                      <div
                        key={i}
                        ref={(el) => {
                          cellRefs.current[i] = el;
                        }}
                        className={[
                          "ltg-cell",
                          isVisited ? "ltg-cell-visited" : "",
                          isStart ? "ltg-cell-start" : "",
                          showNumber ? "ltg-cell-numbered" : "ltg-cell-blank",
                        ].join(" ")}
                        data-cell={i}
                        aria-label={showNumber ? `Ô số ${num}` : "Ô trống"}
                      >
                        <span className={showNumber ? "ltg-number" : "ltg-number-hidden"}>
                          {showNumber ? num : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <canvas
                  ref={canvasRef}
                  className="absolute left-4 top-4 pointer-events-none"
                  aria-hidden="true"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <Button variant="outline" onClick={reset} className="gap-2 bg-white/70">
                <RotateCcw className="h-4 w-4" />
                Làm lại
              </Button>

              <div className="text-sm text-slate-700 font-semibold text-center sm:text-left">
                Tiến độ: {visitedRef.current.size}/{level.size * level.size}
              </div>

              <Button
                onClick={() => setLevelIndex((v) => Math.min(LEVELS.length - 1, v + 1))}
                disabled={!won || levelIndex === LEVELS.length - 1}
                className="bg-slate-900 hover:bg-slate-900/90"
              >
                Level tiếp theo
              </Button>
            </div>

            <div className="mt-3 text-xs text-slate-700/80 font-medium">
              Luật: đi lên/xuống/trái/phải, mỗi ô chỉ đi 1 lần, và phải ghé các số theo thứ tự từ nhỏ → lớn.
            </div>
          </div>
        </Card>
      </main>

      <AnimatePresence>
        {introOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md rounded-3xl bg-white/95 border border-white shadow-2xl p-5"
              initial={{ scale: 0.96, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.98, y: 10 }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-extrabold text-slate-900">
                    Complete the least to the greatest
                  </div>
                  <div className="text-sm font-semibold text-slate-700">
                    Nối đường đi và ghé các số theo thứ tự.
                  </div>
                </div>
                <img
                  src="/least-to-greatest-logo.svg"
                  alt="Logo game"
                  className="h-12 w-12"
                  draggable={false}
                />
              </div>

              <ul className="mt-4 space-y-2 text-sm text-slate-800 font-medium">
                <li>1) Bắt đầu ở số nhỏ nhất trên bảng.</li>
                <li>2) Kéo để đi qua các ô liền kề (trên/dưới/trái/phải).</li>
                <li>3) Mỗi ô chỉ được ghé đúng 1 lần.</li>
                <li>4) Khi gặp ô có số, phải theo thứ tự từ nhỏ → lớn.</li>
                <li>5) Hoàn thành khi đi hết tất cả ô.</li>
              </ul>

              <div className="mt-4 flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setIntroOpen(false)}>
                  Bắt đầu chơi
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LeastToGreatestGame;

