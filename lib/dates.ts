/**
 * Fechas del proyecto.
 *
 * Todas las fechas de `Registro` son strings `YYYY-MM-DD` en el huso horario
 * LOCAL del dispositivo — nunca UTC. Usar `toISOString()` aquí rompe el día
 * justo después de medianoche para cualquiera que esté por delante de UTC:
 * en España (UTC+1/+2) un entrenamiento marcado a las 00:30 del martes se
 * guardaría como lunes, porque a esa hora UTC todavía no cruzó la medianoche.
 *
 * Funciones PURAS salvo `hoy()`, que lee el reloj.
 */

/** `YYYY-MM-DD` de un Date, leído en hora local. */
export function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dia}`;
}

/** Hoy en `YYYY-MM-DD` local. */
export function hoy(): string {
  return ymd(new Date());
}

/** `YYYY-MM-DD` → Date a medianoche local (no UTC). */
export function fromYmd(fecha: string): Date {
  const [y, m, d] = fecha.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Suma (o resta, con negativos) días a un `YYYY-MM-DD`. Devuelve `YYYY-MM-DD`. */
export function addDays(fecha: string, dias: number): string {
  const d = fromYmd(fecha);
  d.setDate(d.getDate() + dias);
  return ymd(d);
}

/** Días entre dos `YYYY-MM-DD` (b − a). Aritmética en UTC: sin DST de por medio. */
export function diffDias(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}
