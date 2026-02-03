import type { ClaimTypeLetter } from '../services/claimsService';

export type ClaimTypeKey = 'autos' | 'lesiones' | 'otra-propiedad';

/** Etiquetas para mostrar en UI (A, L, P) */
export const claimTypeLabels: Record<ClaimTypeLetter, string> = {
  A: 'Daños a autos',
  L: 'Lesiones',
  P: 'Daños a otra propiedad',
};

/** Mapeo desde el valor del formulario (NewClaim) a la letra en BD */
export const claimTypeKeyToLetter: Record<ClaimTypeKey, ClaimTypeLetter> = {
  autos: 'A',
  lesiones: 'L',
  'otra-propiedad': 'P',
};

/** Listas de documentación recomendada por tipo (para WhatsApp y listados) */
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
};

const WHATSAPP_NUMBER = '542235698202';

/**
 * Arma el mensaje para WhatsApp "Adjuntar documentación" con datos del reclamo y del productor.
 */
export function buildAttachDocumentationWhatsAppMessage(params: {
  producerName: string;
  clientName: string;
  claimType: ClaimTypeLetter;
}): string {
  const list = documentationLists[params.claimType];
  const listText = list.map((item, i) => `${i + 1}. ${item}`).join('\n');

  let message = `Hola, adjunto la documentación correspondiente al reclamo.\n\n`;
  if (params.producerName) {
    message += `PAS: ${params.producerName}\n`;
  }
  message += `Reclamante: ${params.clientName}\n\n`;
  message += `Documentación a adjuntar:\n${listText}`;

  return message;
}

export function getAttachDocumentationWhatsAppUrl(params: {
  producerName: string;
  clientName: string;
  claimType: ClaimTypeLetter;
}): string {
  const text = buildAttachDocumentationWhatsAppMessage(params);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}
