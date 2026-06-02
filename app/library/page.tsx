'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Nav from '@/components/Nav';
import ExerciseCard from '@/components/ExerciseCard';
import VideoPlayer from '@/components/VideoPlayer';
import { getEjercicios, getRegistrosHoy, marcarHecho, desmarcarHecho } from '@/lib/firestore';
import type { Exercise, Registro } from '@/types';
import { CATEGORIAS } from '@/types';

export default function LibraryPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [playing, setPlaying] = useState<Exercise | null>(null);
  const [filter, setFilter] = useState<string>('Todas');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [exs, regs] = await Promise.all([getEjercicios(), getRegistrosHoy()]);
      setExercises(exs);
      setRegistros(regs);
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

  const categorias = ['Todas', ...CATEGORIAS.filter((c) =>
    exercises.some((e) => e.categoria === c)
  )];

  const filtered = filter === 'Todas'
    ? exercises
    : exercises.filter((e) => e.categoria === filter);

  return (
    <AuthGuard>
      <div className="min-h-screen pb-24" style={{ backgroundColor: 'var(--color-bg)' }}>
        {/* Header */}
        <header className="px-5 pt-12 pb-4">
          <h1 className="text-4xl" style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--color-text)' }}>
            Biblioteca
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            {exercises.length} ejercicio{exercises.length !== 1 ? 's' : ''}
          </p>
        </header>

        {/* Filtros */}
        {!loading && exercises.length > 0 && (
          <div className="px-5 mb-5 overflow-x-auto">
            <div className="flex gap-2 w-max">
              {categorias.map((c) => (
                <button
                  key={c}
                  onClick={() => setFilter(c)}
                  className="px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all"
                  style={{
                    backgroundColor: filter === c ? 'var(--color-accent)' : 'var(--color-bg-card)',
                    color: filter === c ? 'white' : 'var(--color-muted)',
                    border: `1px solid ${filter === c ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Grid */}
        <main className="px-5">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 rounded-full border-2 border-current border-t-transparent animate-spin opacity-30" />
            </div>
          ) : exercises.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <p className="text-5xl opacity-20">◫</p>
              <p style={{ color: 'var(--color-muted)' }}>No hay ejercicios todavía.</p>
              <a
                href="/add"
                className="inline-block text-sm underline underline-offset-4"
                style={{ color: 'var(--color-accent)' }}
              >
                Agrega el primero
              </a>
            </div>
          ) : (
            <div className="grid gap-4">
              {filtered.map((ex) => (
                <ExerciseCard
                  key={ex.id}
                  exercise={ex}
                  done={isDone(ex.id)}
                  onToggle={() => handleToggle(ex)}
                  onPlay={() => setPlaying(ex)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {playing && (
        <VideoPlayer exercise={playing} onClose={() => setPlaying(null)} />
      )}

      <Nav />
    </AuthGuard>
  );
}
