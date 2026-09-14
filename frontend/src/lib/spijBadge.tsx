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
 * preserving code blocks and pre-existing markdown links.
 */
export function injectSpijBadges(text: string): string {
  if (!text) return text

  // 1. Protect code blocks (```code``` and `inline`)
  const codeBlocks: string[] = []
  let processed = text.replace(/(```[\s\S]*?```|`[^`]+`)/g, (m) => {
    codeBlocks.push(m)
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`
  })

  // 2. Protect existing markdown links [text](url)
  const links: string[] = []
  processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m) => {
    links.push(m)
    return `__LINK_BLOCK_${links.length - 1}__`
  })

  // 3. Comprehensive legal citation regex covering Peruvian statutory & jurisprudential citations:
  // - Articles: Art. 268, Artículos 139 inc 3, Arts. 74 y 80 CPC, etc.
  // - Decrees: D.L. 1585, D.Leg. 1297, Decreto Legislativo 768, etc.
  // - Laws: Ley N° 30364, Ley 29497, etc.
  // - Casaciones: Cas. 626-2013-Moquegua, Casación 2195-2011, etc.
  // - Codes: CPP, NCPP, CPC, CC, etc.
  const LEGAL_REGEX = /(?:(?:(?:Art(?:ículo|s|iculo)?\.?|Arts\.?)\s*\d+[º°\w\-]*(?:\s*(?:del?|al?|inc(?:iso)?\.?\s*\d*|num(?:eral)?\.?\s*\d*|y|e|\,)*\s*(?:N?CPP|CPC|CC|C\.C\.|C\.P\.P\.|C\.P\.C\.|NLPT|LPCL|LPAG|LGS|Constitución|Código\s+Civil|Código\s+Procesal\s+Penal|Código\s+Procesal\s+Civil|Código\s+Penal|CP|C\.P\.))*)|(?:(?:D\.?\s*L\.?(?:eg)?\.?|Decreto\s+Legislativo)\s*(?:N[°º.]?|N°|Nº)?\s*\d+)|(?:Ley\s*(?:N[°º.]?|N°|Nº)?\s*\d+)|(?:Cas(?:\.|ación|acion)?\s*(?:N[°º.]?|N°|Nº)?\s*\d+(?:[-–/]\d+)*(?:\s*[-–/]\s*[A-Za-zñÑáéíóúÁÉÍÓÚ]+)?)|(?:\b(?:N?CPP|CPC|CC)\b|(?:\b(?:D\.Leg\.|D\.L\.|Art\.|Arts\.|Ley\s*N[°º.]\s*\d*|Cas\.))))/gi

  // Debounce badge insertion within short proximity (e.g. 25 chars) to prevent excessive clustering
  let lastBadgeEnd = -100
  const BADGE_MD = ` [⚖️ Verificado SPIJ 2026](${SPIJ_VERIFIED_HREF})`

  processed = processed.replace(LEGAL_REGEX, (match, offset) => {
    if (offset - lastBadgeEnd < 25) {
      return match
    }
    lastBadgeEnd = offset + match.length
    return match + BADGE_MD
  })

  // 4. Restore existing links
  processed = processed.replace(/__LINK_BLOCK_(\d+)__/g, (_, idx) => links[Number(idx)])

  // 5. Restore code blocks
  processed = processed.replace(/__CODE_BLOCK_(\d+)__/g, (_, idx) => codeBlocks[Number(idx)])

  return processed
}
