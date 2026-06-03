'use client';

import { useState, useMemo } from 'react';
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
  const [search, setSearch] = useState('');
  const [confirm, setConfirm] = useState<string | null>(null); // pill recién marcada (feedback)

  const q = search.trim().toLowerCase();
  const exFiltered = useMemo(
    () => (q ? exercises.filter((e) => e.titulo.toLowerCase().includes(q)) : exercises),
    [exercises, q]
  );
  const rutFiltered = useMemo(
    () => (q ? rutinas.filter((r) => r.titulo.toLowerCase().includes(q)) : rutinas),
    [rutinas, q]
  );

  if (!open) return null;

  function flash(label: string) {
    setConfirm(label);
    setTimeout(() => setConfirm((c) => (c === label ? null : c)), 1100);
  }

  function handleFree() {
    const t = text.trim();
    if (!t) return;
    onLogFree(t);
    flash(t);
    setText('');
  }

  function tapPill(a: ActividadGuardada) {
    onLogFree(a.nombre);
    flash(a.nombre);
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
        <div className="pt-3 pb-2 px-5 flex-shrink-0">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full" style={{ backgroundColor: 'var(--color-border)' }} />
          <div className="flex items-center justify-between">
            <h2 className="text-2xl" style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--color-text)' }}>
              Registrar de hoy
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
          {confirm && (
            <p className="text-xs mt-1" style={{ color: 'var(--color-accent)' }}>
              ✓ “{confirm}” marcado hoy
            </p>
          )}
        </div>

        <div className="overflow-y-auto px-5 pb-8 space-y-6">
          {/* ── Zona 1: elegir de biblioteca ───────────────────── */}
          {(exercises.length > 0 || rutinas.length > 0) && (
            <div>
              <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--color-muted)' }}>
                Elige de tu biblioteca
              </label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar…"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none mb-3"
                style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              />
              <div className="space-y-2">
                {rutFiltered.map((r) => {
                  const done = isRutinaDone(r.id);
                  return (
                    <button
                      key={r.id}
                      onClick={() => onMarkRutina(r)}
                      className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left"
                      style={{
                        backgroundColor: done ? 'var(--color-done-bg)' : 'var(--color-bg-card)',
                        border: `1px solid ${done ? '#c5d9bf' : 'var(--color-border)'}`,
                      }}
                    >
                      <span className="text-base">▦</span>
                      <span className="flex-1 min-w-0 truncate text-sm" style={{ color: 'var(--color-text)' }}>
                        {r.titulo}
                        <span style={{ color: 'var(--color-muted)' }}> · rutina</span>
                      </span>
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs border flex-shrink-0"
                        style={{
                          backgroundColor: done ? 'var(--color-accent)' : 'transparent',
                          borderColor: done ? 'var(--color-accent)' : 'var(--color-border)',
                          color: done ? 'white' : 'var(--color-muted)',
                        }}
                      >
                        {done ? '✓' : '○'}
                      </span>
                    </button>
                  );
                })}
                {exFiltered.map((ex) => {
                  const done = isExerciseDone(ex.id);
                  return (
                    <button
                      key={ex.id}
                      onClick={() => onMarkExercise(ex)}
                      className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left"
                      style={{
                        backgroundColor: done ? 'var(--color-done-bg)' : 'var(--color-bg-card)',
                        border: `1px solid ${done ? '#c5d9bf' : 'var(--color-border)'}`,
                      }}
                    >
                      {ex.miniatura ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={ex.miniatura} alt="" className="w-10 h-8 rounded object-cover flex-shrink-0" />
                      ) : (
                        <span className="text-base">▶</span>
                      )}
                      <span className="flex-1 min-w-0 truncate text-sm" style={{ color: 'var(--color-text)' }}>
                        {ex.titulo}
                        <span style={{ color: 'var(--color-muted)' }}> · {ex.categoria}</span>
                      </span>
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs border flex-shrink-0"
                        style={{
                          backgroundColor: done ? 'var(--color-accent)' : 'transparent',
                          borderColor: done ? 'var(--color-accent)' : 'var(--color-border)',
                          color: done ? 'white' : 'var(--color-muted)',
                        }}
                      >
                        {done ? '✓' : '○'}
                      </span>
                    </button>
                  );
                })}
                {q && exFiltered.length === 0 && rutFiltered.length === 0 && (
                  <p className="text-sm text-center py-3" style={{ color: 'var(--color-muted)' }}>
                    Nada coincide con “{search}”.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Zona 2: pills guardadas ────────────────────────── */}
          {saved.length > 0 && (
            <div>
              <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--color-muted)' }}>
                Tus actividades
              </label>
              <div className="flex flex-wrap gap-2">
                {saved.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center rounded-full overflow-hidden"
                    style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
                  >
                    <button
                      onClick={() => tapPill(a)}
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
              </div>
            </div>
          )}

          {/* ── Zona 3: escribir nueva (al final, no abre teclado de una) ── */}
          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--color-muted)' }}>
              O escribe lo que hiciste
            </label>
            <div className="flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleFree(); }}
                placeholder="ej. Correr 30 min"
                className="flex-1 rounded-xl px-4 py-3 text-sm outline-none"
                style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              />
              <button
                onClick={handleFree}
                disabled={!text.trim()}
                className="px-4 rounded-xl text-white text-sm font-medium disabled:opacity-40"
                style={{ backgroundColor: 'var(--color-accent)' }}
              >
                ✓
              </button>
            </div>
            <p className="text-[11px] mt-1.5" style={{ color: 'var(--color-muted)' }}>
              Se guarda para reusarla la próxima vez.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
