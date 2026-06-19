import * as XLSX from 'xlsx';
import { claimTypeLabels } from '../constants/claimTypes';
import type { ClaimTypeLetter } from '../services/claimsService';
import type { AdminClaimRow } from '../services/adminClaimsService';
import { formatAbogadoName } from '../services/abogadosService';
import { formatDateLocal } from './dateUtils';
import { getClaimFeesAmount } from './adminClaimFormat';

function claimTypeLabel(type: AdminClaimRow['type']): string {
  if (type && claimTypeLabels[type as ClaimTypeLetter]) {
    return claimTypeLabels[type as ClaimTypeLetter];
  }
  return type != null ? String(type) : '';
}

function dateCell(value: string | null | undefined): string {
  if (!value) return '';
  return formatDateLocal(value) ?? '';
}

function dateTimeCell(value: string | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function adminClaimToExportRow(claim: AdminClaimRow): Record<string, string | number> {
  const fees = getClaimFeesAmount(claim);
  return {
    ID: claim.id,
    'Número de reclamo': claim.claim_number ?? '',
    'Nombre reclamante': claim.client_name ?? '',
    'Teléfono reclamante': claim.client_phone ?? '',
    Tipo: claimTypeLabel(claim.type),
    Estado: claim.claim_statuses?.name ?? '',
    'Compañía a reclamar': claim.companies?.name ?? '',
    'Compañía del cliente': claim.client_companies?.name ?? '',
    Productor: claim.producers?.name ?? '',
    Asistente: claim.asistentes?.nombre ?? '',
    Abogado: formatAbogadoName(claim.abogados) === '—' ? '' : formatAbogadoName(claim.abogados),
    'Monto reclamado': claim.amount_claimed ?? '',
    'Monto acordado': claim.amount_agreed ?? '',
    'Utilidad productor': claim.producer_profit ?? '',
    '% Honorarios': claim.fees_percent ?? '',
    Honorarios: fees ?? '',
    Facturado: claim.is_invoiced ? 'Sí' : 'No',
    'Fecha de creación': dateTimeCell(claim.created_at),
    'Fecha de presentación': dateCell(claim.presentation_date),
    'Fecha de pago': dateCell(claim.payment_date),
    'Fecha de finalización': dateCell(claim.finished_at),
    'Última actualización': dateTimeCell(claim.updated_at),
    'Taller inspección': claim.taller_inspeccion ?? '',
    'Observaciones PAS': claim.observaciones_pas ?? '',
    'Observaciones (reclamo)': claim.description ?? '',
    'Resumen del asunto': claim.claim_brief ?? '',
    'Observaciones internas': claim.internal_observations ?? '',
  };
}

export function exportClaimsToExcel(claims: AdminClaimRow[], filenamePrefix = 'reclamos'): void {
  const rows = claims.map(adminClaimToExportRow);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reclamos');

  const colWidths = Object.keys(rows[0] ?? {}).map((key) => {
    const maxLen = rows.reduce((max, row) => {
      const val = row[key];
      const len = val == null ? 0 : String(val).length;
      return Math.max(max, len);
    }, key.length);
    return { wch: Math.min(Math.max(maxLen + 2, 12), 48) };
  });
  worksheet['!cols'] = colWidths;

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${filenamePrefix}-${date}.xlsx`);
}
