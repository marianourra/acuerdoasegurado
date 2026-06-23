import { getWhatsAppUrlForPhone } from '../constants/claimTypes';

type ClientPhoneWhatsAppLinkProps = {
  phone: string | null | undefined;
  emptyLabel?: string;
};

export default function ClientPhoneWhatsAppLink({
  phone,
  emptyLabel = '—',
}: ClientPhoneWhatsAppLinkProps) {
  const clientPhone = phone?.trim() ?? '';
  const whatsAppUrl = clientPhone ? getWhatsAppUrlForPhone(clientPhone) : null;

  if (!whatsAppUrl) {
    return <>{clientPhone || emptyLabel}</>;
  }

  return (
    <a
      href={whatsAppUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: '#25D366',
        fontWeight: 600,
        textDecoration: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.textDecoration = 'underline';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.textDecoration = 'none';
      }}
    >
      {clientPhone}
    </a>
  );
}
