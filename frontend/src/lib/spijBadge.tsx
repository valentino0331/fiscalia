import React from 'react'

export const SPIJ_VERIFIED_HREF = '#spij-verified'

/**
 * Visual badge for legal citations verified against SPIJ 2026.
 * Styling requested:
 * - Text: ⚖️ Verificado SPIJ 2026
 * - Color text: #c9a84c
 * - Background: rgba(201,168,76,0.10)
 * - Border: 1px solid rgba(201,168,76,0.25)
 * - Border-radius: 4px
 * - Font: Montserrat 10px
 * - Constraint: Appears inline without breaking paragraphs
 */
export function SpijBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 select-none whitespace-nowrap font-medium ${className}`}
      style={{
        fontFamily: '"Montserrat", sans-serif',
        color: '#c9a84c',
        backgroundColor: 'rgba(201, 168, 76, 0.10)',
        border: '1px solid rgba(201, 168, 76, 0.25)',
        borderRadius: '4px',
        fontSize: '10px',
        lineHeight: '13px',
        verticalAlign: 'baseline',
        letterSpacing: '0.01em',
      }}
      title="Citación jurídica contrastada con el Sistema Peruano de Información Jurídica (SPIJ 2026)"
    >
      ⚖️ Verificado SPIJ 2026
    </span>
  )
}

/**
 * Checks if a message contains references to Peruvian legal norms and jurisprudence
 */
export function hasLegalReferences(text: string): boolean {
  if (!text) return false
  const TEST_REGEX = /(?:Art(?:ículo|s|iculo)?\.?|D\.?\s*L\.?(?:eg)?\.?|Ley\s*N[°º.]|Cas(?:\.|ación|acion)?|\b(?:N?CPP|CPC|CC|D\.Leg\.|D\.L\.)\b)/i
  return TEST_REGEX.test(text)
}

/**
 * Injects markdown tokens for the verified SPIJ badge inline after legal citations,
 * preserving text integrity.
 *
 * NOTE: Blind regex injection of "⚖️ Verificado SPIJ 2026" onto arbitrary AI output
 * is disabled to prevent false verification claims (e.g. stamping "Verificado SPIJ 2026"
 * on unverified or hallucinated article numbers). Only explicit verified tags or genuine
 * SPIJ modal entries carry the official certification.
 */
export function injectSpijBadges(text: string): string {
  if (!text) return text
  // Prevent blind automatic fabrication of SPIJ verification badges onto unverified text
  return text
}
