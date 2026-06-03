'use client';

import { useState, useEffect } from 'react';
import type { ActividadGuardada, Exercise, Rutina } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  exercises: Exercise[];
  rutinas: Rutina[];
  saved: ActividadGuardada[];
  isExerciseDone: (id: string) => boolean;
  isRutinaDone: (id: string) => boolean;
  onMarkExercise: (ex: Exercise) => void;
  onMarkRutina: (rut: Rutina) => void;
  onLogFree: (text: string) => void;
  onDeleteSaved: (a: ActividadGuardada) => void;
}

export default function LogActivitySheet({
  open,
  onClose,
  exercises,
  rutinas,
  saved,
  isExerciseDone,
  isRutinaDone,
  onMarkExercise,
  onMarkRutina,
  onLogFree,
  onDeleteSaved,
}: Props) {
  const [text, setText] = useState('');

  // Bloquea el scroll del fondo mientras la hoja está abierta.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  function pickExercise(ex: Exercise) {
    onMarkExercise(ex);
    onClose();
  }
  function pickRutina(rut: Rutina) {
    onMarkRutina(rut);
    onClose();
  }
  function pickSaved(a: ActividadGuardada) {
    onLogFree(a.nombre);
    onClose();
  }
  function handleFree() {
    const t = text.trim();
    if (!t) return;
    onLogFree(t);
    setText('');
    onClose();
  }

  const hayBiblioteca = exercises.length > 0 || rutinas.length > 0;

  // Estilo base de pill (chip).
  function pillStyle(done: boolean): React.CSSProperties {
    return {
      backgroundColor: done ? 'var(--color-done-bg)' : 'var(--color-bg-card)',
      border: `1px solid ${done ? '#c5d9bf' : 'var(--color-border)'}`,
      color: 'var(--color-text)',
    };
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      {/* Backdrop */}
      <button
        onClick={onClose}
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(20,20,20,0.45)' }}
        aria-label="Cerrar"
      />

      {/* Sheet */}
      <div
        className="relative rounded-t-3xl flex flex-col"
        style={{
          backgroundColor: 'var(--color-bg)',
          maxHeight: '85vh',
          boxShadow: '0 -8px 30px rgba(0,0,0,0.18)',
        }}
      >
        {/* Handle + header */}
        <div className="pt-3 pb-3 px-5 flex-shrink-0">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full" style={{ backgroundColor: 'var(--color-border)' }} />
          <div className="flex items-center justify-between">
            <h2 className="text-2xl" style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--color-text)' }}>
              Actividad de hoy
            </h2>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
              style={{ color: 'var(--color-muted)' }}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-5 pb-6">
          <label className="block text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--color-muted)' }}>
            Selecciona
          </label>

          <div className="flex flex-wrap gap-2">
            {/* Rutinas de la biblioteca (pills, sin ✕) */}
            {rutinas.map((r) => {
              const done = isRutinaDone(r.id);
              return (
                <button
                  key={`rut-${r.id}`}
                  onClick={() => pickRutina(r)}
                  className="px-4 py-2 rounded-full text-sm flex items-center gap-1.5"
                  style={pillStyle(done)}
                >
                  {done && <span style={{ color: 'var(--color-accent)' }}>✓</span>}
                  <span>▦ {r.titulo}</span>
                </button>
              );
            })}

            {/* Ejercicios de la biblioteca (pills, sin ✕) */}
            {exercises.map((ex) => {
              const done = isExerciseDone(ex.id);
              return (
                <button
                  key={`ex-${ex.id}`}
                  onClick={() => pickExercise(ex)}
                  className="px-4 py-2 rounded-full text-sm flex items-center gap-1.5"
                  style={pillStyle(done)}
                >
                  {done && <span style={{ color: 'var(--color-accent)' }}>✓</span>}
                  <span>{ex.titulo}</span>
                </button>
              );
            })}

            {/* Actividades guardadas (pills, con ✕ para borrar) */}
            {saved.map((a) => (
              <div
                key={`saved-${a.id}`}
                className="flex items-center rounded-full overflow-hidden"
                style={pillStyle(false)}
              >
                <button
                  onClick={() => pickSaved(a)}
                  className="pl-4 pr-2 py-2 text-sm"
                  style={{ color: 'var(--color-text)' }}
                >
                  {a.nombre}
                </button>
                <button
                  onClick={() => onDeleteSaved(a)}
                  className="pr-3 pl-1 py-2 text-xs"
                  style={{ color: 'var(--color-muted)' }}
                  aria-label={`Borrar ${a.nombre}`}
                >
                  ✕
                </button>
              </div>
            ))}

            {!hayBiblioteca && saved.length === 0 && (
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                Aún no tienes actividades. Escribe una abajo 👇
              </p>
            )}
          </div>

          {/* Agregar nueva (compacto, una sola línea) */}
          <div className="flex gap-2 mt-5">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleFree(); }}
              placeholder="+ Escribe otra actividad…"
              className="flex-1 rounded-full px-4 py-2.5 text-sm outline-none"
              style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
            />
            <button
              onClick={handleFree}
              disabled={!text.trim()}
              className="w-11 rounded-full text-white text-sm font-medium disabled:opacity-40 flex-shrink-0"
              style={{ backgroundColor: 'var(--color-accent)' }}
              aria-label="Agregar actividad"
            >
              ✓
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
