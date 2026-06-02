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
  ejercicioId: string;
  fecha: string; // YYYY-MM-DD
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
