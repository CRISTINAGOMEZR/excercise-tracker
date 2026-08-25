/**
 * Tests de las funciones puras de `lib/stats.ts`.
 *
 * Se corren con el test runner nativo de Node (`node --test`) y
 * `--experimental-strip-types`, sin instalar ninguna dependencia. Ver el script
 * `npm test` en package.json.
 *
 * Reglas de este archivo:
 *  - Las fechas se escriben SIEMPRE como literales 'YYYY-MM-DD'. Nunca `new Date()`
 *    ni `ymd()`: los tests tienen que dar el mismo resultado en cualquier zona horaria
 *    y a cualquier hora del día.
 *  - `ymd()` y `totalEsteMes()` NO se testean a propósito: dependen de la hora/zona
 *    actual y hay un cambio pendiente de decidir sobre ellas (UTC → local). Fijar aquí
 *    su semántica actual haría que CI se pusiera roja justo cuando se arregle el bug.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  countByDate,
  rachaMasLarga,
  porCategoria,
  calcularLogros,
} from './stats.ts';
// Import solo de tipos: desaparece al ejecutar, así que no hace falta que el alias
// `@/` esté resuelto en runtime.
import type { Exercise, Registro } from '@/types';

// ─── Helpers ────────────────────────────────────────────────────────────────────

let seq = 0;

/** Registro mínimo con una fecha literal. `completadoAt` no lo usa ninguna de estas funciones. */
function reg(fecha: string, extra: Partial<Registro> = {}): Registro {
  return {
    id: `r${++seq}`,
    fecha,
    completadoAt: new Date(0),
    ...extra,
  };
}

/** Varios registros en fechas distintas, uno por fecha. */
function regs(...fechas: string[]): Registro[] {
  return fechas.map((f) => reg(f));
}

function ex(id: string, categoria: string): Exercise {
  return {
    id,
    titulo: `Ejercicio ${id}`,
    tipo: 'link',
    url: 'https://example.com/v',
    categoria,
    createdAt: new Date(0),
  };
}

/** Ids de los logros desbloqueados, que es lo que de verdad importa. */
function desbloqueados(total: number, rachaMax: number): string[] {
  return calcularLogros({ total, rachaMax })
    .filter((l) => l.unlocked)
    .map((l) => l.id);
}

// ─── rachaMasLarga ──────────────────────────────────────────────────────────────
//
// Es la regla de negocio central de la pantalla de stats y la más fácil de romper:
// ordena, deduplica y calcula distancias entre fechas en string.

describe('rachaMasLarga', () => {
  test('sin registros la racha es 0', () => {
    assert.equal(rachaMasLarga([]), 0);
  });

  test('un solo día es racha de 1', () => {
    assert.equal(rachaMasLarga(regs('2026-03-14')), 1);
  });

  test('días consecutivos suman', () => {
    assert.equal(rachaMasLarga(regs('2026-03-01', '2026-03-02', '2026-03-03')), 3);
  });

  test('un día de hueco corta la racha', () => {
    // 01, 02 · falta el 03 · 04, 05  →  la mejor racha es 2, no 4
    assert.equal(
      rachaMasLarga(regs('2026-03-01', '2026-03-02', '2026-03-04', '2026-03-05')),
      2
    );
  });

  test('días sueltos y separados dan racha de 1', () => {
    assert.equal(rachaMasLarga(regs('2026-03-01', '2026-03-10', '2026-04-20')), 1);
  });

  test('la entrada desordenada da el mismo resultado que la ordenada', () => {
    // Firestore no garantiza orden: la función tiene que ordenar por su cuenta.
    const desordenados = regs('2026-03-03', '2026-03-01', '2026-03-05', '2026-03-02');
    assert.equal(rachaMasLarga(desordenados), 3);
  });

  test('varios registros el mismo día cuentan como un día', () => {
    // Marcar 3 ejercicios el mismo día no infla la racha.
    const r = [
      reg('2026-03-01'),
      reg('2026-03-01'),
      reg('2026-03-01'),
      reg('2026-03-02'),
    ];
    assert.equal(rachaMasLarga(r), 2);
  });

  test('coge la racha más larga aunque esté al principio', () => {
    assert.equal(
      rachaMasLarga(regs('2026-03-01', '2026-03-02', '2026-03-03', '2026-03-20')),
      3
    );
  });

  test('coge la racha más larga aunque esté al final', () => {
    assert.equal(
      rachaMasLarga(regs('2026-03-01', '2026-03-10', '2026-03-11', '2026-03-12')),
      3
    );
  });

  test('coge la racha más larga aunque esté en medio', () => {
    assert.equal(
      rachaMasLarga(
        regs(
          '2026-03-01',
          '2026-03-10', '2026-03-11', '2026-03-12', '2026-03-13',
          '2026-03-20', '2026-03-21'
        )
      ),
      4
    );
  });

  test('la racha cruza el cambio de mes', () => {
    // 31 de enero → 1 de febrero es consecutivo, aunque el string cambie de mes.
    assert.equal(rachaMasLarga(regs('2026-01-31', '2026-02-01', '2026-02-02')), 3);
  });

  test('la racha cruza el cambio de año', () => {
    assert.equal(rachaMasLarga(regs('2025-12-31', '2026-01-01')), 2);
  });

  test('la racha cruza el 29 de febrero de un año bisiesto', () => {
    assert.equal(rachaMasLarga(regs('2024-02-28', '2024-02-29', '2024-03-01')), 3);
  });

  test('el 29 de febrero no existe en año no bisiesto: 28-feb y 1-mar son consecutivos', () => {
    assert.equal(rachaMasLarga(regs('2026-02-28', '2026-03-01')), 2);
  });

  test('la racha cruza el cambio de horario de primavera (España, 29-mar-2026)', () => {
    // El día del cambio de hora dura 23h. Si la resta se hiciera en hora local
    // sin normalizar, el diff dejaría de ser exactamente 1 día y se cortaría la racha.
    assert.equal(rachaMasLarga(regs('2026-03-28', '2026-03-29', '2026-03-30')), 3);
  });

  test('la racha cruza el cambio de horario de otoño (España, 25-oct-2026)', () => {
    // Ese día dura 25h.
    assert.equal(rachaMasLarga(regs('2026-10-24', '2026-10-25', '2026-10-26')), 3);
  });
});

