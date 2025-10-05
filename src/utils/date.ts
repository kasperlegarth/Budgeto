/**
 * Date utilities for Budgeto
 * Håndterer månedsskifte, reset-logik og Europa/Copenhagen tidszoner
 */

const TIMEZONE = 'Europe/Copenhagen';

/**
 * Henter nuværende dato/tid i Europe/Copenhagen timezone
 * @returns Date object i lokal tid
 */
export function nowInCopenhagen(): Date {
  // Opret dato i Europe/Copenhagen timezone
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('da-DK', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || '0';

  return new Date(
    parseInt(get('year')),
    parseInt(get('month')) - 1,
    parseInt(get('day')),
    parseInt(get('hour')),
    parseInt(get('minute')),
    parseInt(get('second'))
  );
}

/**
 * Returnerer første dag i måneden for en given dato
 * @param date - Dato (default: nu i Copenhagen)
 * @returns ISO string for d. 1 i måneden kl. 00:00:00
 */
export function firstDayOfMonth(date: Date = nowInCopenhagen()): string {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * Tjekker om vi skal nulstille variable posteringer
 * @param sidsteResetISO - ISO string for sidste reset (eller null ved første kørsel)
 * @returns true hvis det er en ny måned siden sidste reset
 */
export function shouldResetVariable(sidsteResetISO: string | null): boolean {
  if (!sidsteResetISO) return false; // Første kørsel, ingen reset

  const now = nowInCopenhagen();
  const lastReset = new Date(sidsteResetISO);

  // Sammenlign år og måned
  return (
    now.getFullYear() > lastReset.getFullYear() ||
    (now.getFullYear() === lastReset.getFullYear() && now.getMonth() > lastReset.getMonth())
  );
}

/**
 * Formaterer dato til dansk format (dd/mm/yyyy)
 * @param date - Dato eller ISO string
 * @returns Formateret dato (fx "05/10/2025")
 */
export function formatDateDK(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('da-DK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Formaterer dato og tid til dansk format
 * @param date - Dato eller ISO string eller timestamp
 * @returns Formateret dato og tid (fx "05/10/2025 kl. 14:30")
 */
export function formatDateTimeDK(date: Date | string | number): string {
  const d = typeof date === 'number' ? new Date(date) : typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('da-DK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}
