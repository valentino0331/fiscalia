/**
 * Utilidades para exportación oficial de documentos legales a Word (.doc) e Impresión / PDF
 */

export interface DocFormatOptions {
  fontFamilyCss?: string
  fontSizePt?: number
  lineHeight?: number
  marginTopCm?: number
  marginRightCm?: number
  marginBottomCm?: number
  marginLeftCm?: number
}

const DEFAULT_FORMAT: DocFormatOptions = {
  fontFamilyCss: '"Times New Roman", Times, serif',
  fontSizePt: 12,
  lineHeight: 1.5,
  marginTopCm: 3,
  marginRightCm: 2.5,
  marginBottomCm: 2.5,
  marginLeftCm: 3,
}

export function buildPrintHTML(
  title: string,
  content: string,
  options?: DocFormatOptions
): string {
  const fmt = { ...DEFAULT_FORMAT, ...options }
  
  // Format content paragraphs cleanly
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((p) => {
      const trimmed = p.trim()
      if (!trimmed) return ''
      const safe = trimmed
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>')
      
      // Check if it looks like a header, sumilla or title
      const isHeader = /^([A-ZÁÉÍÓÚÑ\s]{4,}|SUMILLA:|EXPEDIENTE:|CUADERNO:|ESCRITO:|SEÑOR\s+[A-ZÁÉÍÓÚÑ]+)/.test(trimmed)
      const isCenter = /^(CARTA NOTARIAL|DEMANDA|CONTRATO|DENUNCIA PENAL|SOLICITUD|RECURSO DE APELACI[ÓO]N)/i.test(trimmed)
      const isSignature = /^(__________|FIRMA|DNI\s*N°|ABOGADO|CAL\s*N°)/im.test(trimmed)

      if (isCenter) {
        return `<p class="doc-title">${safe}</p>`
      }
      if (isHeader) {
        return `<p class="doc-header">${safe}</p>`
      }
      if (isSignature) {
        return `<div class="doc-signature">${safe}</div>`
      }
      return `<p class="doc-paragraph">${safe}</p>`
    })
    .filter(Boolean)
    .join('\n')

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  @page {
    size: A4 portrait;
    margin: ${fmt.marginTopCm}cm ${fmt.marginRightCm}cm ${fmt.marginBottomCm}cm ${fmt.marginLeftCm}cm;
  }
  * { box-sizing: border-box; }
  body {
    font-family: ${fmt.fontFamilyCss};
    font-size: ${fmt.fontSizePt}pt;
    line-height: ${fmt.lineHeight};
    color: #111111;
    background: #ffffff;
    padding: ${fmt.marginTopCm}cm ${fmt.marginRightCm}cm ${fmt.marginBottomCm}cm ${fmt.marginLeftCm}cm;
    max-width: 21cm;
    margin: 0 auto;
    text-rendering: optimizeLegibility;
  }
  .doc-container {
    width: 100%;
  }
  .doc-title {
    text-align: center;
    font-weight: bold;
    font-size: 13pt;
    margin: 14pt 0 12pt 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    page-break-after: avoid;
    break-after: avoid;
  }
  .doc-header {
    font-weight: bold;
    margin: 8pt 0 6pt 0;
    line-height: 1.4;
    page-break-after: avoid;
    break-after: avoid;
  }
  .doc-paragraph {
    text-align: justify;
    text-justify: inter-word;
    margin: 0 0 9pt 0;
    line-height: ${fmt.lineHeight};
    page-break-inside: avoid;
    break-inside: avoid;
    orphans: 3;
    widows: 3;
  }
  .doc-signature {
    margin-top: 36pt;
    text-align: center;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .no-print {
    margin: 16px auto 24px auto;
    text-align: center;
  }
  .btn-print {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 28px;
    background: #c9a84c;
    color: #111111;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    font-family: Arial, sans-serif;
    box-shadow: 0 4px 12px rgba(201,168,76,0.35);
  }
  @media print {
    body {
      padding: 0 !important;
      margin: 0 !important;
      max-width: 100% !important;
    }
    .no-print {
      display: none !important;
    }
    .doc-paragraph {
      page-break-inside: auto;
    }
  }
</style>
</head>
<body>
<div class="no-print">
  <button class="btn-print" onclick="window.print()">🖨️ Imprimir Documento / Guardar como PDF Oficial</button>
</div>
<div class="doc-container">
${paragraphs}
</div>
</body>
</html>`
}

export function downloadWordDoc(
  filename: string,
  content: string,
  title?: string,
  options?: DocFormatOptions
) {
  const fmt = { ...DEFAULT_FORMAT, ...options }
  const marginPt = (cm: number) => `${Math.round(cm * 28.35)}pt`

  // Format content into clean legal Word paragraphs
  const safeParagraphs = content
    .split(/\n\s*\n/)
    .map((p) => {
      const trimmed = p.trim()
      if (!trimmed) return ''
      const safe = trimmed
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>')

      const isCenter = /^(CARTA NOTARIAL|DEMANDA|CONTRATO|DENUNCIA PENAL|SOLICITUD|RECURSO DE APELACI[ÓO]N)/i.test(trimmed)
      const isHeader = /^([A-ZÁÉÍÓÚÑ\s]{4,}|SUMILLA:|EXPEDIENTE:|CUADERNO:|ESCRITO:|SEÑOR\s+[A-ZÁÉÍÓÚÑ]+)/.test(trimmed)
      const isSignature = /^(__________|FIRMA|DNI\s*N°|ABOGADO|CAL\s*N°)/im.test(trimmed)

      if (isCenter) {
        return `<p style="text-align: center; font-weight: bold; font-size: 13pt; margin: 12pt 0 10pt 0; text-transform: uppercase;">${safe}</p>`
      }
      if (isHeader) {
        return `<p style="font-weight: bold; margin: 6pt 0 4pt 0; line-height: 1.3;">${safe}</p>`
      }
      if (isSignature) {
        return `<p style="text-align: center; margin-top: 36pt; line-height: 1.4;">${safe}</p>`
      }
      return `<p style="text-align: justify; text-justify: inter-word; margin: 0 0 8pt 0; line-height: ${fmt.lineHeight};">${safe}</p>`
    })
    .filter(Boolean)
    .join('\n')

  const wordHTML = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${title || filename}</title>
<!--[if gte mso 9]>
<xml>
  <w:WordDocument>
    <w:View>Print</w:View>
    <w:Zoom>100</w:Zoom>
    <w:DoNotOptimizeForBrowser/>
  </w:WordDocument>
</xml>
<![endif]-->
<style>
  @page Section1 {
    size: 595.3pt 841.9pt; /* A4 */
    margin: ${marginPt(fmt.marginTopCm!)} ${marginPt(fmt.marginRightCm!)} ${marginPt(fmt.marginBottomCm!)} ${marginPt(fmt.marginLeftCm!)};
    mso-header-margin: 0pt;
    mso-footer-margin: 0pt;
    mso-paper-source: 0;
  }
  div.Section1 { page: Section1; }
  body {
    font-family: ${fmt.fontFamilyCss};
    font-size: ${fmt.fontSizePt}pt;
    line-height: ${fmt.lineHeight};
    color: #000000;
  }
  p {
    margin: 0 0 8pt 0;
    text-align: justify;
    line-height: ${fmt.lineHeight};
    mso-pagination: widow-orphan;
  }
</style>
</head>
<body>
<div class="Section1">
${safeParagraphs}
</div>
</body>
</html>`

  const blob = new Blob(['\ufeff' + wordHTML], { type: 'application/msword;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const cleanName = (filename || 'Documento_Legal').replace(/[^a-zA-Z0-9_\-]/g, '_')
  a.href = url
  a.download = `${cleanName}.doc`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function printDocument(title: string, content: string, options?: DocFormatOptions) {
  const html = buildPrintHTML(title, content, options)
  const win = window.open('', '_blank', 'width=950,height=750')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}

export interface ExtractedDocument {
  title: string
  type: string
  content: string
}

export function extractDocumentFromMessage(rawContent: string): {
  conversationalText: string
  document: ExtractedDocument | null
} {
  if (!rawContent || typeof rawContent !== 'string') {
    return { conversationalText: rawContent || '', document: null }
  }

  // 1. Check for explicit ```document ... ``` or ```doc ... ``` block
  const docBlockRegex = /```(?:document|doc|escrito|contrato|demanda)\s*\n([\s\S]*?)```/i
  const match = rawContent.match(docBlockRegex)

  if (match) {
    const blockContent = match[1].trim()
    let title = 'Documento_Legal'
    let docType = 'DOCUMENTO OFICIAL'
    let docBody = blockContent

    const titleMatch = blockContent.match(/^TITULO:\s*(.+)$/im)
    const typeMatch = blockContent.match(/^TIPO:\s*(.+)$/im)

    if (titleMatch) title = titleMatch[1].trim()
    if (typeMatch) docType = typeMatch[1].trim().toUpperCase()

    // Remove TITULO:, TIPO: and separator line from doc body
    docBody = blockContent
      .replace(/^TITULO:\s*.*$/im, '')
      .replace(/^TIPO:\s*.*$/im, '')
      .replace(/^---+$/m, '')
      .trim()

    const conversationalText = rawContent.replace(docBlockRegex, '').trim()

    return {
      conversationalText,
      document: {
        title,
        type: docType,
        content: docBody || blockContent,
      },
    }
  }

  // 2. Fallback: check if the message contains a large formal document block
  const legalMarkers = [
    /(?:^|\n)(CARTA NOTARIAL[\s\S]{100,})/i,
    /(?:^|\n)(SEÑOR JUEZ[\s\S]{100,})/i,
    /(?:^|\n)(SEÑOR FISCAL[\s\S]{100,})/i,
    /(?:^|\n)(CONTRATO DE[\s\S]{100,})/i,
    /(?:^|\n)(SOLICITO:\s*[\s\S]{100,})/i,
    /(?:^|\n)(EXPEDIENTE\s*:\s*[\s\S]{100,})/i,
    /(?:^|\n)(RECURSO DE APELACI[ÓO]N[\s\S]{100,})/i,
    /(?:^|\n)(DENUNCIA PENAL[\s\S]{100,})/i,
  ]

  for (const marker of legalMarkers) {
    const m = rawContent.match(marker)
    if (m && m[1]) {
      const docBody = m[1].trim()
      const firstLine = docBody.split('\n')[0].replace(/[*#_]/g, '').trim()
      const title = firstLine.length > 5 && firstLine.length < 70 ? firstLine : 'Documento_Legal'
      const conversationalText = rawContent.replace(m[1], '').trim()

      return {
        conversationalText,
        document: {
          title,
          type: 'DOCUMENTO OFICIAL',
          content: docBody,
        },
      }
    }
  }

  return { conversationalText: rawContent, document: null }
}

