'use client';

import { youtubeThumbnail, getYouTubeId } from '@/lib/videoUtils';
import type { Exercise } from '@/types';

interface Props {
  exercise: Exercise;
  done: boolean;
  onToggle: () => void;
  onPlay: () => void;
}

export default function ExerciseCard({ exercise, done, onToggle, onPlay }: Props) {
  const thumbnail =
    exercise.miniatura ||
    (exercise.tipo === 'link' && getYouTubeId(exercise.url)
      ? youtubeThumbnail(getYouTubeId(exercise.url)!)
      : null);

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        backgroundColor: done ? 'var(--color-done-bg)' : 'var(--color-bg-card)',
        border: `1px solid ${done ? '#c5d9bf' : 'var(--color-border)'}`,
      }}
    >
      {/* Thumbnail */}
      <button
        onClick={onPlay}
        className="relative w-full block"
        style={{ aspectRatio: '16/9' }}
        aria-label={`Reproducir ${exercise.titulo}`}
      >
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
      </button>

      {/* Info + toggle */}
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
          </p>
        </div>

        {/* Toggle hecho */}
        <button
          onClick={onToggle}
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
      </div>
    </div>
  );
}
