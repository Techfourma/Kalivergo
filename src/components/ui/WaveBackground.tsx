"use client";

import { useEffect, useRef } from "react";

export default function WaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const lastDrawTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = (canvas.width = window.innerWidth * dpr);
    let height = (canvas.height = window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    ctx.scale(dpr, dpr);

    type Strand = {
      baseY: number;
      amplitude: number;
      frequency: number;
      phase: number;
      speed: number;
      lineWidth: number;
      opacity: number;
      hue: number;
    };

    const isMobile = window.innerWidth < 768;
    const strandCount = isMobile ? 3 : 5;
    let strands: Strand[] = [];

    const initStrands = () => {
      const currentDpr = Math.min(window.devicePixelRatio || 1, 2);
      const currentWidth = window.innerWidth;
      const currentHeight = window.innerHeight;

      canvas.width = currentWidth * currentDpr;
      canvas.height = currentHeight * currentDpr;
      canvas.style.width = `${currentWidth}px`;
      canvas.style.height = `${currentHeight}px`;

      ctx.scale(currentDpr, currentDpr);
      width = currentWidth;
      height = currentHeight;

      strands = Array.from({ length: strandCount }).map((_, i) => {
        const spacing = height / (strandCount + 1);
        return {
          baseY: spacing * (i + 1),
          amplitude: height * 0.08,
          frequency: 0.6 + Math.random() * 0.2,
          phase: Math.random() * Math.PI * 2,
          speed: 0.08 + Math.random() * 0.06,
          lineWidth: isMobile ? 1.5 : 2.5 + Math.random() * 1,
          opacity: isMobile ? 0.3 : 0.4 + Math.random() * 0.2,
          hue: 250 + Math.random() * 30,
        };
      });
    };

    initStrands();

    let time = 0;

    const drawStrand = (strand: Strand) => {
      const { baseY, amplitude, frequency, phase, lineWidth, opacity, hue } = strand;

      ctx.beginPath();
      const step = isMobile ? 20 : 8;
      const points: { x: number; y: number }[] = [];

      for (let x = -50; x <= width + 50; x += step) {
        const progress = x / width;
        const y = baseY + Math.sin(progress * Math.PI * 2 * frequency + phase + time) * amplitude;
        points.push({ x, y });
      }

      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, `hsla(${hue}, 75%, 65%, 0)`);
      gradient.addColorStop(0.1, `hsla(${hue}, 75%, 65%, ${opacity * 0.6})`);
      gradient.addColorStop(0.5, `hsla(${hue}, 80%, 70%, ${opacity})`);
      gradient.addColorStop(0.9, `hsla(${hue}, 75%, 65%, ${opacity * 0.6})`);
      gradient.addColorStop(1, `hsla(${hue}, 75%, 65%, 0)`);

      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        const midX = (points[i - 1].x + points[i].x) / 2;
        const midY = (points[i - 1].y + points[i].y) / 2;
        ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, midX, midY);
      }

      ctx.strokeStyle = gradient;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      if (!isMobile) {
        ctx.shadowColor = `hsla(${hue}, 80%, 60%, 0.4)`;
        ctx.shadowBlur = 8;
      }
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        const midX = (points[i - 1].x + points[i].x) / 2;
        const midY = (points[i - 1].y + points[i].y) / 2;
        ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, midX, midY);
      }

      ctx.lineWidth = lineWidth * 0.3;
      ctx.shadowBlur = 0;
      ctx.strokeStyle = `hsla(${hue}, 85%, 75%, ${opacity * 1.2})`;
      ctx.stroke();
    };

    const draw = (timestamp: number) => {
      const targetFPS = isMobile ? 30 : 60;
      const frameDelay = 1000 / targetFPS;

      if (timestamp - lastDrawTimeRef.current < frameDelay) {
        animationFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      lastDrawTimeRef.current = timestamp;

      ctx.clearRect(0, 0, width, height);

      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, "#0a0a14");
      bgGradient.addColorStop(1, "#07070f");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      strands.forEach(drawStrand);

      ctx.shadowBlur = 0;
      time += 0.004;
      strands.forEach((s) => {
        s.phase += s.speed * 0.008;
      });

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    animationFrameRef.current = requestAnimationFrame(draw);

    const handleResize = () => {
      initStrands();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: "#050505", display: "block" }}
    />
  );
}