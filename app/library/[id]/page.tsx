'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import GuidedSession, { type PlayItem } from '@/components/GuidedSession';
import {
  getEjercicio,
  getRutina,
  getRegistrosHoy,
  marcarHecho,
  marcarRutinaHecha,
} from '@/lib/firestore';
import type { Exercise, Rutina } from '@/types';
import { ORDEN_FASE } from '@/types';

type Loaded =
  | { kind: 'exercise'; ex: Exercise }
  | { kind: 'rutina'; rut: Rutina }
  | null;

export default function DetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params.id);

  const [data, setData] = useState<Loaded>(null);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function load() {
      const [ex, regs] = await Promise.all([getEjercicio(id), getRegistrosHoy()]);
      if (ex) {
        setData({ kind: 'exercise', ex });
        setDone(regs.some((r) => r.ejercicioId === id));
      } else {
        const rut = await getRutina(id);
        if (rut) {
          setData({ kind: 'rutina', rut });
          setDone(regs.some((r) => r.rutinaId === id));
        }
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg)' }}>
          <div className="w-6 h-6 rounded-full border-2 border-current border-t-transparent animate-spin opacity-30" />
        </div>
      </AuthGuard>
    );
  }

  if (!data) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-5 text-center" style={{ backgroundColor: 'var(--color-bg)' }}>
          <p className="text-5xl opacity-20">◫</p>
          <p style={{ color: 'var(--color-muted)' }}>No se encontró este contenido.</p>
          <a href="/library" className="inline-block text-sm underline underline-offset-4" style={{ color: 'var(--color-accent)' }}>
            Volver a la biblioteca
          </a>
        </div>
      </AuthGuard>
    );
  }

  if (data.kind === 'exercise') {
    const { ex } = data;
    const items: PlayItem[] = [
      { id: ex.id, nombre: ex.titulo, tipo: ex.tipo, url: ex.url, notas: ex.notas },
    ];
    return (
      <AuthGuard>
        <GuidedSession
          titulo={ex.titulo}
          subtitulo={ex.categoria}
          thumbnail={ex.miniatura ?? null}
          duracionMin={ex.duracionMin}
          notas={ex.notas}
          items={items}
          done={done}
          onComplete={() => { marcarHecho(ex.id).catch(() => {}); }}
          onBack={() => router.back()}
        />
      </AuthGuard>
    );
  }

  // Rutina
  const { rut } = data;
  const ordenados = [...rut.items].sort((a, b) => ORDEN_FASE[a.fase] - ORDEN_FASE[b.fase]);
  const items: PlayItem[] = ordenados.map((it) => ({
    id: it.id,
    nombre: it.nombre,
    tipo: it.tipo,
    url: it.url,
    fase: it.fase,
    notas: it.notas,
  }));
  const thumbnail = ordenados.find((it) => it.miniatura)?.miniatura ?? null;
  const duracionMin = ordenados.reduce((sum, it) => sum + (it.duracionMin ?? 0), 0) || undefined;

  return (
    <AuthGuard>
      <GuidedSession
        titulo={rut.titulo}
        subtitulo="Rutina"
        thumbnail={thumbnail}
        duracionMin={duracionMin}
        items={items}
        done={done}
        onComplete={() => { marcarRutinaHecha(rut.id).catch(() => {}); }}
        onBack={() => router.back()}
      />
    </AuthGuard>
  );
}
