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

/** Valor YYYY-MM-DD para <input type="date"> sin corrimiento por zona horaria */
export function toDateInputValue(dateString: string | null | undefined): string {
  if (!dateString) return '';
  const s = String(dateString).trim();
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;

  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Fecha de hoy en zona local como YYYY-MM-DD (para inputs type="date") */
export function getTodayLocalYYYYMMDD(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseLocalDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  const match = String(dateString).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d));
}

/** true si la fecha de pago ya venció (hoy es posterior al vencimiento) */
export function isPaymentDateOverdue(paymentDate: string | null | undefined): boolean {
  const due = parseLocalDate(paymentDate);
  if (!due) return false;
  const today = parseLocalDate(getTodayLocalYYYYMMDD());
  if (!today) return false;
  return due.getTime() < today.getTime();
}

/** Diferencia en días entre dos fechas solo-día (inicio inclusive hacia fin) */
export function daysBetweenLocal(start: string, end: string): number {
  const parse = (value: string) => {
    const match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, y, m, d] = match;
      return new Date(Number(y), Number(m) - 1, Number(d)).getTime();
    }
    return new Date(value).getTime();
  };
  return (parse(end) - parse(start)) / (1000 * 60 * 60 * 24);
}
