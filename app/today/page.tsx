'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Nav from '@/components/Nav';
import ExerciseCard from '@/components/ExerciseCard';
import VideoPlayer from '@/components/VideoPlayer';
import Celebration from '@/components/Celebration';
import {
  getEjercicios,
  getRegistrosHoy,
  marcarHecho,
  desmarcarHecho,
  registrarActividad,
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
  const [celebrate, setCelebrate] = useState(0);

  // Registro rápido
  const [logOpen, setLogOpen] = useState(false);
  const [logText, setLogText] = useState('');
  const [logSaving, setLogSaving] = useState(false);

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

  async function refreshStats() {
    const [r, s] = await Promise.all([getRachaActual(), getTotalSemana()]);
    setRacha(r);
    setSemana(s);
  }

  function isDone(exId: string) {
    return registros.some((r) => r.ejercicioId === exId);
  }

  async function handleToggle(ex: Exercise) {
    const reg = registros.find((r) => r.ejercicioId === ex.id);
    if (reg) {
      setRegistros((prev) => prev.filter((r) => r.id !== reg.id));
      await desmarcarHecho(reg.id);
    } else {
      setCelebrate((n) => n + 1);
      const id = await marcarHecho(ex.id);
      setRegistros((prev) => [
        ...prev,
        { id, ejercicioId: ex.id, fecha: new Date().toISOString().split('T')[0], completadoAt: new Date() },
      ]);
    }
    refreshStats();
  }

  async function handleLog() {
    setLogSaving(true);
    setCelebrate((n) => n + 1);
    const nombre = logText.trim();
    const id = await registrarActividad(nombre);
    setRegistros((prev) => [
      ...prev,
      { id, actividad: nombre || 'Entrenamiento', fecha: new Date().toISOString().split('T')[0], completadoAt: new Date() },
    ]);
    setLogText('');
    setLogOpen(false);
    setLogSaving(false);
    refreshStats();
  }

  async function handleUndoActividad(reg: Registro) {
    setRegistros((prev) => prev.filter((r) => r.id !== reg.id));
    await desmarcarHecho(reg.id);
    refreshStats();
  }

  const done = exercises.filter((e) => isDone(e.id));
  const pending = exercises.filter((e) => !isDone(e.id));
  const actividades = registros.filter((r) => !r.ejercicioId);

  // Cuántas cosas hechas hoy (ejercicios + actividades libres)
  const hechoHoy = registros.length;
  const metaCumplida = hechoHoy >= 1;

  // Anillo de progreso del día
  const ringTotal = exercises.length || 1;
  const ringDone = exercises.length ? done.length : (metaCumplida ? 1 : 0);
  const ringPct = Math.min(ringDone / ringTotal, 1);

  const motiv = metaCumplida
    ? '¡Lo lograste hoy! Tu racha sigue viva 🎉'
    : racha > 0
      ? `¡No rompas tu racha de ${racha} ${racha === 1 ? 'día' : 'días'}! Muévete hoy.`
      : 'Empieza hoy tu racha. Un paso a la vez 💪';

  return (
    <AuthGuard>
      <Celebration trigger={celebrate} />
      <div className="min-h-screen pb-24" style={{ backgroundColor: 'var(--color-bg)' }}>
        {/* Header */}
        <header className="px-5 pt-12 pb-4">
          <p className="text-xs uppercase tracking-widest mb-1 capitalize" style={{ color: 'var(--color-muted)' }}>
            {today}
          </p>
          <h1 className="text-4xl" style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--color-text)' }}>
            Hoy
          </h1>
        </header>

        {!loading && (
          <div className="px-5 space-y-4">
            {/* Hero: racha + meta diaria */}
            <div
              className="rounded-3xl p-5 flex items-center gap-5"
              style={{ backgroundColor: 'var(--color-done-bg)', border: '1px solid #c5d9bf' }}
            >
              {/* Anillo de progreso */}
              <div className="relative flex-shrink-0" style={{ width: 92, height: 92 }}>
                <svg width="92" height="92" viewBox="0 0 92 92">
                  <circle cx="46" cy="46" r="40" fill="none" stroke="#ffffff" strokeWidth="8" opacity="0.6" />
                  <circle
                    cx="46" cy="46" r="40" fill="none"
                    stroke="var(--color-accent)" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - ringPct)}
                    transform="rotate(-90 46 46)"
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl leading-none">🔥</span>
                  <span
                    className="text-xl leading-none mt-0.5"
                    style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--color-accent)' }}
                  >
                    {racha}
                  </span>
                </div>
              </div>

              {/* Texto motivador */}
              <div className="min-w-0">
                <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                  {racha > 0 ? `Racha de ${racha} ${racha === 1 ? 'día' : 'días'}` : 'Sin racha todavía'}
                </p>
                <p className="text-sm mt-1 leading-snug" style={{ color: 'var(--color-muted)' }}>
                  {motiv}
                </p>
              </div>
            </div>

            {/* Registro rápido */}
            {!logOpen ? (
              <button
                onClick={() => setLogOpen(true)}
                className="w-full py-4 rounded-2xl text-white font-medium text-sm flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--color-accent)' }}
              >
                <span className="text-lg leading-none">＋</span>
                Registrar entrenamiento de hoy
              </button>
            ) : (
              <div
                className="rounded-2xl p-4 space-y-3"
                style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
              >
                <input
                  autoFocus
                  value={logText}
                  onChange={(e) => setLogText(e.target.value)}
                  placeholder="¿Qué hiciste? (opcional, ej. Correr 30 min)"
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleLog(); }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleLog}
                    disabled={logSaving}
                    className="flex-1 py-3 rounded-xl text-white font-medium text-sm disabled:opacity-60"
                    style={{ backgroundColor: 'var(--color-accent)' }}
                  >
                    {logSaving ? 'Guardando…' : '✓ Marcar hecho'}
                  </button>
                  <button
                    onClick={() => { setLogOpen(false); setLogText(''); }}
                    className="px-4 py-3 rounded-xl text-sm"
                    style={{ border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Stats secundarias */}
            <div className="flex gap-4">
              <div
                className="flex-1 rounded-2xl px-4 py-3 text-center"
                style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
              >
                <p className="text-2xl" style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--color-accent)' }}>
                  {semana}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>esta semana</p>
              </div>
              <div
                className="flex-1 rounded-2xl px-4 py-3 text-center"
                style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
              >
                <p className="text-2xl" style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--color-accent)' }}>
                  {hechoHoy}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>hecho hoy</p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <main className="px-5 mt-8 space-y-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 rounded-full border-2 border-current border-t-transparent animate-spin opacity-30" />
            </div>
          ) : (
            <>
              {/* Actividades libres de hoy */}
              {actividades.length > 0 && (
                <section>
                  <h2 className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--color-muted)' }}>
                    Entrenamientos de hoy · {actividades.length}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {actividades.map((reg) => (
                      <div
                        key={reg.id}
                        className="flex items-center gap-2 pl-4 pr-2 py-2 rounded-full text-sm"
                        style={{ backgroundColor: 'var(--color-done-bg)', border: '1px solid #c5d9bf', color: 'var(--color-text)' }}
                      >
                        <span>✓ {reg.actividad}</span>
                        <button
                          onClick={() => handleUndoActividad(reg)}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                          style={{ color: 'var(--color-muted)' }}
                          aria-label="Deshacer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {exercises.length === 0 && actividades.length === 0 && (
                <div className="text-center py-16 space-y-3">
                  <p className="text-5xl opacity-20">◫</p>
                  <p style={{ color: 'var(--color-muted)' }}>
                    Tu biblioteca está vacía. Registra un entrenamiento arriba o agrega ejercicios.
                  </p>
                  <a href="/add" className="inline-block text-sm underline underline-offset-4" style={{ color: 'var(--color-accent)' }}>
                    Agregar ejercicio
                  </a>
                </div>
              )}

              {/* Pendientes */}
              {pending.length > 0 && (
                <section>
                  <h2 className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--color-muted)' }}>
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
                  <h2 className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--color-muted)' }}>
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
