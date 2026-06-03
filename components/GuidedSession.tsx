'use client';

import { useState, useRef, useEffect } from 'react';
import { getGuidedEmbedUrl, isVerticalEmbed } from '@/lib/videoUtils';
import type { Fase, VideoType } from '@/types';

const FASE_COLOR: Record<Fase, string> = {
  Calentamiento: '#d99a6c',
  Normal: '#7a9670',
  Enfriamiento: '#6c93b3',
};

export interface PlayItem {
  id: string;
  nombre: string;
  tipo: VideoType;
  url: string;
  fase?: Fase;
  notas?: string;
}

interface Props {
  titulo: string;
  subtitulo?: string;
  thumbnail: string | null;
  duracionMin?: number;
  notas?: string;
  items: PlayItem[];
  done: boolean;
  onComplete: () => void;
  onBack: () => void;
}

type Phase = 'intro' | 'countdown' | 'playing' | 'finished';

export default function GuidedSession({
  titulo,
  subtitulo,
  thumbnail,
  duracionMin,
  notas,
  items,
  done,
  onComplete,
  onBack,
}: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState(3);
  const [muted, setMuted] = useState(true);
  const [landscape, setLandscape] = useState(false);

  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const total = items.length;
  const item = items[index];
  const isFirst = index === 0;
  const isLast = index === total - 1;
  const multi = total > 1;

  function clearTimer() {
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
  }
  useEffect(() => () => clearTimer(), []);

  // Bloquea el scroll del fondo durante el overlay (todo menos la portada).
  useEffect(() => {
    if (phase === 'intro') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [phase]);

  // Detecta orientación para agrandar el video al girar el teléfono.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(orientation: landscape)');
    const on = () => setLandscape(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  function runCountdown() {
    clearTimer();
    let c = 3;
    setCount(c);
    setPhase('countdown');
    timer.current = setInterval(() => {
      c -= 1;
      if (c <= 0) { clearTimer(); setPhase('playing'); }
      else setCount(c);
    }, 1000);
  }

  function start() {
    setIndex(0);
    runCountdown();
  }
  function next() {
    if (isLast) { clearTimer(); setPhase('finished'); return; }
    setIndex((i) => i + 1);
    runCountdown();
  }
  function prev() {
    if (isFirst) return;
    clearTimer();
    setIndex((i) => i - 1);
    setPhase('playing');
  }
  function exitToIntro() {
    clearTimer();
    setPhase('intro');
    setIndex(0);
  }
  function complete() {
    clearTimer();
    onComplete();
    onBack();
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) await overlayRef.current?.requestFullscreen?.();
      else await document.exitFullscreen?.();
    } catch { /* iOS: el overlay ya ocupa toda la pantalla de la app */ }
  }

  // ── Portada (página normal) ───────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="min-h-screen pb-32" style={{ backgroundColor: 'var(--color-bg)' }}>
        {/* Imagen grande con flecha de volver */}
        <div className="relative w-full" style={{ aspectRatio: '4/3', backgroundColor: 'var(--color-border)' }}>
          {thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbnail} alt={titulo} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-30">▶</div>
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.35), transparent 45%)' }} />
          <button
            onClick={onBack}
            className="absolute top-12 left-5 w-11 h-11 flex items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: 'var(--color-text)' }}
            aria-label="Volver"
          >
            ←
          </button>
          {done && (
            <div
              className="absolute top-12 right-5 px-3 py-1.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              ✓ Completado hoy
            </div>
          )}
        </div>

        {/* Info */}
        <div className="px-5 pt-5 space-y-3">
          <h1 className="text-4xl leading-tight" style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--color-text)' }}>
            {titulo}
          </h1>
          <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--color-muted)' }}>
            {subtitulo && <span>{subtitulo}</span>}
            {duracionMin ? <span>· {duracionMin} min</span> : null}
            {multi && <span>· {total} ejercicios</span>}
          </div>

          {notas && (
            <div
              className="rounded-2xl p-4 text-sm leading-relaxed"
              style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
            >
              {notas}
            </div>
          )}

          {/* Lista de ejercicios (si es rutina) */}
          {multi && (
            <div className="space-y-1.5 pt-1">
              {items.map((it, i) => (
                <div key={it.id} className="flex items-center gap-3 text-sm">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                    style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1 min-w-0 truncate" style={{ color: 'var(--color-text)' }}>{it.nombre}</span>
                  {it.fase && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${FASE_COLOR[it.fase]}22`, color: FASE_COLOR[it.fase] }}>
                      {it.fase}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA Comenzar */}
        <div className="fixed bottom-20 left-0 right-0 px-5 z-40" style={{ pointerEvents: 'none' }}>
          <button
            onClick={start}
            disabled={total === 0}
            className="w-full py-4 rounded-2xl text-white font-medium text-base disabled:opacity-50"
            style={{ pointerEvents: 'auto', backgroundColor: 'var(--color-accent)', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
          >
            ▶ Comenzar
          </button>
        </div>
      </div>
    );
  }

  // ── Overlay (countdown / playing / finished) ──────────────────────────
  const embedUrl = item && item.tipo === 'link' ? getGuidedEmbedUrl(item.url, muted) : null;
  const vertical = item && item.tipo === 'link' && isVerticalEmbed(item.url);

  const videoStyle: React.CSSProperties = landscape
    ? { height: '88vh', width: 'auto', aspectRatio: vertical ? '9/16' : '16/9', maxWidth: '100%' }
    : vertical
      ? { height: '64vh', width: 'auto', aspectRatio: '9/16', maxWidth: '100%' }
      : { width: '100%', aspectRatio: '16/9', maxHeight: '64vh' };

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[60] flex flex-col" style={{ backgroundColor: 'rgba(15,15,15,0.98)' }}>
      {/* Header */}
      <div className="flex items-start justify-between px-4 pt-4 pb-2 gap-2">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-widest truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {titulo}
          </p>
          {item && (
            <h2 className="text-white text-lg leading-tight truncate" style={{ fontFamily: 'var(--font-cormorant)' }}>
              {item.nombre}
            </h2>
          )}
          {item?.fase && (
            <span className="inline-block mt-0.5 text-[10px] font-medium px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: FASE_COLOR[item.fase] }}>
              {item.fase}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setMuted((m) => !m)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            aria-label={muted ? 'Activar sonido' : 'Silenciar'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
          <button
            onClick={toggleFullscreen}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            aria-label="Pantalla completa"
          >
            ⛶
          </button>
          <button
            onClick={exitToIntro}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Progreso (puntos) para rutinas */}
      {multi && phase !== 'finished' && (
        <div className="flex justify-center gap-1.5 px-4 pb-1">
          {items.map((it, i) => (
            <span
              key={it.id}
              className="h-1 rounded-full transition-all"
              style={{
                width: i === index ? 22 : 8,
                backgroundColor: i === index ? 'var(--color-accent)' : 'rgba(255,255,255,0.25)',
              }}
            />
          ))}
        </div>
      )}

      {/* Cuerpo */}
      <div className="flex-1 flex flex-col items-center justify-center px-3 min-h-0">
        {phase === 'countdown' ? (
          <div className="text-center">
            <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Prepárate{item ? ` · ${item.nombre}` : ''}
            </p>
            <p className="text-white leading-none" style={{ fontFamily: 'var(--font-cormorant)', fontSize: '6rem' }}>
              {count}
            </p>
            <button onClick={() => { clearTimer(); setPhase('playing'); }} className="mt-4 text-sm underline underline-offset-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Saltar
            </button>
          </div>
        ) : phase === 'finished' ? (
          <div className="text-center px-6">
            <p className="text-6xl mb-4">🎉</p>
            <h2 className="text-white text-3xl mb-2" style={{ fontFamily: 'var(--font-cormorant)' }}>
              ¡Terminaste!
            </h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {multi ? `${total} ejercicios completados` : titulo}
            </p>
          </div>
        ) : item ? (
          <>
            {item.tipo === 'link' && embedUrl ? (
              <iframe
                key={`${item.id}-${muted}`}
                src={embedUrl}
                className="rounded-xl"
                style={videoStyle}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title={item.nombre}
              />
            ) : (
              <video
                key={`${item.id}-${muted}`}
                src={item.url}
                autoPlay
                loop
                muted={muted}
                playsInline
                controls
                className="rounded-xl"
                style={videoStyle}
              />
            )}
            {item.notas && !landscape && (
              <p className="mt-3 text-sm text-center max-w-md" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {item.notas}
              </p>
            )}
          </>
        ) : null}
      </div>

      {/* Footer / controles */}
      <div className="px-4 pb-8 pt-2 space-y-3">
        {phase === 'finished' ? (
          <button
            onClick={complete}
            className="w-full py-4 rounded-2xl text-white font-medium text-base"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            ✓ Marcar como completado
          </button>
        ) : phase === 'playing' ? (
          <div className="flex items-center gap-3">
            {multi && (
              <button
                onClick={prev}
                disabled={isFirst}
                className="px-5 py-3 rounded-2xl text-white text-sm font-medium disabled:opacity-30"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
              >
                ← Anterior
              </button>
            )}
            {isLast ? (
              <button
                onClick={() => { clearTimer(); setPhase('finished'); }}
                className="flex-1 py-3 rounded-2xl text-white font-medium text-sm"
                style={{ backgroundColor: 'var(--color-accent)' }}
              >
                {multi ? 'Terminar ✓' : 'Listo, completar ✓'}
              </button>
            ) : (
              <button
                onClick={next}
                className="flex-1 py-3 rounded-2xl text-white font-medium text-sm"
                style={{ backgroundColor: 'var(--color-accent)' }}
              >
                Siguiente →
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
