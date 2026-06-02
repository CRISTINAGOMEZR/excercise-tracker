'use client';

import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import Nav from '@/components/Nav';
import AddExerciseForm from '@/components/AddExerciseForm';

export default function AddPage() {
  const router = useRouter();

  return (
    <AuthGuard>
      <div className="min-h-screen pb-24" style={{ backgroundColor: 'var(--color-bg)' }}>
        {/* Header */}
        <header className="px-5 pt-12 pb-6 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-11 h-11 flex items-center justify-center rounded-full transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-muted)',
            }}
            aria-label="Volver"
          >
            ←
          </button>
          <h1 className="text-4xl" style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--color-text)' }}>
            Nuevo ejercicio
          </h1>
        </header>

        <main className="px-5">
          <AddExerciseForm />
        </main>
      </div>
      <Nav />
    </AuthGuard>
  );
}
