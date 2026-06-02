'use client';

import { useState, useRef, useEffect } from 'react';
import { getLoopEmbedUrl, isVerticalEmbed } from '@/lib/videoUtils';
import { ORDEN_FASE, type Fase, type Rutina } from '@/types';

const FASE_COLOR: Record<Fase, string> = {
  Calentamiento: '#d99a6c',
  Normal: '#7a9670',
  Enfriamiento: '#6c93b3',
};

interface Props {
  rutina: Rutina;
  onClose: () => void;
  onComplete?: () => void;
}

export default function RoutinePlayer({ rutina, onClose, onComplete }: Props) {
  const items = [...rutina.items].sort((a, b) => ORDEN_FASE[a.fase] - ORDEN_FASE[b.fase]);
  const [index, setIndex] = useState(0);
  const touchStartY = useRef<number | null>(null);

  const item = items[index];
  const isLast = index === items.length - 1;
  const isFirst = index === 0;

  function next() {
    setIndex((i) => Math.min(i + 1, items.length - 1));
  }
  function prev() {
    setIndex((i) => Math.max(i - 1, 0));
  }

  // Teclado (desktop)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') prev();
      else if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  function onTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartY.current === null) return;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dy) > 60) {
      if (dy < 0) next();
      else prev();
    }
    touchStartY.current = null;
  }

  if (!item) return null;

  const embedUrl = item.tipo === 'link' ? getLoopEmbedUrl(item.url) : null;
  const vertical = item.tipo === 'link' && isVerticalEmbed(item.url);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: 'rgba(20,20,20,0.97)' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-4 pt-4 pb-2 gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {rutina.titulo}
          </p>
          <h2 className="text-white text-xl leading-tight truncate" style={{ fontFamily: 'var(--font-cormorant)' }}>
            {item.nombre}
          </h2>
          <span
            className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: FASE_COLOR[item.fase] }}
          >
            {item.fase}
          </span>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-white opacity-70 hover:opacity-100 text-2xl w-11 h-11 flex items-center justify-center"
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>

      {/* Progreso (puntos) */}
      <div className="flex justify-center gap-1.5 px-4 pb-2">
        {items.map((it, i) => (
          <button
            key={it.id}
            onClick={() => setIndex(i)}
            className="h-1 rounded-full transition-all"
            style={{
              width: i === index ? 22 : 8,
              backgroundColor: i === index ? FASE_COLOR[it.fase] : 'rgba(255,255,255,0.25)',
            }}
            aria-label={`Ir a ${it.nombre}`}
          />
        ))}
      </div>

      {/* Video */}
      <div className="flex-1 flex items-center justify-center px-3 relative">
        {item.tipo === 'link' && embedUrl ? (
          <iframe
            key={item.id}
            src={embedUrl}
            className="rounded-xl mx-auto"
            style={
              vertical
                ? { width: 'auto', aspectRatio: '9/16', height: '68vh', maxWidth: '100%' }
                : { width: '100%', aspectRatio: '16/9', maxHeight: '60vh' }
            }
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            scrolling="no"
            title={item.nombre}
          />
        ) : (
          <video
            key={item.id}
            src={item.url}
            controls
            autoPlay
            loop
            muted
            playsInline
            className="w-full rounded-xl"
            style={{ maxHeight: '68vh' }}
          />
        )}

        {/* Flechas de navegación (lado derecho) */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-3">
          <button
            onClick={prev}
            disabled={isFirst}
            className="w-11 h-11 rounded-full flex items-center justify-center text-white text-lg disabled:opacity-20"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            aria-label="Anterior"
          >
            ↑
          </button>
          <button
            onClick={next}
            disabled={isLast}
            className="w-11 h-11 rounded-full flex items-center justify-center text-white text-lg disabled:opacity-20"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            aria-label="Siguiente"
          >
            ↓
          </button>
        </div>
      </div>

      {/* Notas */}
      {item.notas && (
        <div
          className="mx-4 mb-2 p-3 rounded-xl text-sm"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
        >
          {item.notas}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 pb-8 pt-2 flex items-center gap-3">
        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {index + 1} / {items.length}
        </span>
        {isLast ? (
          <button
            onClick={() => { onComplete?.(); onClose(); }}
            className="flex-1 py-3 rounded-2xl text-white font-medium text-sm"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            ✓ Terminé la rutina
          </button>
        ) : (
          <button
            onClick={next}
            className="flex-1 py-3 rounded-2xl font-medium text-sm"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white' }}
          >
            Siguiente ejercicio →
          </button>
        )}
      </div>

      {/* Pista de swipe */}
      <p className="text-center text-[11px] pb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
        Desliza ↑ ↓ o usa las flechas para cambiar de ejercicio
      </p>
    </div>
  );
}
