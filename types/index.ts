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
  actividad?: string;     // nombre libre, p.ej. "Correr 30 min"
  fecha: string;          // YYYY-MM-DD
  completadoAt: Date;
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
