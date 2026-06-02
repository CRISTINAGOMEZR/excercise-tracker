'use client';

import { useState } from 'react';
import { ORDEN_FASE, type Fase, type Rutina } from '@/types';

const FASE_COLOR: Record<Fase, string> = {
  Calentamiento: '#d99a6c',
  Normal: '#7a9670',
  Enfriamiento: '#6c93b3',
};

interface Props {
  rutina: Rutina;
  done: boolean;
  onPlay: () => void;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function RoutineCard({ rutina, done, onPlay, onToggle, onEdit, onDelete }: Props) {
  const [menu, setMenu] = useState(false);
  const items = [...rutina.items].sort((a, b) => ORDEN_FASE[a.fase] - ORDEN_FASE[b.fase]);
  const thumb = items.find((i) => i.miniatura)?.miniatura ?? null;

  // Conteo por fase para los chips.
  const fases = (['Calentamiento', 'Normal', 'Enfriamiento'] as Fase[])
    .map((f) => ({ f, n: items.filter((i) => i.fase === f).length }))
    .filter((x) => x.n > 0);

  return (
    <div
      className="rounded-2xl overflow-hidden relative"
      style={{
        backgroundColor: done ? 'var(--color-done-bg)' : 'var(--color-bg-card)',
        border: `1px solid ${done ? '#c5d9bf' : 'var(--color-border)'}`,
      }}
    >
      <button onClick={onPlay} className="relative w-full block" style={{ aspectRatio: '16/9' }} aria-label={`Reproducir ${rutina.titulo}`}>
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt={rutina.titulo} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl" style={{ backgroundColor: 'var(--color-border)' }}>
            ▶
          </div>
        )}
        {/* Badge nº de videos */}
        <div
          className="absolute bottom-2 left-2 text-xs px-2 py-1 rounded-full text-white font-medium flex items-center gap-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
        >
          ▦ {items.length} video{items.length !== 1 ? 's' : ''}
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center">
            <span className="text-xl ml-1">▶</span>
          </div>
        </div>
        {done && (
          <div
            className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm shadow"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            ✓
          </div>
        )}
      </button>

      <div className="px-4 py-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3
            className="font-medium leading-snug truncate"
            style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem', color: 'var(--color-text)' }}
          >
            {rutina.titulo}
          </h3>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {fases.map(({ f, n }) => (
              <span
                key={f}
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: `${FASE_COLOR[f]}22`, color: FASE_COLOR[f] }}
              >
                {f} {n}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Menú editar/borrar */}
          <div className="relative">
            <button
              onClick={() => setMenu((m) => !m)}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ color: 'var(--color-muted)' }}
              aria-label="Opciones"
            >
              ⋯
            </button>
            {menu && (
              <div
                className="absolute right-0 top-10 z-10 rounded-xl overflow-hidden shadow-lg"
                style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
              >
                <button
                  onClick={() => { setMenu(false); onEdit(); }}
                  className="block w-full text-left px-4 py-2.5 text-sm whitespace-nowrap"
                  style={{ color: 'var(--color-text)' }}
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => { setMenu(false); onDelete(); }}
                  className="block w-full text-left px-4 py-2.5 text-sm whitespace-nowrap"
                  style={{ color: '#b56f54' }}
                >
                  🗑️ Borrar
                </button>
              </div>
            )}
          </div>

          {/* Toggle hecho */}
          <button
            onClick={onToggle}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all border"
            style={{
              backgroundColor: done ? 'var(--color-accent)' : 'transparent',
              borderColor: done ? 'var(--color-accent)' : 'var(--color-border)',
              color: done ? 'white' : 'var(--color-muted)',
            }}
            aria-label={done ? 'Desmarcar' : 'Marcar como hecho'}
          >
            {done ? '✓' : '○'}
          </button>
        </div>
      </div>
    </div>
  );
}
