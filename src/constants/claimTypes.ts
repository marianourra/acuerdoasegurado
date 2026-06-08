import type { ClaimTypeLetter } from '../services/claimsService';

export type ClaimTypeKey = 'autos' | 'lesiones' | 'otra-propiedad' | 'danos-y-lesiones';

/** Etiquetas para mostrar en UI (A, L, P, D) */
export const claimTypeLabels: Record<ClaimTypeLetter, string> = {
  A: 'Daños a autos',
  L: 'Lesiones',
  P: 'Daños a otra propiedad',
  D: 'Daños y lesiones',
};

/** Mapeo desde el valor del formulario (NewClaim) a la letra en BD */
export const claimTypeKeyToLetter: Record<ClaimTypeKey, ClaimTypeLetter> = {
  autos: 'A',
  lesiones: 'L',
  'otra-propiedad': 'P',
  'danos-y-lesiones': 'D',
};

/** Listas de documentación recomendada por tipo (para listados) */
export const documentationLists: Record<ClaimTypeLetter, string[]> = {
  A: [
    'Foto de ambos lados de la cédula de identificación del vehículo',
    'Foto de ambos lados del registro de conducir',
    'Foto DNI ambos lados del titular del rodado (en caso de persona jurídica, copia del estatuto y acta de designación de autoridades)',
    'Presupuesto de reparación',
    'Fotos de los daños del vehículo, incluida alguna donde se vea la patente',
    'Constancia de cobertura',
    'Denuncia de siniestro',
    'Constancia CBU bancaria del titular del vehículo',
  ],
  L: [
    'Foto DNI ambos lados del damnificado',
    'Denuncia policial (si aplica)',
    'Certificados médicos o copia de historia clínica',
    'Tickets o facturas de gastos médicos',
    'Recibo de sueldo',
    'Constancia CBU bancaria del damnificado',
  ],
  P: [
    'Título o documentación de la propiedad',
    'Foto ambos lados DNI del titular de la propiedad dañada',
    'Presupuesto o factura de reparación del daño',
    'Fotos de los daños',
    'Constancia CBU bancaria del propietario',
  ],
  D: [],
};

documentationLists.D = [...documentationLists.A, ...documentationLists.L];

export type DocumentationSection = {
  title?: string;
  items: string[];
};

/** Documentación agrupada por sección (p. ej. daños y lesiones). */
export function getDocumentationSections(type: ClaimTypeLetter): DocumentationSection[] {
  if (type === 'D') {
    return [
      { title: 'Daños a autos', items: documentationLists.A },
      { title: 'Lesiones', items: documentationLists.L },
    ];
  }

  return [{ items: documentationLists[type] }];
}

const WHATSAPP_NUMBER = '542235698202';

/** Normaliza un teléfono local y devuelve la URL de WhatsApp Web, o null si no es válido. */
export function getWhatsAppUrlForPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;

  let normalized = digits;
  if (normalized.startsWith('0')) {
    normalized = `54${normalized.slice(1)}`;
  } else if (!normalized.startsWith('54') && normalized.length === 10) {
    normalized = `54${normalized}`;
  }

  return `https://wa.me/${normalized}`;
}

/**
 * Arma el mensaje para WhatsApp "Adjuntar documentación" con datos del reclamo.
 */
export function buildAttachDocumentationWhatsAppMessage(params: {
  producerName: string;
  clientName: string;
  companyName: string;
}): string {
  const lines = [`Reclamante: ${params.clientName}`];

  if (params.producerName) {
    lines.push(`PAS: ${params.producerName}`);
  }

  if (params.companyName) {
    lines.push(`Compañía a reclamar: ${params.companyName}`);
  }

  return lines.join('\n');
}

export function getAttachDocumentationWhatsAppUrl(params: {
  producerName: string;
  clientName: string;
  companyName: string;
}): string {
  const text = buildAttachDocumentationWhatsAppMessage(params);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}
