'use client';

import { getEmbedUrl, getYouTubeId } from '@/lib/videoUtils';
import type { Exercise } from '@/types';

interface Props {
  exercise: Exercise;
  onClose: () => void;
}

export default function VideoPlayer({ exercise, onClose }: Props) {
  const embedUrl = exercise.tipo === 'link' ? getEmbedUrl(exercise.url) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: 'rgba(26,26,26,0.95)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <h2 className="text-white text-lg" style={{ fontFamily: 'var(--font-cormorant)' }}>
            {exercise.titulo}
          </h2>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {exercise.categoria}
            {exercise.duracionMin ? ` · ${exercise.duracionMin} min` : ''}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-white opacity-60 hover:opacity-100 transition-opacity text-2xl flex items-center justify-center w-11 h-11"
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>

      {/* Video */}
      <div className="flex-1 flex items-center justify-center px-4 pb-8">
        {exercise.tipo === 'link' && embedUrl ? (
          <iframe
            src={embedUrl}
            className="w-full rounded-xl"
            style={{ aspectRatio: '16/9', maxHeight: '60vh' }}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title={exercise.titulo}
          />
        ) : (
          <video
            src={exercise.url}
            controls
            autoPlay
            className="w-full rounded-xl"
            style={{ maxHeight: '60vh' }}
          />
        )}
      </div>

      {/* Notas */}
      {exercise.notas && (
        <div
          className="mx-4 mb-8 p-4 rounded-xl text-sm"
          style={{
            backgroundColor: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.7)',
            fontFamily: 'var(--font-dm-sans)',
          }}
        >
          {exercise.notas}
        </div>
      )}
    </div>
  );
}
