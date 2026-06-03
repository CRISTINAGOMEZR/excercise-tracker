'use client';

import { youtubeThumbnail, getYouTubeId } from '@/lib/videoUtils';
import type { Exercise } from '@/types';

interface Props {
  exercise: Exercise;
  done: boolean;
  /** Click en cualquier parte de la card (abrir detalle o reproducir). */
  onOpen?: () => void;
  onPlay?: () => void;
  /** Lápiz de edición arriba a la izquierda (solo si se provee). */
  onEdit?: () => void;
  /** Botón redondo de marcar/desmarcar (solo si se provee). */
  onToggle?: () => void;
}

export default function ExerciseCard({ exercise, done, onOpen, onPlay, onEdit, onToggle }: Props) {
  const thumbnail =
    exercise.miniatura ||
    (exercise.tipo === 'link' && getYouTubeId(exercise.url)
      ? youtubeThumbnail(getYouTubeId(exercise.url)!)
      : null);

  const handleCardClick = onOpen ?? onPlay;

  return (
    <div
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      className="rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer text-left"
      style={{
        backgroundColor: done ? 'var(--color-done-bg)' : 'var(--color-bg-card)',
        border: `1px solid ${done ? '#c5d9bf' : 'var(--color-border)'}`,
      }}
    >
      {/* Thumbnail */}
      <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail}
            alt={exercise.titulo}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-3xl"
            style={{ backgroundColor: 'var(--color-border)' }}
          >
            ▶
          </div>
        )}

        {/* Editar (lápiz) arriba a la izquierda */}
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center text-sm shadow"
            style={{ backgroundColor: 'rgba(255,255,255,0.92)', color: 'var(--color-text)' }}
            aria-label={`Editar ${exercise.titulo}`}
          >
            ✏️
          </button>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center">
            <span className="text-xl ml-1">▶</span>
          </div>
        </div>

        {/* Done badge */}
        {done && (
          <div
            className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-medium shadow"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            ✓
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-4 py-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3
            className="font-medium leading-snug truncate"
            style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem', color: 'var(--color-text)' }}
          >
            {exercise.titulo}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
            {exercise.categoria}
            {exercise.duracionMin ? ` · ${exercise.duracionMin} min` : ''}
            {done && !onToggle ? ' · ✓ hecho hoy' : ''}
          </p>
        </div>

        {/* Toggle hecho (solo si se provee) */}
        {onToggle && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 border"
            style={{
              backgroundColor: done ? 'var(--color-accent)' : 'transparent',
              borderColor: done ? 'var(--color-accent)' : 'var(--color-border)',
              color: done ? 'white' : 'var(--color-muted)',
            }}
            aria-label={done ? 'Desmarcar' : 'Marcar como hecho'}
          >
            {done ? '✓' : '○'}
          </button>
        )}
      </div>
    </div>
  );
}
