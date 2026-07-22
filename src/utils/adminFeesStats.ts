import type { AdminClaimRow } from '../services/adminClaimsService';
import { isAcordadoOrLiquidadoClaim } from '../services/claimsService';
import { getClaimFeesAmount } from './adminClaimFormat';

const DAY_MS = 24 * 60 * 60 * 1000;
const DAYS_PER_MONTH = 30;

export const FEES_STATS_PERIODS = [
  { days: 30, label: 'Últimos 30 días' },
  { days: 90, label: 'Últimos 90 días' },
  { days: 180, label: 'Últimos 180 días' },
] as const;

export type MonthlyFeesStat = {
  days: number;
  label: string;
  months: number;
  caseCount: number;
  totalFees: number;
  monthlyAverage: number;
};

/** Fecha de referencia para contabilizar honorarios generados (finalización, pago o actualización). */
export function getFeesRecognitionDate(claim: AdminClaimRow): Date | null {
  const candidates = [claim.finished_at, claim.payment_date, claim.updated_at];
  for (const value of candidates) {
    if (!value) continue;
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
}

function isWithinLastDays(date: Date, days: number, now = Date.now()): boolean {
  const cutoff = now - days * DAY_MS;
  const time = date.getTime();
  return time >= cutoff && time <= now;
}

export function computeMonthlyFeesStats(claims: AdminClaimRow[]): MonthlyFeesStat[] {
  const feeClaims = claims
    .filter((claim) => isAcordadoOrLiquidadoClaim(claim))
    .map((claim) => ({
      claim,
      fees: getClaimFeesAmount(claim),
      recognitionDate: getFeesRecognitionDate(claim),
    }))
    .filter(
      (row): row is typeof row & { fees: number; recognitionDate: Date } =>
        row.fees != null && row.fees > 0 && row.recognitionDate != null
    );

  const now = Date.now();

  return FEES_STATS_PERIODS.map(({ days, label }) => {
    // El promedio es SIEMPRE mensual: se divide el total del stock de la ventana
    // por la cantidad de meses que abarca el período (días / 30).
    const months = days / DAYS_PER_MONTH;
    const inPeriod = feeClaims.filter((row) => isWithinLastDays(row.recognitionDate, days, now));
    const totalFees = inPeriod.reduce((sum, row) => sum + row.fees, 0);
    const monthlyAverage = Math.round((totalFees / months) * 100) / 100;

    return {
      days,
      label,
      months,
      caseCount: inPeriod.length,
      totalFees,
      monthlyAverage,
    };
  });
}
