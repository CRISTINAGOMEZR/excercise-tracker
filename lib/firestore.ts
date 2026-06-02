import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Exercise, Registro } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Ejercicios ───────────────────────────────────────────────────────────────

export async function getEjercicios(): Promise<Exercise[]> {
  const snap = await getDocs(
    query(collection(db, 'ejercicios'), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id:          d.id,
      titulo:      data.titulo,
      tipo:        data.tipo,
      url:         data.url,
      miniatura:   data.miniatura,
      categoria:   data.categoria,
      duracionMin: data.duracionMin,
      notas:       data.notas,
      createdAt:   (data.createdAt as Timestamp)?.toDate() ?? new Date(),
    } as Exercise;
  });
}

export async function addEjercicio(
  data: Omit<Exercise, 'id' | 'createdAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'ejercicios'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteEjercicio(id: string): Promise<void> {
  await deleteDoc(doc(db, 'ejercicios', id));
}

/** Registra un entrenamiento libre de hoy (no ligado a un video de la biblioteca). */
export async function registrarActividad(nombre?: string): Promise<string> {
  const ref = await addDoc(collection(db, 'registros'), {
    actividad:    nombre?.trim() || 'Entrenamiento',
    fecha:        todayStr(),
    completadoAt: serverTimestamp(),
  });
  return ref.id;
}

// ─── Registros ────────────────────────────────────────────────────────────────

export async function getRegistrosHoy(): Promise<Registro[]> {
  const fecha = todayStr();
  const snap = await getDocs(
    query(collection(db, 'registros'), where('fecha', '==', fecha))
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id:           d.id,
      ejercicioId:  data.ejercicioId,
      actividad:    data.actividad,
      fecha:        data.fecha,
      completadoAt: (data.completadoAt as Timestamp)?.toDate() ?? new Date(),
    } as Registro;
  });
}

export async function getRegistrosTodos(): Promise<Registro[]> {
  const snap = await getDocs(
    query(collection(db, 'registros'), orderBy('fecha', 'desc'))
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id:           d.id,
      ejercicioId:  data.ejercicioId,
      actividad:    data.actividad,
      fecha:        data.fecha,
      completadoAt: (data.completadoAt as Timestamp)?.toDate() ?? new Date(),
    } as Registro;
  });
}

export async function getRegistrosByFecha(fecha: string): Promise<Registro[]> {
  const snap = await getDocs(
    query(collection(db, 'registros'), where('fecha', '==', fecha))
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id:           d.id,
      ejercicioId:  data.ejercicioId,
      actividad:    data.actividad,
      fecha:        data.fecha,
      completadoAt: (data.completadoAt as Timestamp)?.toDate() ?? new Date(),
    } as Registro;
  });
}

export async function marcarHecho(ejercicioId: string): Promise<string> {
  const ref = await addDoc(collection(db, 'registros'), {
    ejercicioId,
    fecha:        todayStr(),
    completadoAt: serverTimestamp(),
  });
  return ref.id;
}

export async function desmarcarHecho(registroId: string): Promise<void> {
  await deleteDoc(doc(db, 'registros', registroId));
}

// ─── Estadísticas ─────────────────────────────────────────────────────────────

/** Días de racha actual (días consecutivos con al menos 1 registro) */
export async function getRachaActual(): Promise<number> {
  const snap = await getDocs(
    query(collection(db, 'registros'), orderBy('fecha', 'desc'))
  );
  const fechas = [...new Set(snap.docs.map((d) => d.data().fecha as string))];
  if (fechas.length === 0) return 0;

  let racha = 0;
  const hoy = new Date();
  for (let i = 0; i < fechas.length; i++) {
    const esperada = new Date(hoy);
    esperada.setDate(hoy.getDate() - i);
    const esperadaStr = esperada.toISOString().split('T')[0];
    if (fechas[i] === esperadaStr) racha++;
    else break;
  }
  return racha;
}

/** Total de ejercicios completados en los últimos 7 días */
export async function getTotalSemana(): Promise<number> {
  const hace7 = new Date();
  hace7.setDate(hace7.getDate() - 6);
  const desde = hace7.toISOString().split('T')[0];
  const snap = await getDocs(
    query(collection(db, 'registros'), where('fecha', '>=', desde))
  );
  return snap.docs.length;
}
