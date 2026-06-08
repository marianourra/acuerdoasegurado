import { getDocumentationSections } from '../constants/claimTypes';
import type { ClaimTypeLetter } from '../services/claimsService';

type DocumentationSectionsListProps = {
  type: ClaimTypeLetter;
  compact?: boolean;
};

export default function DocumentationSectionsList({ type, compact = false }: DocumentationSectionsListProps) {
  const sections = getDocumentationSections(type);
  let globalOffset = 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 8 : 12 }}>
      {sections.map((section, sectionIndex) => {
        const sectionNode = (
          <div key={section.title ?? sectionIndex} style={{ display: 'flex', flexDirection: 'column', gap: compact ? 8 : 12 }}>
            {section.title && (
              <div
                style={{
                  fontSize: compact ? 13 : 14,
                  fontWeight: 700,
                  color: '#475569',
                  marginTop: sectionIndex > 0 ? (compact ? 8 : 12) : 0,
                }}
              >
                {section.title}
              </div>
            )}
            <ul
              style={{
                margin: 0,
                paddingLeft: 20,
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: compact ? 8 : 12,
              }}
            >
              {section.items.map((doc, index) => {
                const number = globalOffset + index + 1;
                return (
                  <li
                    key={`${section.title ?? 'section'}-${index}`}
                    style={{
                      fontSize: compact ? 14 : 15,
                      color: '#334155',
                      lineHeight: 1.4,
                      position: 'relative',
                      paddingLeft: compact ? 0 : 24,
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        left: compact ? -16 : 0,
                        color: '#667eea',
                        fontWeight: 600,
                      }}
                    >
                      {number}.
                    </span>
                    {doc}
                  </li>
                );
              })}
            </ul>
          </div>
        );

        globalOffset += section.items.length;
        return sectionNode;
      })}
    </div>
  );
}
