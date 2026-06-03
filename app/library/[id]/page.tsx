'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import Nav from '@/components/Nav';
import Celebration from '@/components/Celebration';
import { getEjercicio, getRegistrosHoy, marcarHecho, desmarcarHecho } from '@/lib/firestore';
import { getEmbedUrl, isVerticalEmbed } from '@/lib/videoUtils';
import type { Exercise } from '@/types';

export default function ExerciseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params.id);

  const [ex, setEx] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [doneRegId, setDoneRegId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [celebrate, setCelebrate] = useState(0);

  useEffect(() => {
    async function load() {
      const [e, regs] = await Promise.all([getEjercicio(id), getRegistrosHoy()]);
      setEx(e);
      const reg = regs.find((r) => r.ejercicioId === id);
      setDoneRegId(reg ? reg.id : null);
      setLoading(false);
    }
    load();
  }, [id]);

  const done = doneRegId !== null;

  async function toggleDone() {
    if (!ex || saving) return;
    setSaving(true);
    if (done && doneRegId) {
      await desmarcarHecho(doneRegId);
      setDoneRegId(null);
    } else {
      setCelebrate((n) => n + 1);
      const newId = await marcarHecho(ex.id);
      setDoneRegId(newId);
    }
    setSaving(false);
  }

  const embedUrl = ex?.tipo === 'link' ? getEmbedUrl(ex.url) : null;
  const vertical = ex?.tipo === 'link' && isVerticalEmbed(ex.url);

  return (
    <AuthGuard>
      <Celebration trigger={celebrate} />
      <div className="min-h-screen pb-32" style={{ backgroundColor: 'var(--color-bg)' }}>
        <header className="px-5 pt-12 pb-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-11 h-11 flex items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
            aria-label="Volver"
          >
            ←
          </button>
          <h1 className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
            Ejercicio
          </h1>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 border-current border-t-transparent animate-spin opacity-30" />
          </div>
        ) : !ex ? (
          <div className="text-center py-20 space-y-3">
            <p className="text-5xl opacity-20">◫</p>
            <p style={{ color: 'var(--color-muted)' }}>No se encontró este ejercicio.</p>
            <a href="/library" className="inline-block text-sm underline underline-offset-4" style={{ color: 'var(--color-accent)' }}>
              Volver a la biblioteca
            </a>
          </div>
        ) : (
          <main className="px-5 space-y-5">
            {/* Video */}
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
              {ex.tipo === 'link' && embedUrl ? (
                <iframe
                  src={embedUrl}
                  className="w-full"
                  style={vertical ? { aspectRatio: '9/16', maxHeight: '70vh' } : { aspectRatio: '16/9' }}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title={ex.titulo}
                />
              ) : (
                <video
                  src={ex.url}
                  controls
                  playsInline
                  className="w-full"
                  style={{ maxHeight: '70vh', backgroundColor: '#000' }}
                />
              )}
            </div>

            {/* Info */}
            <div>
              <h2 className="text-3xl leading-tight" style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--color-text)' }}>
                {ex.titulo}
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
                {ex.categoria}
                {ex.duracionMin ? ` · ${ex.duracionMin} min` : ''}
              </p>
            </div>

            {ex.notas && (
              <div
                className="rounded-2xl p-4 text-sm leading-relaxed"
                style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              >
                {ex.notas}
              </div>
            )}
          </main>
        )}
      </div>

      {/* CTA fija: marcar hecho hoy */}
      {!loading && ex && (
        <div
          className="fixed bottom-20 left-0 right-0 px-5 z-40"
          style={{ pointerEvents: 'none' }}
        >
          <button
            onClick={toggleDone}
            disabled={saving}
            className="w-full py-4 rounded-2xl font-medium text-sm transition-all disabled:opacity-60 border"
            style={{
              pointerEvents: 'auto',
              backgroundColor: done ? 'var(--color-done-bg)' : 'var(--color-accent)',
              borderColor: done ? '#c5d9bf' : 'var(--color-accent)',
              color: done ? 'var(--color-text)' : 'white',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            }}
          >
            {saving ? 'Guardando…' : done ? '✓ Hecho hoy · toca para deshacer' : '✓ Marcar hecho hoy'}
          </button>
        </div>
      )}

      <Nav />
    </AuthGuard>
  );
}
