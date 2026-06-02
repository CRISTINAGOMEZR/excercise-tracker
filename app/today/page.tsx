'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Nav from '@/components/Nav';
import ExerciseCard from '@/components/ExerciseCard';
import VideoPlayer from '@/components/VideoPlayer';
import {
  getEjercicios,
  getRegistrosHoy,
  marcarHecho,
  desmarcarHecho,
  getRachaActual,
  getTotalSemana,
} from '@/lib/firestore';
import type { Exercise, Registro } from '@/types';

export default function TodayPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [playing, setPlaying] = useState<Exercise | null>(null);
  const [racha, setRacha] = useState(0);
  const [semana, setSemana] = useState(0);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  useEffect(() => {
    async function load() {
      const [exs, regs, r, s] = await Promise.all([
        getEjercicios(),
        getRegistrosHoy(),
        getRachaActual(),
        getTotalSemana(),
      ]);
      setExercises(exs);
      setRegistros(regs);
      setRacha(r);
      setSemana(s);
      setLoading(false);
    }
    load();
  }, []);

  function isDone(exId: string) {
    return registros.some((r) => r.ejercicioId === exId);
  }

  async function handleToggle(ex: Exercise) {
    const reg = registros.find((r) => r.ejercicioId === ex.id);
    if (reg) {
      await desmarcarHecho(reg.id);
      setRegistros((prev) => prev.filter((r) => r.id !== reg.id));
    } else {
      const id = await marcarHecho(ex.id);
      setRegistros((prev) => [
        ...prev,
        { id, ejercicioId: ex.id, fecha: new Date().toISOString().split('T')[0], completadoAt: new Date() },
      ]);
    }
  }

  const done = exercises.filter((e) => isDone(e.id));
  const pending = exercises.filter((e) => !isDone(e.id));

  return (
    <AuthGuard>
      <div className="min-h-screen pb-24" style={{ backgroundColor: 'var(--color-bg)' }}>
        {/* Header */}
        <header className="px-5 pt-12 pb-6">
          <p className="text-xs uppercase tracking-widest mb-1 capitalize" style={{ color: 'var(--color-muted)' }}>
            {today}
          </p>
          <h1 className="text-4xl" style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--color-text)' }}>
            Hoy
          </h1>

          {/* Stats */}
          {!loading && (
            <div className="flex gap-4 mt-4">
              <div
                className="flex-1 rounded-2xl px-4 py-3 text-center"
                style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
              >
                <p className="text-2xl" style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--color-accent)' }}>
                  {racha}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  {racha === 1 ? 'día de racha' : 'días de racha'}
                </p>
              </div>
              <div
                className="flex-1 rounded-2xl px-4 py-3 text-center"
                style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
              >
                <p className="text-2xl" style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--color-accent)' }}>
                  {semana}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  esta semana
                </p>
              </div>
              <div
                className="flex-1 rounded-2xl px-4 py-3 text-center"
                style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
              >
                <p className="text-2xl" style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--color-accent)' }}>
                  {done.length}/{exercises.length}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  hoy
                </p>
              </div>
            </div>
          )}
        </header>

        {/* Content */}
        <main className="px-5 space-y-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 rounded-full border-2 border-current border-t-transparent animate-spin opacity-30" />
            </div>
          ) : exercises.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <p className="text-5xl opacity-20">◫</p>
              <p style={{ color: 'var(--color-muted)' }}>
                Tu biblioteca está vacía.
              </p>
              <a
                href="/add"
                className="inline-block text-sm underline underline-offset-4"
                style={{ color: 'var(--color-accent)' }}
              >
                Agrega tu primer ejercicio
              </a>
            </div>
          ) : (
            <>
              {/* Pendientes */}
              {pending.length > 0 && (
                <section>
                  <h2
                    className="text-xs uppercase tracking-widest mb-4"
                    style={{ color: 'var(--color-muted)' }}
                  >
                    Pendientes · {pending.length}
                  </h2>
                  <div className="grid gap-4">
                    {pending.map((ex) => (
                      <ExerciseCard
                        key={ex.id}
                        exercise={ex}
                        done={false}
                        onToggle={() => handleToggle(ex)}
                        onPlay={() => setPlaying(ex)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Completados */}
              {done.length > 0 && (
                <section>
                  <h2
                    className="text-xs uppercase tracking-widest mb-4"
                    style={{ color: 'var(--color-muted)' }}
                  >
                    Completados · {done.length}
                  </h2>
                  <div className="grid gap-4">
                    {done.map((ex) => (
                      <ExerciseCard
                        key={ex.id}
                        exercise={ex}
                        done={true}
                        onToggle={() => handleToggle(ex)}
                        onPlay={() => setPlaying(ex)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>

      {/* Video Player */}
      {playing && (
        <VideoPlayer exercise={playing} onClose={() => setPlaying(null)} />
      )}

      <Nav />
    </AuthGuard>
  );
}
