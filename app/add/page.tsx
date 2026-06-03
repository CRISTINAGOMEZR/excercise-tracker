'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import Nav from '@/components/Nav';
import AddExerciseForm from '@/components/AddExerciseForm';
import RoutineForm from '@/components/RoutineForm';
import { getRutina, getEjercicio } from '@/lib/firestore';
import type { Rutina, Exercise } from '@/types';

type Mode = 'ejercicio' | 'rutina';

function AddContent() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get('edit');

  const [mode, setMode] = useState<Mode>('ejercicio');
  const [editRutina, setEditRutina] = useState<Rutina | null>(null);
  const [editEjercicio, setEditEjercicio] = useState<Exercise | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(!!editId);

  useEffect(() => {
    if (!editId) return;
    (async () => {
      // Puede ser un ejercicio o una rutina: probamos ejercicio primero.
      const ex = await getEjercicio(editId);
      if (ex) {
        setEditEjercicio(ex);
        setMode('ejercicio');
      } else {
        const r = await getRutina(editId);
        setEditRutina(r);
        setMode('rutina');
      }
      setLoadingEdit(false);
    })();
  }, [editId]);

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'var(--color-bg)' }}>
      <header className="px-5 pt-12 pb-5 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-11 h-11 flex items-center justify-center rounded-full"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
          aria-label="Volver"
        >
          ←
        </button>
        <h1 className="text-4xl" style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--color-text)' }}>
          {editId
            ? (mode === 'rutina' ? 'Editar rutina' : 'Editar ejercicio')
            : mode === 'rutina' ? 'Nueva rutina' : 'Nuevo ejercicio'}
        </h1>
      </header>

      <main className="px-5">
        {/* Selector ejercicio / rutina (oculto al editar) */}
        {!editId && (
          <div
            className="flex rounded-xl p-1 mb-6"
            style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
          >
            {(['ejercicio', 'rutina'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: mode === m ? 'white' : 'transparent',
                  color: mode === m ? 'var(--color-text)' : 'var(--color-muted)',
                  boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {m === 'ejercicio' ? 'Un ejercicio' : 'Rutina (varios)'}
              </button>
            ))}
          </div>
        )}

        {loadingEdit ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 border-current border-t-transparent animate-spin opacity-30" />
          </div>
        ) : mode === 'ejercicio' ? (
          <AddExerciseForm initial={editEjercicio ?? undefined} />
        ) : (
          <RoutineForm initial={editRutina ?? undefined} />
        )}
      </main>
    </div>
  );
}

export default function AddPage() {
  return (
    <AuthGuard>
      <Suspense fallback={null}>
        <AddContent />
      </Suspense>
      <Nav />
    </AuthGuard>
  );
}
