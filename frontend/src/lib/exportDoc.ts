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
  const safeContent = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

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
  }
  pre {
    white-space: pre-wrap;
    word-wrap: break-word;
    word-break: normal;
    overflow-wrap: break-word;
    hyphens: none;
    font-family: ${fmt.fontFamilyCss};
    font-size: ${fmt.fontSizePt}pt;
    line-height: ${fmt.lineHeight};
    text-align: justify;
    color: #111111;
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
    pre {
      page-break-inside: auto;
    }
  }
</style>
</head>
<body>
<div class="no-print">
  <button class="btn-print" onclick="window.print()">🖨️ Imprimir Documento / Guardar como PDF</button>
</div>
<pre>${safeContent}</pre>
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

  const safeContent = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n\n+/g, '</p><p>')
    .replace(/\n/g, '<br>')

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
    margin: 0 0 10pt 0;
    text-align: justify;
    line-height: ${fmt.lineHeight};
  }
</style>
</head>
<body>
<div class="Section1">
  <p>${safeContent}</p>
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
