'use client';

import { useEffect, useRef } from 'react';

interface Props {
  /** Cambia este valor (p.ej. un contador) para disparar la animación. */
  trigger: number;
}

const COLORS = ['#7a9670', '#c5d9bf', '#e8c07a', '#d98c6a', '#9bb3d4', '#f4f0ea'];

/** Confeti ligero en canvas, sin dependencias. */
export default function Celebration({ trigger }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!trigger) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const N = 120;
    const parts = Array.from({ length: N }, () => ({
      x: W / 2 + (Math.random() - 0.5) * 80,
      y: H / 3,
      vx: (Math.random() - 0.5) * 14,
      vy: Math.random() * -12 - 4,
      size: Math.random() * 8 + 4,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - 0.5) * 0.3,
      life: 1,
    }));

    let raf = 0;
    const gravity = 0.35;
    function frame() {
      ctx!.clearRect(0, 0, W, H);
      let alive = false;
      for (const p of parts) {
        p.vy += gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.99;
        p.rot += p.vrot;
        p.life -= 0.012;
        if (p.life > 0 && p.y < H + 20) {
          alive = true;
          ctx!.save();
          ctx!.globalAlpha = Math.max(0, p.life);
          ctx!.translate(p.x, p.y);
          ctx!.rotate(p.rot);
          ctx!.fillStyle = p.color;
          ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx!.restore();
        }
      }
      if (alive) raf = requestAnimationFrame(frame);
      else ctx!.clearRect(0, 0, W, H);
    }
    frame();

    return () => cancelAnimationFrame(raf);
  }, [trigger]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[100]"
      style={{ width: '100vw', height: '100vh' }}
      aria-hidden="true"
    />
  );
}
