'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import Nav from '@/components/Nav';
import ExerciseCard from '@/components/ExerciseCard';
import RoutineCard from '@/components/RoutineCard';
import RoutinePlayer from '@/components/RoutinePlayer';
import {
  getEjercicios,
  getRutinas,
  getRegistrosHoy,
  marcarHecho,
  desmarcarHecho,
  marcarRutinaHecha,
  deleteRutina,
} from '@/lib/firestore';
import type { Exercise, Registro, Rutina } from '@/types';
import { CATEGORIAS } from '@/types';

export default function LibraryPage() {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [playingRutina, setPlayingRutina] = useState<Rutina | null>(null);
  const [filter, setFilter] = useState<string>('Todas');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [exs, ruts, regs] = await Promise.all([
        getEjercicios(),
        getRutinas(),
        getRegistrosHoy(),
      ]);
      setExercises(exs);
      setRutinas(ruts);
      setRegistros(regs);
      setLoading(false);
    }
    load();
  }, []);

  function isDone(exId: string) {
    return registros.some((r) => r.ejercicioId === exId);
  }
  function rutinaDone(id: string) {
    return registros.some((r) => r.rutinaId === id);
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

  async function handleToggleRutina(rut: Rutina) {
    const reg = registros.find((r) => r.rutinaId === rut.id);
    if (reg) {
      await desmarcarHecho(reg.id);
      setRegistros((prev) => prev.filter((r) => r.id !== reg.id));
    } else {
      const id = await marcarRutinaHecha(rut.id);
      setRegistros((prev) => [
        ...prev,
        { id, rutinaId: rut.id, fecha: new Date().toISOString().split('T')[0], completadoAt: new Date() },
      ]);
    }
  }

  async function handleCompleteRutina(rut: Rutina) {
    if (!rutinaDone(rut.id)) await handleToggleRutina(rut);
  }

  async function handleDeleteRutina(rut: Rutina) {
    if (!confirm(`¿Borrar la rutina "${rut.titulo}"?`)) return;
    await deleteRutina(rut.id);
    setRutinas((prev) => prev.filter((r) => r.id !== rut.id));
  }

  const categorias = ['Todas', ...CATEGORIAS.filter((c) => exercises.some((e) => e.categoria === c))];
  const filtered = filter === 'Todas' ? exercises : exercises.filter((e) => e.categoria === filter);

  const vacio = exercises.length === 0 && rutinas.length === 0;

  return (
    <AuthGuard>
      <div className="min-h-screen pb-24" style={{ backgroundColor: 'var(--color-bg)' }}>
        <header className="px-5 pt-12 pb-4">
          <h1 className="text-4xl" style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--color-text)' }}>
            Biblioteca
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            {rutinas.length > 0 && `${rutinas.length} rutina${rutinas.length !== 1 ? 's' : ''} · `}
            {exercises.length} ejercicio{exercises.length !== 1 ? 's' : ''}
          </p>
        </header>

        <main className="px-5 space-y-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 rounded-full border-2 border-current border-t-transparent animate-spin opacity-30" />
            </div>
          ) : vacio ? (
            <div className="text-center py-20 space-y-3">
              <p className="text-5xl opacity-20">◫</p>
              <p style={{ color: 'var(--color-muted)' }}>No hay nada todavía.</p>
              <a href="/add" className="inline-block text-sm underline underline-offset-4" style={{ color: 'var(--color-accent)' }}>
                Agrega lo primero
              </a>
            </div>
          ) : (
            <>
              {/* Rutinas */}
              {rutinas.length > 0 && (
                <section>
                  <h2 className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--color-muted)' }}>
                    Rutinas
                  </h2>
                  <div className="grid gap-4">
                    {rutinas.map((rut) => (
                      <RoutineCard
                        key={rut.id}
                        rutina={rut}
                        done={rutinaDone(rut.id)}
                        onPlay={() => setPlayingRutina(rut)}
                        onToggle={() => handleToggleRutina(rut)}
                        onEdit={() => router.push(`/add?edit=${rut.id}`)}
                        onDelete={() => handleDeleteRutina(rut)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Ejercicios */}
              {exercises.length > 0 && (
                <section>
                  <h2 className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--color-muted)' }}>
                    Ejercicios
                  </h2>

                  {/* Filtros */}
                  <div className="mb-5 -mx-5 px-5 overflow-x-auto">
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

                  <div className="grid gap-4">
                    {filtered.map((ex) => (
                      <ExerciseCard
                        key={ex.id}
                        exercise={ex}
                        done={isDone(ex.id)}
                        onToggle={() => handleToggle(ex)}
                        onPlay={() => router.push(`/library/${ex.id}`)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>

      {playingRutina && (
        <RoutinePlayer
          rutina={playingRutina}
          onClose={() => setPlayingRutina(null)}
          onComplete={() => handleCompleteRutina(playingRutina)}
        />
      )}

      <Nav />
    </AuthGuard>
  );
}
