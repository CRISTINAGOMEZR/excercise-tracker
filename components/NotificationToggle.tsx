'use client';

import { useEffect, useState } from 'react';
import { notificacionesSoportadas, permisoActual, activarNotificaciones } from '@/lib/messaging';

type Estado = 'cargando' | 'no-soportado' | 'activo' | 'bloqueado' | 'inactivo' | 'pidiendo';

export default function NotificationToggle() {
  const [estado, setEstado] = useState<Estado>('cargando');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!(await notificacionesSoportadas())) {
        setEstado('no-soportado');
        return;
      }
      const p = permisoActual();
      if (p === 'granted') setEstado('activo');
      else if (p === 'denied') setEstado('bloqueado');
      else setEstado('inactivo');
    })();
  }, []);

  async function handleActivar() {
    setError(null);
    setEstado('pidiendo');
    try {
      const token = await activarNotificaciones();
      if (token) {
        setEstado('activo');
      } else {
        // El usuario rechazó el permiso o no es compatible.
        setEstado(permisoActual() === 'denied' ? 'bloqueado' : 'inactivo');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setEstado('inactivo');
    }
  }

  // No mostrar nada mientras carga o si el navegador no soporta push.
  if (estado === 'cargando' || estado === 'no-soportado') return null;

  if (estado === 'activo') {
    return (
      <div
        className="rounded-2xl px-4 py-3 flex items-center gap-3 text-sm"
        style={{ backgroundColor: 'var(--color-done-bg)', border: '1px solid #c5d9bf', color: 'var(--color-text)' }}
      >
        <span className="text-lg leading-none">🔔</span>
        <span>Recordatorios diarios activados. ¡Te avisaremos para no romper tu racha!</span>
      </div>
    );
  }

  if (estado === 'bloqueado') {
    return (
      <div
        className="rounded-2xl px-4 py-3 flex items-start gap-3 text-sm"
        style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
      >
        <span className="text-lg leading-none">🔕</span>
        <span>
          Notificaciones bloqueadas. Actívalas desde los ajustes del navegador
          (candado junto a la dirección → Notificaciones → Permitir).
        </span>
      </div>
    );
  }

  // inactivo / pidiendo
  return (
    <div className="space-y-1">
      <button
        onClick={handleActivar}
        disabled={estado === 'pidiendo'}
        className="w-full py-3 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
        style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
      >
        <span className="text-lg leading-none">🔔</span>
        {estado === 'pidiendo' ? 'Activando…' : 'Activar recordatorios diarios'}
      </button>
      {error && (
        <p className="text-xs px-1" style={{ color: '#b4554d' }}>{error}</p>
      )}
    </div>
  );
}
