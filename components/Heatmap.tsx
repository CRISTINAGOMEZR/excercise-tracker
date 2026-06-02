'use client';

import { ymd } from '@/lib/stats';

interface Props {
  counts: Map<string, number>;
  weeks?: number;
}

const SHADES = ['#ece7df', '#cfe0c8', '#a9c79d', '#85ab78', '#5f8451'];
const DOW = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function shade(count: number): string {
  if (!count) return SHADES[0];
  if (count === 1) return SHADES[1];
  if (count === 2) return SHADES[2];
  if (count === 3) return SHADES[3];
  return SHADES[4];
}

export default function Heatmap({ counts, weeks = 18 }: Props) {
  // Base: hoy (UTC). La última columna es la semana actual.
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dow = todayUTC.getUTCDay(); // 0=Dom

  // Inicio = domingo de hace (weeks-1) semanas.
  const start = new Date(todayUTC);
  start.setUTCDate(todayUTC.getUTCDate() - dow - (weeks - 1) * 7);

  const cols: { date: Date; key: string; future: boolean }[][] = [];
  const monthLabels: (string | null)[] = [];

  for (let w = 0; w < weeks; w++) {
    const col: { date: Date; key: string; future: boolean }[] = [];
    let labelForCol: string | null = null;
    for (let d = 0; d < 7; d++) {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + w * 7 + d);
      const future = date.getTime() > todayUTC.getTime();
      // etiqueta de mes: primera vez que aparece el día 1-7 del mes en la fila superior
      if (d === 0 && date.getUTCDate() <= 7) labelForCol = MESES[date.getUTCMonth()];
      col.push({ date, key: ymd(date), future });
    }
    monthLabels.push(labelForCol);
    cols.push(col);
  }

  const cell = 14;
  const gap = 3;

  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <div className="inline-block">
        {/* Etiquetas de mes */}
        <div className="flex" style={{ gap, marginLeft: 16, marginBottom: 4 }}>
          {monthLabels.map((m, i) => (
            <div key={i} style={{ width: cell }} className="text-[9px]" >
              <span style={{ color: 'var(--color-muted)' }}>{m ?? ''}</span>
            </div>
          ))}
        </div>
        <div className="flex">
          {/* Columna de días de la semana */}
          <div className="flex flex-col mr-1" style={{ gap }}>
            {DOW.map((d, i) => (
              <div key={i} style={{ height: cell, width: 12 }} className="text-[8px] flex items-center" >
                <span style={{ color: 'var(--color-muted)' }}>{i % 2 ? d : ''}</span>
              </div>
            ))}
          </div>
          {/* Celdas */}
          <div className="flex" style={{ gap }}>
            {cols.map((col, ci) => (
              <div key={ci} className="flex flex-col" style={{ gap }}>
                {col.map((c) => {
                  const count = counts.get(c.key) ?? 0;
                  return (
                    <div
                      key={c.key}
                      title={`${c.key}: ${count} ${count === 1 ? 'entrenamiento' : 'entrenamientos'}`}
                      style={{
                        width: cell,
                        height: cell,
                        borderRadius: 3,
                        backgroundColor: c.future ? 'transparent' : shade(count),
                        border: c.future ? 'none' : '1px solid rgba(0,0,0,0.03)',
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
