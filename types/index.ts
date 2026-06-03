export type VideoType = 'upload' | 'link';

export interface Exercise {
  id: string;
  titulo: string;
  tipo: VideoType;
  url: string;
  miniatura?: string;
  categoria: string;
  duracionMin?: number;
  notas?: string;
  createdAt: Date;
}

export interface Registro {
  id: string;
  ejercicioId?: string;   // vacío si es una actividad libre (no de la biblioteca)
  rutinaId?: string;      // si el registro corresponde a una rutina completada
  actividad?: string;     // nombre libre, p.ej. "Correr 30 min"
  fecha: string;          // YYYY-MM-DD
  completadoAt: Date;
}

/** Actividad libre guardada para reutilizar como pill (auto-guardada al escribirla). */
export interface ActividadGuardada {
  id: string;
  nombre: string;
  usos: number;           // veces marcada (para ordenar por más usadas)
  ultimoUso: Date;
}

// ─── Rutinas (varios videos bajo un mismo entrenamiento) ────────────────────────

export const FASES = ['Calentamiento', 'Normal', 'Enfriamiento'] as const;
export type Fase = (typeof FASES)[number];

/** Orden de reproducción por fase. */
export const ORDEN_FASE: Record<Fase, number> = {
  Calentamiento: 0,
  Normal: 1,
  Enfriamiento: 2,
};

/** Un video dentro de una rutina. */
export interface RutinaItem {
  id: string;             // id local (para keys y reordenar)
  nombre: string;
  fase: Fase;
  tipo: VideoType;        // 'upload' | 'link'
  url: string;
  miniatura?: string;
  duracionMin?: number;
  notas?: string;
}

/** Una rutina agrupa varios videos (ej. "Ejercicios kine"). */
export interface Rutina {
  id: string;
  titulo: string;
  items: RutinaItem[];
  createdAt: Date;
}

export const CATEGORIAS = [
  'Cardio',
  'Fuerza',
  'Movilidad',
  'Piernas',
  'Brazos',
  'Core',
  'Yoga',
  'Otro',
] as const;

export type Categoria = (typeof CATEGORIAS)[number];
