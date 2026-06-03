'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Nav from '@/components/Nav';
import ExerciseCard from '@/components/ExerciseCard';
import VideoPlayer from '@/components/VideoPlayer';
import Celebration from '@/components/Celebration';
import InstallPrompt from '@/components/InstallPrompt';
import NotificationToggle from '@/components/NotificationToggle';
import LogActivitySheet from '@/components/LogActivitySheet';
import { IconAdd, IconFire, IconCheck, IconClose, IconLibrary } from '@/components/icons';
import {
  getEjercicios,
  getRutinas,
  getRegistrosHoy,
  getActividadesGuardadas,
  marcarHecho,
  marcarRutinaHecha,
  desmarcarHecho,
  registrarActividad,
  eliminarActividadGuardada,
  getRachaActual,
  getTotalSemana,
} from '@/lib/firestore';
import type { ActividadGuardada, Exercise, Registro, Rutina } from '@/types';

export default function TodayPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [saved, setSaved] = useState<ActividadGuardada[]>([]);
  const [playing, setPlaying] = useState<Exercise | null>(null);
  const [racha, setRacha] = useState(0);
  const [semana, setSemana] = useState(0);
  const [loading, setLoading] = useState(true);
  const [celebrate, setCelebrate] = useState(0);

  // Hoja de registro
  const [sheetOpen, setSheetOpen] = useState(false);

  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  useEffect(() => {
    async function load() {
      const [exs, ruts, regs, acts, r, s] = await Promise.all([
        getEjercicios(),
        getRutinas(),
        getRegistrosHoy(),
        getActividadesGuardadas(),
        getRachaActual(),
        getTotalSemana(),
      ]);
      setExercises(exs);
      setRutinas(ruts);
      setRegistros(regs);
      setSaved(acts);
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
  function isRutinaDone(id: string) {
    return registros.some((r) => r.rutinaId === id);
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

  async function handleToggleRutina(rut: Rutina) {
    const reg = registros.find((r) => r.rutinaId === rut.id);
    if (reg) {
      setRegistros((prev) => prev.filter((r) => r.id !== reg.id));
      await desmarcarHecho(reg.id);
    } else {
      setCelebrate((n) => n + 1);
      const id = await marcarRutinaHecha(rut.id);
      setRegistros((prev) => [
        ...prev,
        { id, rutinaId: rut.id, fecha: new Date().toISOString().split('T')[0], completadoAt: new Date() },
      ]);
    }
    refreshStats();
  }

  async function handleLogFree(text: string) {
    const nombre = text.trim();
    if (!nombre) return;
    setCelebrate((n) => n + 1);
    const id = await registrarActividad(nombre);
    setRegistros((prev) => [
      ...prev,
      { id, actividad: nombre, fecha: new Date().toISOString().split('T')[0], completadoAt: new Date() },
    ]);
    // Refresca las pills (puede haber una nueva o subir de uso).
    getActividadesGuardadas().then(setSaved);
    refreshStats();
  }

  async function handleDeleteSaved(a: ActividadGuardada) {
    setSaved((prev) => prev.filter((x) => x.id !== a.id));
    await eliminarActividadGuardada(a.id);
  }

  async function handleUndoActividad(reg: Registro) {
    setRegistros((prev) => prev.filter((r) => r.id !== reg.id));
    await desmarcarHecho(reg.id);
    refreshStats();
  }

  const done = exercises.filter((e) => isDone(e.id));
  const pending = exercises.filter((e) => !isDone(e.id));

  // "Hecho hoy" suelto = libre (texto) o rutina completada (no ligado a un ejercicio).
  const rutinaTitulo = (id?: string) => rutinas.find((r) => r.id === id)?.titulo;
  const sueltos = registros
    .filter((r) => !r.ejercicioId)
    .map((r) => ({
      reg: r,
      label: r.actividad ?? rutinaTitulo(r.rutinaId) ?? 'Entrenamiento',
    }));

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
            {/* Instalar app (solo aparece si el navegador lo permite) */}
            <InstallPrompt />

            {/* Activar notificaciones (solo aparece si aún no están activas) */}
            <NotificationToggle />

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
                <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ color: 'var(--color-accent)' }}>
                  <IconFire size={28} />
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

            {/* Registro rápido → abre la hoja con 3 zonas */}
            <button
              onClick={() => setSheetOpen(true)}
              className="w-full py-4 rounded-2xl text-white font-medium text-sm flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              <IconAdd size={18} />
              Registrar entrenamiento de hoy
            </button>

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
              {/* Actividades / rutinas marcadas hoy */}
              {sueltos.length > 0 && (
                <section>
                  <h2 className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--color-muted)' }}>
                    Entrenamientos de hoy · {sueltos.length}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {sueltos.map(({ reg, label }) => (
                      <div
                        key={reg.id}
                        className="flex items-center gap-2 pl-4 pr-2 py-2 rounded-full text-sm"
                        style={{ backgroundColor: 'var(--color-done-bg)', border: '1px solid #c5d9bf', color: 'var(--color-text)' }}
                      >
                        <span className="flex items-center gap-1" style={{ color: 'var(--color-accent)' }}>
                          <IconCheck size={14} /> <span style={{ color: 'var(--color-text)' }}>{label}</span>
                        </span>
                        <button
                          onClick={() => handleUndoActividad(reg)}
                          className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ color: 'var(--color-muted)' }}
                          aria-label="Deshacer"
                        >
                          <IconClose size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {exercises.length === 0 && sueltos.length === 0 && (
                <div className="text-center py-16 space-y-3">
                  <div className="flex justify-center opacity-20"><IconLibrary size={48} /></div>
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

      {/* Hoja de registro (3 zonas) */}
      <LogActivitySheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        exercises={exercises}
        rutinas={rutinas}
        saved={saved}
        isExerciseDone={isDone}
        isRutinaDone={isRutinaDone}
        onMarkExercise={handleToggle}
        onMarkRutina={handleToggleRutina}
        onLogFree={handleLogFree}
        onDeleteSaved={handleDeleteSaved}
      />

      <Nav />
    </AuthGuard>
  );
}
