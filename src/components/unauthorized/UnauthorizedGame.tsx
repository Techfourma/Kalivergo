"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { ShieldAlert, Home, Lock, ArrowRight, RotateCcw } from "lucide-react";

/* ============================================================
   Base design width dipakai sebagai referensi skala. Semua ukuran
   pemain/rintangan/koleksi dihitung proporsional terhadap lebar
   game-box yang sebenarnya (responsif), supaya tetap tajam & pas
   tanpa CSS scaling (yang sebelumnya bikin browser nampilin ikon
   expand).
   ============================================================ */
const BASE_W = 480;

type Obstacle = { x: number; width: number; height: number };
type Collectible = {
  x: number;
  y: number;
  size: number;
  type: "book" | "pen";
  collected: boolean;
};
type GameState = "ready" | "playing" | "over";
type Dims = { w: number; h: number };

export default function UnauthorizedGame() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  const [dims, setDims] = useState<Dims>({ w: 480, h: 300 });
  const dimsRef = useRef<Dims>(dims);
  useEffect(() => {
    dimsRef.current = dims;
  }, [dims]);

  const playerY = useRef(0);
  const velocityY = useRef(0);
  const isJumping = useRef(false);
  const legFrame = useRef(0);
  const distance = useRef(0);
  const speed = useRef(0);
  const obstacles = useRef<Obstacle[]>([]);
  const collectibles = useRef<Collectible[]>([]);
  const nextObstacleIn = useRef(50);
  const nextCollectibleIn = useRef(70);
  const scoreRef = useRef(0);

  const [gameState, setGameState] = useState<GameState>("ready");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("kalivergo_dino_highscore");
      if (saved) setHighScore(parseInt(saved, 10) || 0);
    }
  }, []);

  /* -------------------- responsive sizing --------------------
     PENTING: tinggi box TIDAK boleh dihitung dari flex-1 lalu
     di-observe balik oleh ResizeObserver pada elemen yang sama —
     itu bikin loop tak berujung (tinggi mempengaruhi ruang
     tersedia, ruang tersedia mempengaruhi tinggi, dst).
     Solusi: tinggi dihitung deterministik dari window.innerHeight
     dikurangi offset tetap (posisi box dari atas + reserved
     footer), lebar tetap diukur via ResizeObserver (aman, karena
     lebar murni ditentukan CSS container, bukan oleh state kita). */
  const RESERVED_BELOW = 90; // ruang untuk tag "Kalivergo Security Protocol" + footer + padding

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const w = Math.max(280, Math.floor(rect.width));
      const availableH = window.innerHeight - rect.top - RESERVED_BELOW;
      const h = Math.max(240, Math.min(640, Math.floor(availableH)));
      setDims((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    };

    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // sync canvas buffer/style to the measured size (crisp, exact 1:1 — no scaling mismatch)
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = dims.w * dpr;
    canvas.height = dims.h * dpr;
    canvas.style.width = `${dims.w}px`;
    canvas.style.height = `${dims.h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, [dims.w, dims.h]);

  const PLAYER_X_R = 44 / BASE_W;
  const PLAYER_W_R = 20 / BASE_W;
  const PLAYER_H_R = 32 / BASE_W;

  const resetGame = useCallback(() => {
    playerY.current = 0;
    velocityY.current = 0;
    isJumping.current = false;
    legFrame.current = 0;
    distance.current = 0;
    obstacles.current = [];
    collectibles.current = [];
    nextObstacleIn.current = 50;
    nextCollectibleIn.current = 70;
    scoreRef.current = 0;
    setScore(0);
  }, []);

  const startGame = useCallback(() => {
    resetGame();
    setGameState("playing");
  }, [resetGame]);

  const jump = useCallback(() => {
    if (gameState === "ready") {
      startGame();
      return;
    }
    if (gameState === "playing" && !isJumping.current) {
      const scale = dimsRef.current.w / BASE_W;
      velocityY.current = -11.5 * scale;
      isJumping.current = true;
    }
  }, [gameState, startGame]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [jump]);

  const handlePointerDown = () => jump();

  /* -------------------- draw helpers (semua ukuran dihitung dari scale saat itu) -------------------- */
  const drawGround = (ctx: CanvasRenderingContext2D, w: number, groundLineY: number, offset: number) => {
    ctx.strokeStyle = "rgba(148,163,184,0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundLineY);
    ctx.lineTo(w, groundLineY);
    ctx.stroke();

    ctx.strokeStyle = "rgba(148,163,184,0.25)";
    ctx.setLineDash([10, 14]);
    ctx.lineDashOffset = -offset;
    ctx.beginPath();
    ctx.moveTo(0, groundLineY + 5);
    ctx.lineTo(w, groundLineY + 5);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const drawStickman = (
    ctx: CanvasRenderingContext2D,
    x: number,
    baseY: number,
    playerH: number,
    yOffset: number,
    frame: number,
    jumping: boolean,
    scale: number
  ) => {
    const top = baseY - yOffset - playerH;
    const headR = 6 * scale;
    const headCx = x + (10 * scale);
    const headCy = top + headR;

    ctx.strokeStyle = "#f1f5f9";
    ctx.fillStyle = "#f1f5f9";
    ctx.lineWidth = 2 * scale;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.arc(headCx, headCy, headR, 0, Math.PI * 2);
    ctx.stroke();

    // topi toga
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.moveTo(headCx - 10 * scale, headCy - 7 * scale);
    ctx.lineTo(headCx + 10 * scale, headCy - 7 * scale);
    ctx.lineTo(headCx, headCy - 13 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(headCx - 2 * scale, headCy - 9 * scale, 4 * scale, 3 * scale);
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 1.2 * scale;
    ctx.beginPath();
    ctx.moveTo(headCx + 9 * scale, headCy - 8 * scale);
    ctx.lineTo(headCx + 12 * scale, headCy - 2 * scale);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(headCx + 12 * scale, headCy - 1 * scale, 1.3 * scale, 0, Math.PI * 2);
    ctx.fillStyle = "#facc15";
    ctx.fill();

    ctx.strokeStyle = "#f1f5f9";
    ctx.lineWidth = 2 * scale;
    const hipY = headCy + headR + 12 * scale;
    ctx.beginPath();
    ctx.moveTo(headCx, headCy + headR);
    ctx.lineTo(headCx, hipY);
    ctx.stroke();

    const armSwing = jumping ? -0.5 : Math.sin(frame) * 0.9;
    ctx.beginPath();
    ctx.moveTo(headCx, headCy + headR + 4 * scale);
    ctx.lineTo(
      headCx - 8 * scale * Math.cos(armSwing),
      headCy + headR + 4 * scale + 8 * scale * Math.sin(armSwing + 1)
    );
    ctx.moveTo(headCx, headCy + headR + 4 * scale);
    ctx.lineTo(
      headCx + 8 * scale * Math.cos(armSwing),
      headCy + headR + 4 * scale + 8 * scale * Math.sin(-armSwing + 1)
    );
    ctx.stroke();

    ctx.beginPath();
    if (jumping) {
      ctx.moveTo(headCx, hipY);
      ctx.lineTo(headCx - 7 * scale, hipY + 12 * scale);
      ctx.moveTo(headCx, hipY);
      ctx.lineTo(headCx + 5 * scale, hipY + 13 * scale);
    } else {
      const legSwing = Math.sin(frame) * 9 * scale;
      ctx.moveTo(headCx, hipY);
      ctx.lineTo(headCx - legSwing, baseY - yOffset);
      ctx.moveTo(headCx, hipY);
      ctx.lineTo(headCx + legSwing, baseY - yOffset);
    }
    ctx.stroke();
  };

  const drawObstacle = (ctx: CanvasRenderingContext2D, o: Obstacle, groundLineY: number) => {
    const topY = groundLineY - o.height;
    ctx.fillStyle = "#ef4444";
    ctx.strokeStyle = "#fca5a5";
    ctx.lineWidth = 1.2;
    ctx.fillRect(o.x, topY, o.width, o.height);
    ctx.strokeRect(o.x, topY, o.width, o.height);
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
      const ly = topY + (o.height / 3) * i;
      ctx.beginPath();
      ctx.moveTo(o.x + 2, ly);
      ctx.lineTo(o.x + o.width - 2, ly);
      ctx.stroke();
    }
  };

  const drawCollectible = (ctx: CanvasRenderingContext2D, c: Collectible) => {
    if (c.collected) return;
    const { x, y, size } = c;
    if (c.type === "book") {
      ctx.fillStyle = "#38bdf8";
      ctx.strokeStyle = "#e0f2fe";
      ctx.lineWidth = 1.2;
      ctx.fillRect(x, y, size, size * 0.75);
      ctx.strokeRect(x, y, size, size * 0.75);
      ctx.beginPath();
      ctx.moveTo(x + size / 2, y);
      ctx.lineTo(x + size / 2, y + size * 0.75);
      ctx.stroke();
    } else {
      ctx.save();
      ctx.translate(x + size / 2, y + size / 2);
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = "#fbbf24";
      ctx.strokeStyle = "#fff7ed";
      ctx.lineWidth = 1;
      ctx.fillRect(-size / 2, -size / 8, size, size / 4);
      ctx.strokeRect(-size / 2, -size / 8, size, size / 4);
      ctx.beginPath();
      ctx.moveTo(size / 2, -size / 8);
      ctx.lineTo(size / 2 + 5, 0);
      ctx.lineTo(size / 2, size / 8);
      ctx.closePath();
      ctx.fillStyle = "#f97316";
      ctx.fill();
      ctx.restore();
    }
    ctx.strokeStyle = "rgba(250,204,21,0.35)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size * 0.85, 0, Math.PI * 2);
    ctx.stroke();
  };

  const rectsOverlap = (
    ax: number, ay: number, aw: number, ah: number,
    bx: number, by: number, bw: number, bh: number
  ) => ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

  /* -------------------- main loop -------------------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const tick = () => {
      const { w, h } = dimsRef.current;
      const scale = w / BASE_W;
      const groundMargin = 20 * scale;
      const playerW = PLAYER_W_R * BASE_W * scale;
      const playerH = PLAYER_H_R * BASE_W * scale;
      const playerX = PLAYER_X_R * BASE_W * scale;
      const groundLineY = h - groundMargin;
      const baseY = groundLineY;

      ctx.clearRect(0, 0, w, h);

      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "rgba(30,41,59,0.35)");
      grad.addColorStop(1, "rgba(15,23,42,0.15)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      if (gameState === "playing") {
        distance.current += speed.current || BASE_W;
        const baseSpeed = 3.6 * scale;
        const maxSpeed = 7.5 * scale;
        speed.current = Math.min(maxSpeed, baseSpeed + scoreRef.current * 0.0012 * scale);

        velocityY.current += 0.8 * scale;
        playerY.current -= velocityY.current;
        if (playerY.current <= 0) {
          playerY.current = 0;
          velocityY.current = 0;
          isJumping.current = false;
        }
        if (!isJumping.current) legFrame.current += 0.25;

        nextObstacleIn.current -= 1;
        if (nextObstacleIn.current <= 0) {
          const height = (16 + Math.random() * 16) * scale;
          obstacles.current.push({
            x: w + 10,
            width: (12 + Math.random() * 8) * scale,
            height,
          });
          nextObstacleIn.current = 45 + Math.random() * 45 - speed.current * 3;
        }

        nextCollectibleIn.current -= 1;
        if (nextCollectibleIn.current <= 0) {
          collectibles.current.push({
            x: w + 10,
            y: groundLineY - playerH - (45 + Math.random() * 22) * scale,
            size: 13 * scale,
            type: Math.random() > 0.5 ? "book" : "pen",
            collected: false,
          });
          nextCollectibleIn.current = 70 + Math.random() * 55;
        }

        obstacles.current.forEach((o) => (o.x -= speed.current));
        obstacles.current = obstacles.current.filter((o) => o.x + o.width > -5);

        collectibles.current.forEach((c) => (c.x -= speed.current));
        collectibles.current = collectibles.current.filter((c) => c.x > -20 && !c.collected);

        const playerBoxY = groundLineY - playerY.current - playerH;
        for (const o of obstacles.current) {
          const obY = groundLineY - o.height;
          if (
            rectsOverlap(
              playerX + 3 * scale, playerBoxY + 5 * scale, playerW - 6 * scale, playerH - 5 * scale,
              o.x, obY, o.width, o.height
            )
          ) {
            setGameState("over");
            setHighScore((prev) => {
              const finalScore = Math.floor(scoreRef.current);
              const newHigh = Math.max(prev, finalScore);
              if (typeof window !== "undefined") {
                window.localStorage.setItem("kalivergo_dino_highscore", String(newHigh));
              }
              return newHigh;
            });
          }
        }

        for (const c of collectibles.current) {
          if (
            rectsOverlap(
              playerX + 3 * scale, playerBoxY + 5 * scale, playerW - 6 * scale, playerH - 5 * scale,
              c.x, c.y, c.size, c.size
            )
          ) {
            c.collected = true;
            scoreRef.current += 50;
          }
        }

        scoreRef.current += speed.current * 0.05;
        setScore(Math.floor(scoreRef.current));
      }

      drawGround(ctx, w, groundLineY, distance.current);
      obstacles.current.forEach((o) => drawObstacle(ctx, o, groundLineY));
      collectibles.current.forEach((c) => drawCollectible(ctx, c));
      drawStickman(ctx, playerX, baseY, playerH, playerY.current, legFrame.current, isJumping.current, scale);

      ctx.fillStyle = "#e2e8f0";
      ctx.font = `bold ${12 * scale}px monospace`;
      ctx.textAlign = "right";
      ctx.fillText(`SKOR ${String(Math.floor(scoreRef.current)).padStart(5, "0")}`, w - 10, 18 * scale);
      ctx.fillStyle = "#94a3b8";
      ctx.font = `${10 * scale}px monospace`;
      ctx.fillText(`TERBAIK ${String(highScore).padStart(5, "0")}`, w - 10, 32 * scale);
      ctx.textAlign = "left";

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  /* ============================================================
     RENDER — semua teks (badge/judul/deskripsi) ada DI DALAM
     layer game (overlay "ready"), bukan elemen terpisah di luar.
     Game box mengisi lebar konten (tidak ada ruang kosong ekstra).
     ============================================================ */
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div
        ref={wrapperRef}
        className="relative w-full rounded-2xl overflow-hidden border-2 border-dark-300 dark:border-dark-700 bg-dark-900/90 shadow-inner select-none"
        style={{ height: dims.h }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handlePointerDown}
          onTouchStart={(e) => {
            e.preventDefault();
            handlePointerDown();
          }}
          className="block cursor-pointer touch-none"
        />

        {gameState === "ready" && (
          <div
            onClick={handlePointerDown}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-dark-950/75 backdrop-blur-sm cursor-pointer px-6 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm font-semibold tracking-wide uppercase">
              <ShieldAlert className="w-4 h-4" />
              <span>403 Forbidden - Access Denied</span>
            </div>

            <h1 className="text-lg sm:text-2xl font-extrabold text-red-400 leading-tight font-display">
              Maaf, anda tidak di izinkan mengakses laman ini.
            </h1>
            <p className="mt-1 text-[10px] sm:text-xs font-black uppercase text-amber-300 tracking-tighter bg-amber-950/80 px-2.5 py-1 rounded border border-amber-500/40 animate-pulse">
              Klik untuk Memulai permainan
            </p>
          </div>
        )}

        {gameState === "over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-dark-950/85 px-4 text-center">
            <div className="text-[10px] sm:text-xs font-black uppercase text-red-300 tracking-tighter bg-amber-950/80 px-2.5 py-1 rounded border border-amber-500/40">
              Game Over
            </div>
            <p className="text-sm sm:text-base text-gray-200">
              Skor: <span className="font-bold text-black-300">{score}</span>
              {score >= highScore && score > 0 && (
                <span className="ml-1 text-emerald-400 text-xs">(Rekor baru!)</span>
              )}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-2">
              <button
                onClick={startGame}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white text-sm font-semibold shadow-lg shadow-primary-500/25 hover:scale-105 transition-all duration-200"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Lanjutkan</span>
              </button>

              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl border border-dark-300 dark:border-dark-700 bg-dark-100/80 dark:bg-dark-800/70 text-dark-900 dark:text-white text-sm font-semibold hover:scale-105 transition-all duration-200"
              >
                <Home className="w-4 h-4" />
                <span>Masuk ke Kelasku</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}