// ─── countByDate ────────────────────────────────────────────────────────────────
//
// Alimenta el heatmap: cada celda es una fecha con su número de registros.

describe('countByDate', () => {
  test('sin registros devuelve un mapa vacío', () => {
    assert.equal(countByDate([]).size, 0);
  });

  test('cuenta varios registros del mismo día', () => {
    const m = countByDate([
      reg('2026-03-01'),
      reg('2026-03-01'),
      reg('2026-03-01'),
      reg('2026-03-02'),
    ]);
    assert.equal(m.get('2026-03-01'), 3);
    assert.equal(m.get('2026-03-02'), 1);
    assert.equal(m.size, 2);
  });

  test('un día sin registros no está en el mapa (no es 0)', () => {
    // El heatmap tiene que tratar `undefined` como "sin actividad".
    const m = countByDate(regs('2026-03-01'));
    assert.equal(m.get('2026-03-02'), undefined);
  });

  test('agrupa por fecha aunque la entrada venga desordenada', () => {
    const m = countByDate(regs('2026-03-02', '2026-03-01', '2026-03-02'));
    assert.equal(m.get('2026-03-01'), 1);
    assert.equal(m.get('2026-03-02'), 2);
  });

  test('cuenta cualquier tipo de registro: ejercicio, rutina y actividad libre', () => {
    const m = countByDate([
      reg('2026-03-01', { ejercicioId: 'e1' }),
      reg('2026-03-01', { rutinaId: 'ru1' }),
      reg('2026-03-01', { actividad: 'Correr 30 min' }),
    ]);
    assert.equal(m.get('2026-03-01'), 3);
  });
});

// ─── porCategoria ───────────────────────────────────────────────────────────────
//
// Cruza registros con la biblioteca. Es la transformación que más se rompe en
// silencio cuando se borra un ejercicio pero quedan sus registros.

describe('porCategoria', () => {
  const biblioteca = [ex('e1', 'Cardio'), ex('e2', 'Yoga')];

  test('sin registros devuelve lista vacía', () => {
    assert.deepEqual(porCategoria([], biblioteca), []);
  });

  test('usa la categoría del ejercicio referenciado', () => {
    const out = porCategoria([reg('2026-03-01', { ejercicioId: 'e2' })], biblioteca);
    assert.deepEqual(out, [{ categoria: 'Yoga', count: 1 }]);
  });

  test('un ejercicio que ya no existe en la biblioteca cae en "Otro"', () => {
    // Caso real: Cristina borra un ejercicio pero sus registros siguen en Firestore.
    const out = porCategoria([reg('2026-03-01', { ejercicioId: 'borrado' })], biblioteca);
    assert.deepEqual(out, [{ categoria: 'Otro', count: 1 }]);
  });

  test('un registro sin ejercicioId cae en "Libre"', () => {
    const out = porCategoria([reg('2026-03-01', { actividad: 'Correr' })], biblioteca);
    assert.deepEqual(out, [{ categoria: 'Libre', count: 1 }]);
  });

  test('un registro de rutina (sin ejercicioId) cuenta como "Libre"', () => {
    // Comportamiento ACTUAL, no necesariamente el deseado: las rutinas completadas
    // no tienen categoría propia y acaban mezcladas con las actividades libres.
    const out = porCategoria([reg('2026-03-01', { rutinaId: 'ru1' })], biblioteca);
    assert.deepEqual(out, [{ categoria: 'Libre', count: 1 }]);
  });

  test('agrupa y ordena de mayor a menor count', () => {
    const out = porCategoria(
      [
        reg('2026-03-01', { actividad: 'Andar' }),
        reg('2026-03-02', { ejercicioId: 'e1' }),
        reg('2026-03-03', { ejercicioId: 'e1' }),
        reg('2026-03-04', { ejercicioId: 'e1' }),
        reg('2026-03-05', { ejercicioId: 'e2' }),
        reg('2026-03-06', { ejercicioId: 'e2' }),
      ],
      biblioteca
    );
    assert.deepEqual(out, [
      { categoria: 'Cardio', count: 3 },
      { categoria: 'Yoga', count: 2 },
      { categoria: 'Libre', count: 1 },
    ]);
  });

  test('mezcla ejercicios conocidos, borrados y libres en el mismo resultado', () => {
    const out = porCategoria(
      [
        reg('2026-03-01', { ejercicioId: 'e1' }),
        reg('2026-03-02', { ejercicioId: 'fantasma' }),
        reg('2026-03-03', { ejercicioId: 'fantasma' }),
        reg('2026-03-04', { actividad: 'Nadar' }),
      ],
      biblioteca
    );
    assert.deepEqual(out, [
      { categoria: 'Otro', count: 2 },
      { categoria: 'Cardio', count: 1 },
      { categoria: 'Libre', count: 1 },
    ]);
  });

  test('una biblioteca vacía manda todos los ejercicios a "Otro"', () => {
    const out = porCategoria([reg('2026-03-01', { ejercicioId: 'e1' })], []);
    assert.deepEqual(out, [{ categoria: 'Otro', count: 1 }]);
  });
});

