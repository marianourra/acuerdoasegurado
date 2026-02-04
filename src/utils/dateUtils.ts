/**
 * Parsea una fecha solo-día (YYYY-MM-DD) en hora local para evitar
 * que en zonas con UTC negativo (ej. Argentina) se muestre el día anterior.
 * new Date("2025-01-27") en JS es medianoche UTC → en AR muestra 26/01.
 */
export function formatDateLocal(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  const s = String(dateString).trim();
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, y, m, d] = match;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
  return new Date(s).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Fecha de hoy en zona local como YYYY-MM-DD (para inputs type="date") */
export function getTodayLocalYYYYMMDD(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
