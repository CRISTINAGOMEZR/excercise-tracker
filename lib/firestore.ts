import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { ActividadGuardada, Exercise, Registro, Rutina, RutinaItem } from '@/types';

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

export async function getEjercicio(id: string): Promise<Exercise | null> {
  const snap = await getDoc(doc(db, 'ejercicios', id));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id:          snap.id,
    titulo:      data.titulo,
    tipo:        data.tipo,
    url:         data.url,
    miniatura:   data.miniatura,
    categoria:   data.categoria,
    duracionMin: data.duracionMin,
    notas:       data.notas,
    createdAt:   (data.createdAt as Timestamp)?.toDate() ?? new Date(),
  } as Exercise;
}

export async function updateEjercicio(
  id: string,
  data: Partial<Omit<Exercise, 'id' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, 'ejercicios', id), data);
}

export async function deleteEjercicio(id: string): Promise<void> {
  await deleteDoc(doc(db, 'ejercicios', id));
}

/** Registra un entrenamiento libre de hoy (no ligado a un video de la biblioteca).
 *  Si tiene nombre, lo auto-guarda como pill reutilizable. */
export async function registrarActividad(nombre?: string): Promise<string> {
  const limpio = nombre?.trim();
  const ref = await addDoc(collection(db, 'registros'), {
    actividad:    limpio || 'Entrenamiento',
    fecha:        todayStr(),
    completadoAt: serverTimestamp(),
  });
  if (limpio) {
    // No bloquea el registro si falla el guardado de la pill.
    guardarActividad(limpio).catch(() => {});
  }
  return ref.id;
}

// ─── Actividades guardadas (pills reutilizables) ────────────────────────────────

/** Auto-guarda (o incrementa el uso de) una actividad libre para reutilizarla. */
export async function guardarActividad(nombre: string): Promise<void> {
  const limpio = nombre.trim();
  if (!limpio) return;
  const snap = await getDocs(
    query(collection(db, 'actividadesGuardadas'), where('nombre', '==', limpio))
  );
  if (snap.empty) {
    await addDoc(collection(db, 'actividadesGuardadas'), {
      nombre:    limpio,
      usos:      1,
      ultimoUso: serverTimestamp(),
    });
  } else {
    await updateDoc(snap.docs[0].ref, {
      usos:      increment(1),
      ultimoUso: serverTimestamp(),
    });
  }
}

/** Lista las actividades guardadas, ordenadas por más usadas y recientes. */
export async function getActividadesGuardadas(): Promise<ActividadGuardada[]> {
  const snap = await getDocs(collection(db, 'actividadesGuardadas'));
  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        id:        d.id,
        nombre:    data.nombre as string,
        usos:      (data.usos as number) ?? 1,
        ultimoUso: (data.ultimoUso as Timestamp)?.toDate() ?? new Date(0),
      } as ActividadGuardada;
    })
    .sort((a, b) =>
      b.usos !== a.usos ? b.usos - a.usos : b.ultimoUso.getTime() - a.ultimoUso.getTime()
    );
}

export async function eliminarActividadGuardada(id: string): Promise<void> {
  await deleteDoc(doc(db, 'actividadesGuardadas', id));
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
      rutinaId:     data.rutinaId,
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
      rutinaId:     data.rutinaId,
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
      rutinaId:     data.rutinaId,
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

// ─── Rutinas (varios videos por entrenamiento) ──────────────────────────────────

function mapRutina(id: string, data: Record<string, unknown>): Rutina {
  return {
    id,
    titulo: (data.titulo as string) ?? '',
    items: ((data.items as RutinaItem[]) ?? []).map((it) => ({ ...it })),
    createdAt: (data.createdAt as Timestamp)?.toDate?.() ?? new Date(),
  };
}

export async function getRutinas(): Promise<Rutina[]> {
  const snap = await getDocs(
    query(collection(db, 'rutinas'), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map((d) => mapRutina(d.id, d.data()));
}

export async function getRutina(id: string): Promise<Rutina | null> {
  const snap = await getDoc(doc(db, 'rutinas', id));
  return snap.exists() ? mapRutina(snap.id, snap.data()) : null;
}

export async function addRutina(
  data: Omit<Rutina, 'id' | 'createdAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'rutinas'), {
    titulo: data.titulo,
    items: data.items,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateRutina(
  id: string,
  data: Pick<Rutina, 'titulo' | 'items'>
): Promise<void> {
  await updateDoc(doc(db, 'rutinas', id), {
    titulo: data.titulo,
    items: data.items,
  });
}

export async function deleteRutina(id: string): Promise<void> {
  await deleteDoc(doc(db, 'rutinas', id));
}

/** Marca una rutina como completada hoy. */
export async function marcarRutinaHecha(rutinaId: string): Promise<string> {
  const ref = await addDoc(collection(db, 'registros'), {
    rutinaId,
    fecha:        todayStr(),
    completadoAt: serverTimestamp(),
  });
  return ref.id;
}

// ─── Notificaciones (tokens FCM) ────────────────────────────────────────────────

/**
 * Guarda (o actualiza) el token FCM de este dispositivo. Usa el propio token
 * como ID del documento para evitar duplicados si se vuelve a activar.
 */
export async function guardarTokenFCM(token: string): Promise<void> {
  await setDoc(doc(db, 'tokens', token), {
    token,
    updatedAt: serverTimestamp(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  });
}

/** Elimina un token FCM (p.ej. cuando ya no es válido). */
export async function eliminarTokenFCM(token: string): Promise<void> {
  await deleteDoc(doc(db, 'tokens', token));
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
