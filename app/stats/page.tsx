'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Nav from '@/components/Nav';
import Heatmap from '@/components/Heatmap';
import { IconFire } from '@/components/icons';
import { getEjercicios, getRegistrosTodos, getRachaActual, getTotalSemana } from '@/lib/firestore';
import {
  countByDate,
  rachaMasLarga,
  totalEsteMes,
  porCategoria,
  calcularLogros,
} from '@/lib/stats';
import type { Exercise, Registro } from '@/types';

export default function StatsPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [rachaAct, setRachaAct] = useState(0);
  const [semana, setSemana] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [exs, regs, r, s] = await Promise.all([
        getEjercicios(),
        getRegistrosTodos(),
        getRachaActual(),
        getTotalSemana(),
      ]);
      setExercises(exs);
      setRegistros(regs);
      setRachaAct(r);
      setSemana(s);
      setLoading(false);
    }
    load();
  }, []);

  const total = registros.length;
  const rachaMax = rachaMasLarga(registros);
  const mes = totalEsteMes(registros);
  const counts = countByDate(registros);
  const categorias = porCategoria(registros, exercises);
  const logros = calcularLogros({ total, rachaMax });
  const maxCat = categorias[0]?.count ?? 1;

  const stat = (valor: React.ReactNode, label: string) => (
    <div
      className="flex-1 rounded-2xl px-4 py-4 text-center"
      style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
    >
      <p className="text-3xl" style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--color-accent)' }}>
        {valor}
      </p>
      <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>{label}</p>
    </div>
  );

  return (
    <AuthGuard>
      <div className="min-h-screen pb-24" style={{ backgroundColor: 'var(--color-bg)' }}>
        <header className="px-5 pt-12 pb-4">
          <h1 className="text-4xl" style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--color-text)' }}>
            Progreso
          </h1>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 border-current border-t-transparent animate-spin opacity-30" />
          </div>
        ) : (
          <main className="px-5 space-y-8">
            {/* Resumen */}
            <div className="space-y-4">
              <div className="flex gap-3">
                {stat(<span className="inline-flex items-center gap-1.5"><IconFire size={22} />{rachaAct}</span>, 'racha actual')}
                {stat(rachaMax, 'racha más larga')}
              </div>
              <div className="flex gap-3">
                {stat(total, 'total')}
                {stat(mes, 'este mes')}
                {stat(semana, 'esta semana')}
              </div>
            </div>

            {/* Mapa de calor */}
            <section>
              <h2 className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--color-muted)' }}>
                Actividad
              </h2>
              {total === 0 ? (
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                  Aún no hay entrenamientos. ¡Empieza hoy! 💪
                </p>
              ) : (
                <Heatmap counts={counts} />
              )}
            </section>

            {/* Por categoría */}
            {categorias.length > 0 && (
              <section>
                <h2 className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--color-muted)' }}>
                  Por categoría
                </h2>
                <div className="space-y-2">
                  {categorias.map((c) => (
                    <div key={c.categoria} className="flex items-center gap-3">
                      <span className="text-xs w-20 flex-shrink-0 truncate" style={{ color: 'var(--color-text)' }}>
                        {c.categoria}
                      </span>
                      <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg-card)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(c.count / maxCat) * 100}%`, backgroundColor: 'var(--color-accent)' }}
                        />
                      </div>
                      <span className="text-xs w-6 text-right flex-shrink-0" style={{ color: 'var(--color-muted)' }}>
                        {c.count}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Logros */}
            <section>
              <h2 className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--color-muted)' }}>
                Logros · {logros.filter((l) => l.unlocked).length}/{logros.length}
              </h2>
              <div className="grid grid-cols-4 gap-3">
                {logros.map((l) => (
                  <div
                    key={l.id}
                    title={`${l.titulo} — ${l.desc}`}
                    className="rounded-2xl py-3 px-1 flex flex-col items-center text-center"
                    style={{
                      backgroundColor: l.unlocked ? 'var(--color-done-bg)' : 'var(--color-bg-card)',
                      border: `1px solid ${l.unlocked ? '#c5d9bf' : 'var(--color-border)'}`,
                      opacity: l.unlocked ? 1 : 0.45,
                      filter: l.unlocked ? 'none' : 'grayscale(1)',
                    }}
                  >
                    <span className="text-2xl leading-none">{l.icon}</span>
                    <span className="text-[10px] mt-1 leading-tight" style={{ color: 'var(--color-text)' }}>
                      {l.titulo}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </main>
        )}
      </div>

      <Nav />
    </AuthGuard>
  );
}
