export const GROUP_EN_TRAMITE = 'en-tramite';
export const GROUP_FINALIZADOS = 'finalizados';
/** Solo vista admin: reclamos en estado Acordado */
export const GROUP_ACORDADO_PENDIENTE_PAGO = 'acordado-pendiente-pago';

export const CLAIM_GROUP_META = {
  [GROUP_EN_TRAMITE]: { name: 'En trámite', color: '#16a34a' },
  [GROUP_FINALIZADOS]: { name: 'Finalizados', color: '#667eea' },
} as const;

/** Metadatos de collapses de la bandeja admin (colores distintos al dashboard productor) */
export const ADMIN_CLAIM_GROUP_META = {
  [GROUP_EN_TRAMITE]: { name: 'En trámite', color: '#667eea' },
  [GROUP_ACORDADO_PENDIENTE_PAGO]: { name: 'Acordado - Pendiente de pago', color: '#16a34a' },
  [GROUP_FINALIZADOS]: { name: 'Finalizados', color: '#000000' },
} as const;

export const DEFAULT_EXPANDED_SECTIONS: Record<string, boolean> = {
  [GROUP_EN_TRAMITE]: true,
  [GROUP_FINALIZADOS]: false,
};

export const ADMIN_DEFAULT_EXPANDED_SECTIONS: Record<string, boolean> = {
  ...DEFAULT_EXPANDED_SECTIONS,
  [GROUP_ACORDADO_PENDIENTE_PAGO]: true,
};
