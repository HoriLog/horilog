/** Shown in the UI whenever a field has no real source (never invent a value). */
export const NO_DATA = 'Não informado';

export function orDash(value: string | number | null | undefined, unit = ''): string {
  if (value === undefined || value === null || value === '') return '—';
  return `${value}${unit}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
  return (first + last).toUpperCase();
}

/** Brazilian plates: old (ABC-1234) and Mercosul (ABC1D23). Returns 'ABC-1D23' or null when invalid. */
export function normalizePlate(raw: string): string | null {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!/^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(clean)) return null;
  return `${clean.slice(0, 3)}-${clean.slice(3)}`;
}

/** Parses "1.500,50", "1500,5", "1500.5" and "1.500" (thousands) into a number, or undefined. */
export function parseNumberBR(raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined;
  let s = raw.trim().replace(/[R$\s]/g, '').replace(/kg$/i, '');
  if (!s) return undefined;
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, '');
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

export function formatBRL(value: number | undefined): string {
  if (value === undefined) return '—';
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

export function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

export function percent(part: number, total: number): string {
  if (total === 0) return '—';
  return `${Math.round((part / total) * 100)}%`;
}

/** Parses "8:53:00" (H:MM:SS) or "8:53" (H:MM) into total minutes, or undefined. */
export function parseDurationToMinutes(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const parts = raw.trim().split(':').map(Number);
  if (parts.some((n) => Number.isNaN(n))) return undefined;
  if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2] / 60;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return undefined;
}

/** Parses "9/24/2026" + "18:19" into an ISO timestamp, or undefined. */
export function parseUSDateTime(datePart: string | undefined, timePart?: string | undefined): string | undefined {
  if (!datePart) return undefined;
  const iso = `${datePart}${timePart ? ' ' + timePart : ''}`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}