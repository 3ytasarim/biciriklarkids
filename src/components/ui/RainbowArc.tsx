"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/*
 * Gökkuşağı yayı + parıltılar (canvas). Bantlar içten dışa sırayla çizilir, ardından yay üzerinde
 * sürekli parıltı belirir. Yalnız görünürken çalışır; reduced-motion'da tek kare, parıltısız çizilir.
 *
 * Çizim tekniği şu çalışmadan uyarlanmıştır (MIT):
 * Rainbow Animation (RAF + Responsive) — Copyright (c) shalanah — https://codepen.io/shalanah/pen/ymRpPd
 */

const COLORS: [string, string][] = [
  ["#EC008C", "#f957b6"],
  ["#EF4136", "#ff7972"],
  ["#ffe14d", "#ffffff"],
  ["#5be35b", "#a6ffa6"],
  ["#27AAE1", "#5ec8f2"],
  ["#7b3fb0", "#b47ae6"],
];
const TAU = Math.PI * 2;
const START = Math.PI;
const FINISH = 0.5;
const INC = 0.007;
const STAGGER = 0.05;
const SPARKLES_IN = 3;
const DONE = FINISH + STAGGER * COLORS.length;

type Sparkle = { x: number; y: number; opacity: number; color: string; rad: number };

const clamp = (min: number, max: number, v: number) => Math.min(Math.max(min, v), max);
const coin = () => Math.random() < 0.5;
const jitter = (w: number) => (coin() ? -1 : 1) * Math.random() * w;

export function RainbowArc({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let sparkles: Sparkle[] = [];
    let percent = 0;
    let sparkleBase = 15;
    let raf = 0;
    let visible = false;

    const size = () => {
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      sparkleBase = clamp(4, 14, r.width / 90);
      if (reduced) draw(DONE, false);
    };

    const sparkleAt = (cx: number, cy: number, rx: number, ry: number, angle: number, lw: number, color: string): Sparkle => ({
      x: cx + rx * Math.cos(angle) + jitter(lw),
      y: cy + ry * Math.sin(angle) + jitter(lw),
      opacity: 1,
      color,
      rad: Math.max(sparkleBase * Math.random() * dpr, 6 * dpr),
    });

    function draw(p: number, withSparkles: boolean) {
      const w = canvas!.width;
      const h = canvas!.height;
      const lw = (h * 0.5) / COLORS.length;
      const cx = w / 2;
      const startCy = h + lw * 0.5 + (h - COLORS.length * lw) / 3;
      const startRx = w / 2 + COLORS.length * lw * 2;
      const startRy = h;
      const doneIn = p >= DONE;

      ctx!.clearRect(0, 0, w, h);
      ctx!.globalAlpha = 1;
      ctx!.lineWidth = lw;
      ctx!.lineCap = "round";

      for (let i = COLORS.length - 1; i >= 0; i--) {
        const [line, spark] = COLORS[i]!;
        const cy = startCy + i * (lw / 2 - 1);
        const rx = startRx - (i * lw) / 2;
        const ry = startRy - (i * lw) / 2;
        const end = TAU * (p - i * STAGGER) + START;
        const angle = clamp(START, TAU * FINISH + START, end);

        ctx!.beginPath();
        ctx!.strokeStyle = line;
        ctx!.ellipse(cx, cy, rx, ry, 0, START, angle, false);
        ctx!.stroke();

        if (!withSparkles) continue;
        if (!doneIn) {
          for (let j = 0; j < SPARKLES_IN; j++) sparkles.push(sparkleAt(cx, cy, rx, ry, angle, lw, line));
        } else {
          sparkles.push(sparkleAt(cx, cy, rx, ry, Math.random() * Math.PI + Math.PI, lw, coin() ? "#fff" : spark));
        }
      }

      if (!withSparkles) return;
      const next: Sparkle[] = [];
      for (const s of sparkles) {
        const { x, y, rad } = s;
        ctx!.beginPath();
        ctx!.globalAlpha = s.opacity;
        ctx!.fillStyle = s.color;
        // dört içbükey yaydan oluşan yıldız
        ctx!.arc(x - rad, y - rad, rad, 0, Math.PI / 2);
        ctx!.arc(x - rad, y + rad, rad, (3 * Math.PI) / 2, TAU);
        ctx!.arc(x + rad, y + rad, rad, Math.PI, (3 * Math.PI) / 2);
        ctx!.arc(x + rad, y - rad, rad, Math.PI / 2, Math.PI);
        ctx!.fill();
        if (s.opacity > 0.2 && rad > 0.2) next.push({ ...s, opacity: s.opacity - 0.03, rad: rad - 0.2 });
      }
      sparkles = next;
    }

    const tick = () => {
      draw(percent, true);
      percent = Math.min(percent + INC, DONE);
      raf = visible ? requestAnimationFrame(tick) : 0;
    };

    size();
    const ro = new ResizeObserver(size);
    ro.observe(canvas);

    let io: IntersectionObserver | null = null;
    if (!reduced) {
      io = new IntersectionObserver(([e]) => {
        visible = !!e?.isIntersecting;
        if (visible && !raf) raf = requestAnimationFrame(tick);
      });
      io.observe(canvas);
    }

    return () => {
      ro.disconnect();
      io?.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className={cn("pointer-events-none block h-full w-full", className)} />;
}
