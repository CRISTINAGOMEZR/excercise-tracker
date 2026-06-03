'use client';

import { ORDEN_FASE, type Fase, type Rutina } from '@/types';
import { IconPlay, IconCheck, IconVideo } from '@/components/icons';

const FASE_COLOR: Record<Fase, string> = {
  Calentamiento: '#d99a6c',
  Normal: '#7a9670',
  Enfriamiento: '#6c93b3',
};

interface Props {
  rutina: Rutina;
  done: boolean;
  onOpen: () => void;
}

export default function RoutineCard({ rutina, done, onOpen }: Props) {
  const items = [...rutina.items].sort((a, b) => ORDEN_FASE[a.fase] - ORDEN_FASE[b.fase]);
  const thumb = items.find((i) => i.miniatura)?.miniatura ?? null;

  // Conteo por fase para los chips.
  const fases = (['Calentamiento', 'Normal', 'Enfriamiento'] as Fase[])
    .map((f) => ({ f, n: items.filter((i) => i.fase === f).length }))
    .filter((x) => x.n > 0);

  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      className="rounded-2xl overflow-hidden relative cursor-pointer text-left"
      style={{
        backgroundColor: done ? 'var(--color-done-bg)' : 'var(--color-bg-card)',
        border: `1px solid ${done ? '#c5d9bf' : 'var(--color-border)'}`,
      }}
    >
      <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt={rutina.titulo} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-muted)' }}>
            <IconPlay size={28} />
          </div>
        )}

        {/* Badge nº de videos */}
        <div
          className="absolute bottom-2 left-2 text-xs px-2 py-1 rounded-full text-white font-medium flex items-center gap-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
        >
          <IconVideo size={14} /> {items.length} video{items.length !== 1 ? 's' : ''}
        </div>

        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center" style={{ color: 'var(--color-text)' }}>
            <IconPlay size={20} />
          </div>
        </div>
        {done && (
          <div
            className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white shadow"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            <IconCheck size={16} />
          </div>
        )}
      </div>

      <div className="px-4 py-3">
        <h3
          className="font-medium leading-snug truncate"
          style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem', color: 'var(--color-text)' }}
        >
          {rutina.titulo}
        </h3>
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {fases.map(({ f, n }) => (
            <span
              key={f}
              className="text-[10px] px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: `${FASE_COLOR[f]}22`, color: FASE_COLOR[f] }}
            >
              {f} {n}
            </span>
          ))}
          {done && (
            <span className="text-[10px] inline-flex items-center gap-0.5" style={{ color: 'var(--color-accent)' }}>
              <IconCheck size={12} /> hecho hoy
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
