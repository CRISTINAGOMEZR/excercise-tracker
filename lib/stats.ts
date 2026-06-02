import type { Exercise, Registro } from '@/types';

/** Fecha en formato YYYY-MM-DD (UTC, igual que se guardan los registros). */
export function ymd(d: Date): string {
  return d.toISOString().split('T')[0];
}

/** Conteo de registros por fecha. */
export function countByDate(registros: Registro[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of registros) m.set(r.fecha, (m.get(r.fecha) ?? 0) + 1);
  return m;
}

/** Racha consecutiva más larga (en días con al menos un registro). */
export function rachaMasLarga(registros: Registro[]): number {
  const dias = [...new Set(registros.map((r) => r.fecha))].sort();
  if (dias.length === 0) return 0;
  let best = 1;
  let cur = 1;
  for (let i = 1; i < dias.length; i++) {
    const prev = Date.parse(`${dias[i - 1]}T00:00:00Z`);
    const curD = Date.parse(`${dias[i]}T00:00:00Z`);
    const diff = Math.round((curD - prev) / 86_400_000);
    if (diff === 1) cur++;
    else if (diff > 1) cur = 1;
    best = Math.max(best, cur);
  }
  return best;
}

/** Total de registros del mes actual. */
export function totalEsteMes(registros: Registro[]): number {
  const mes = ymd(new Date()).slice(0, 7); // YYYY-MM
  return registros.filter((r) => r.fecha.startsWith(mes)).length;
}

/** Conteo por categoría (las actividades libres se agrupan como "Libre"). */
export function porCategoria(
  registros: Registro[],
  exercises: Exercise[]
): { categoria: string; count: number }[] {
  const exMap = new Map(exercises.map((e) => [e.id, e.categoria]));
  const counts = new Map<string, number>();
  for (const r of registros) {
    const cat = r.ejercicioId ? exMap.get(r.ejercicioId) ?? 'Otro' : 'Libre';
    counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([categoria, count]) => ({ categoria, count }))
    .sort((a, b) => b.count - a.count);
}

export interface Logro {
  id: string;
  icon: string;
  titulo: string;
  desc: string;
  unlocked: boolean;
}

export function calcularLogros(p: { total: number; rachaMax: number }): Logro[] {
  return [
    { id: 'first', icon: '🌱', titulo: 'Primer paso', desc: 'Tu primer entrenamiento', unlocked: p.total >= 1 },
    { id: 'r3',    icon: '🔥', titulo: 'En marcha',     desc: 'Racha de 3 días',        unlocked: p.rachaMax >= 3 },
    { id: 't10',   icon: '💪', titulo: 'Constante',     desc: '10 entrenamientos',      unlocked: p.total >= 10 },
    { id: 'r7',    icon: '⭐', titulo: 'Semana perfecta', desc: 'Racha de 7 días',      unlocked: p.rachaMax >= 7 },
    { id: 't25',   icon: '🏅', titulo: 'Dedicada',      desc: '25 entrenamientos',      unlocked: p.total >= 25 },
    { id: 't50',   icon: '🏆', titulo: 'Atleta',        desc: '50 entrenamientos',      unlocked: p.total >= 50 },
    { id: 'r30',   icon: '👑', titulo: 'Imparable',     desc: 'Racha de 30 días',       unlocked: p.rachaMax >= 30 },
    { id: 't100',  icon: '💎', titulo: 'Leyenda',       desc: '100 entrenamientos',     unlocked: p.total >= 100 },
  ];
}
