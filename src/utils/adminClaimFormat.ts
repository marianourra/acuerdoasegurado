import { claimTypeLabels } from '../constants/claimTypes';
import type { ClaimTypeLetter } from '../services/claimsService';
import type { AdminClaimRow } from '../services/adminClaimsService';
import { formatAbogadoName } from '../services/abogadosService';
import { formatDateLocal, toDateInputValue as toDateInputValueLocal } from './dateUtils';

export const formatMoney = (value: number | null | undefined) =>
  value != null ? `$${Number(value).toLocaleString('es-AR')}` : '—';

/** Honorarios: usa el valor persistido o calcula monto acordado × % honorarios. */
export function getClaimFeesAmount(claim: {
  fees: number | null;
  amount_agreed: number | null;
  fees_percent: number | null;
}): number | null {
  if (claim.fees != null) return claim.fees;
  if (claim.amount_agreed != null && claim.fees_percent != null) {
    return Math.round(((claim.amount_agreed * claim.fees_percent) / 100) * 100) / 100;
  }
  return null;
}

export const formatDate = formatDateLocal;

export const formatDateTime = (date: string | null | undefined) =>
  date
    ? new Date(date).toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

export const toDateInputValue = toDateInputValueLocal;

export type AdminClaimFieldSection = {
  title: string;
  fields: Array<{ label: string; value: string }>;
};

export function getAdminClaimFieldSections(claim: AdminClaimRow): AdminClaimFieldSection[] {
  const typeLabel =
    claim.type && claimTypeLabels[claim.type as ClaimTypeLetter]
      ? claimTypeLabels[claim.type as ClaimTypeLetter]
      : claim.type ?? '—';

  return [
    {
      title: 'Identificación',
      fields: [
        { label: 'ID', value: String(claim.id) },
        { label: 'Fecha de creación', value: formatDateTime(claim.created_at) },
        { label: 'Actualizado', value: formatDateTime(claim.updated_at) },
      ],
    },
    {
      title: 'Cliente',
      fields: [
        { label: 'Nombre', value: claim.client_name ?? '—' },
        { label: 'Teléfono', value: claim.client_phone ?? '—' },
        { label: 'Compañía del cliente', value: claim.client_companies?.name ?? '—' },
      ],
    },
    {
      title: 'Relaciones',
      fields: [
        { label: 'Productor', value: claim.producers?.name ?? '—' },
        { label: 'Asistente', value: claim.asistentes?.nombre ?? '—' },
        { label: 'Abogado', value: formatAbogadoName(claim.abogados) },
        { label: 'Compañía a reclamar', value: claim.companies?.name ?? '—' },
      ],
    },
    {
      title: 'Estado y tipo',
      fields: [
        { label: 'Estado', value: claim.claim_statuses?.name ?? '—' },
        { label: 'Tipo', value: typeLabel },
      ],
    },
    {
      title: 'Montos',
      fields: [
        { label: 'Monto acuerdo', value: formatMoney(claim.amount_agreed) },
        { label: '% Honorarios', value: claim.fees_percent != null ? `${claim.fees_percent}%` : '—' },
        { label: 'Honorarios (fees)', value: formatMoney(getClaimFeesAmount(claim)) },
        { label: 'Facturado', value: claim.is_invoiced ? 'Sí — Facturado' : 'No' },
      ],
    },
    {
      title: 'Fechas',
      fields: [
        { label: 'Fecha de presentación', value: formatDate(claim.presentation_date) },
        { label: 'Fecha de pago', value: formatDate(claim.payment_date) },
        { label: 'Fecha de finalización', value: formatDate(claim.finished_at) },
      ],
    },
    {
      title: 'Observaciones',
      fields: [
        { label: 'Observaciones (reclamo)', value: claim.description?.trim() || '—' },
        { label: 'Resumen del asunto', value: claim.claim_brief?.trim() || '—' },
        { label: 'Observaciones internas', value: claim.internal_observations?.trim() || '—' },
      ],
    },
  ];
}