// ─── calcularLogros ─────────────────────────────────────────────────────────────
//
// Umbrales exactos. Un off-by-one aquí es invisible: el logro simplemente no
// aparece, o aparece un día antes.

describe('calcularLogros', () => {
  test('devuelve siempre los 8 logros, desbloqueados o no', () => {
    assert.equal(calcularLogros({ total: 0, rachaMax: 0 }).length, 8);
    assert.equal(calcularLogros({ total: 999, rachaMax: 999 }).length, 8);
  });

  test('los ids y su orden son estables (la pantalla de stats los pinta en orden)', () => {
    assert.deepEqual(
      calcularLogros({ total: 0, rachaMax: 0 }).map((l) => l.id),
      ['first', 'r3', 't10', 'r7', 't25', 't50', 'r30', 't100']
    );
  });

  test('sin entrenamientos no hay ningún logro', () => {
    assert.deepEqual(desbloqueados(0, 0), []);
  });

  test('el primer entrenamiento desbloquea "first" y nada más', () => {
    assert.deepEqual(desbloqueados(1, 1), ['first']);
  });

  test('umbrales por total: 10, 25, 50 y 100 justo antes y justo después', () => {
    assert.equal(desbloqueados(9, 0).includes('t10'), false);
    assert.equal(desbloqueados(10, 0).includes('t10'), true);

    assert.equal(desbloqueados(24, 0).includes('t25'), false);
    assert.equal(desbloqueados(25, 0).includes('t25'), true);

    assert.equal(desbloqueados(49, 0).includes('t50'), false);
    assert.equal(desbloqueados(50, 0).includes('t50'), true);

    assert.equal(desbloqueados(99, 0).includes('t100'), false);
    assert.equal(desbloqueados(100, 0).includes('t100'), true);
  });

  test('umbrales por racha: 3, 7 y 30 justo antes y justo después', () => {
    assert.equal(desbloqueados(0, 2).includes('r3'), false);
    assert.equal(desbloqueados(0, 3).includes('r3'), true);

    assert.equal(desbloqueados(0, 6).includes('r7'), false);
    assert.equal(desbloqueados(0, 7).includes('r7'), true);

    assert.equal(desbloqueados(0, 29).includes('r30'), false);
    assert.equal(desbloqueados(0, 30).includes('r30'), true);
  });

  test('los logros de total y de racha son independientes', () => {
    // Racha alta con pocos entrenamientos: se desbloquean solo los de racha.
    assert.deepEqual(desbloqueados(3, 30), ['first', 'r3', 'r7', 'r30']);
    // Muchos entrenamientos sin racha: solo los de total.
    assert.deepEqual(desbloqueados(100, 1), ['first', 't10', 't25', 't50', 't100']);
  });

  test('los umbrales son acumulativos: superarlos mantiene los anteriores', () => {
    assert.deepEqual(desbloqueados(120, 40), [
      'first', 'r3', 't10', 'r7', 't25', 't50', 'r30', 't100',
    ]);
  });

  test('cada logro trae icono, título y descripción para pintar la tarjeta', () => {
    for (const l of calcularLogros({ total: 0, rachaMax: 0 })) {
      assert.ok(l.icon.length > 0, `${l.id} sin icono`);
      assert.ok(l.titulo.length > 0, `${l.id} sin título`);
      assert.ok(l.desc.length > 0, `${l.id} sin descripción`);
    }
  });
});
