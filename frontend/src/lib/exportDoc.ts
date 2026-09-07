/**
 * ══════════════════════════════════════════════════════════════════════════════
 * FISCALIA IA — Motor de Exportación de Documentos Legales Oficiales
 * ══════════════════════════════════════════════════════════════════════════════
 * Estándares aplicados:
 *  - Poder Judicial del Perú: Art. 424-425 CPC, Art. 16 NLPT, NCPP
 *  - Notarías Perú: D.Leg. 1049 (Ley del Notariado)
 *  - Ministerio Público: NCPP — Denuncia Penal
 *  - Formato A4 oficial | Times New Roman 12pt | Interlineado 1.5
 *  - Márgenes: Sup 3.0cm · Izq 3.0cm · Der 2.5cm · Inf 2.5cm
 *  - CERO asteriscos, markdown ni caracteres extraños en el documento final
 * ══════════════════════════════════════════════════════════════════════════════
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  convertMillimetersToTwip,
} from 'docx'

export interface DocFormatOptions {
  fontFamilyCss?: string
  fontSizePt?: number
  lineHeight?: number
  marginTopCm?: number
  marginRightCm?: number
  marginBottomCm?: number
  marginLeftCm?: number
}

export const DEFAULT_LEGAL_FORMAT: DocFormatOptions = {
  fontFamilyCss: '"Times New Roman", Times, "Liberation Serif", Georgia, serif',
  fontSizePt: 12,
  lineHeight: 1.5,
  marginTopCm: 3.0,
  marginRightCm: 2.5,
  marginBottomCm: 2.5,
  marginLeftCm: 3.0,
}

// ─── LIMPIEZA TOTAL DE MARKDOWN (para texto plano en documentos) ──────────────
export function stripAllMarkdown(raw: string): string {
  if (!raw) return ''
  return raw
    // Negritas triples ***
    .replace(/\*{3}([^*]+)\*{3}/g, '$1')
    // Negritas dobles **
    .replace(/\*{2}([^*]+)\*{2}/g, '$1')
    // Cursivas simples *
    .replace(/\*([^*]+)\*/g, '$1')
    // Subrayado triple ___
    .replace(/_{3}([^_]+)_{3}/g, '$1')
    // Subrayado doble __
    .replace(/_{2}([^_]+)_{2}/g, '$1')
    // Subrayado simple _  (solo si no es parte de una palabra)
    .replace(/(?<!\w)_([^_]+)_(?!\w)/g, '$1')
    // Código `backtick`
    .replace(/`([^`]+)`/g, '$1')
    // Headings ### ## #
    .replace(/^#{1,6}\s+/gm, '')
    // Blockquote >
    .replace(/^>\s*/gm, '')
    // Líneas horizontales ---  ***  ___
    .replace(/^[-*_]{3,}\s*$/gm, '')
    // Marcadores de lista - · •
    .replace(/^[-•·]\s+/gm, '• ')
    // Limpiar espacios múltiples
    .replace(/  +/g, ' ')
    .trim()
}

// ─── PARSER INLINE MARKDOWN → DOCX TextRuns (mantiene bold/italic reales y elimina asteriscos) ─────
export function parseInlineMarkdownToDocx(
  rawText: string,
  baseStyle: { font?: string; size?: number; bold?: boolean; italics?: boolean } = {}
): TextRun[] {
  const font = baseStyle.font || 'Times New Roman'
  const size = baseStyle.size || 24 // 24 half-points = 12pt

  if (!rawText) return [new TextRun({ text: '', font, size })]

  const parts: Array<{ text: string; bold: boolean; italics: boolean }> = []
  // Tokeniza: ***texto***, **texto**, *texto*, __texto__, _texto_
  const regex = /(\*{3}[^*]+\*{3}|_{3}[^_]+_{3}|\*{2}[^*]+\*{2}|_{2}[^_]+_{2}|\*[^*]+\*|_[^_]+_)/g
  let lastIdx = 0
  let m: RegExpExecArray | null

  while ((m = regex.exec(rawText)) !== null) {
    if (m.index > lastIdx) {
      // Elimina cualquier asterisco o carácter markdown residual del texto plano
      const plain = rawText.slice(lastIdx, m.index).replace(/[*_`#]/g, '')
      if (plain) {
        parts.push({
          text: plain,
          bold: baseStyle.bold || false,
          italics: baseStyle.italics || false,
        })
      }
    }
    const token = m[0]
    let text = ''
    let bold = baseStyle.bold || false
    let italics = baseStyle.italics || false

    if (token.startsWith('***') || token.startsWith('___')) {
      text = token.slice(3, -3); bold = true; italics = true
    } else if (token.startsWith('**') || token.startsWith('__')) {
      text = token.slice(2, -2); bold = true
    } else {
      text = token.slice(1, -1); italics = true
    }
    // Asegurar que no quede ningún asterisco o markdown anidado
    text = text.replace(/[*_`#]/g, '')
    if (text) parts.push({ text, bold, italics })
    lastIdx = regex.lastIndex
  }

  if (lastIdx < rawText.length) {
    const trailing = rawText.slice(lastIdx).replace(/[*_`#]/g, '')
    if (trailing) {
      parts.push({
        text: trailing,
        bold: baseStyle.bold || false,
        italics: baseStyle.italics || false,
      })
    }
  }

  if (parts.length === 0) {
    const fallbackClean = rawText.replace(/[*_`#]/g, '')
    return [new TextRun({ text: fallbackClean, font, size, bold: baseStyle.bold, italics: baseStyle.italics })]
  }

  return parts
    .filter((p) => p.text)
    .map((p) => new TextRun({ text: p.text, font, size, bold: p.bold, italics: p.italics }))
}

// ─── PARSER INLINE MARKDOWN → HTML LIMPIO (para vista previa y PDF) ───────────
export function parseInlineMarkdownToHtml(rawText: string): string {
  if (!rawText) return ''
  let s = rawText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  // Orden importa: más largo primero
  s = s.replace(/\*{3}([^*]+)\*{3}/g, '<strong><em>$1</em></strong>')
  s = s.replace(/_{3}([^_]+)_{3}/g, '<strong><em>$1</em></strong>')
  s = s.replace(/\*{2}([^*]+)\*{2}/g, '<strong>$1</strong>')
  s = s.replace(/_{2}([^_]+)_{2}/g, '<strong>$1</strong>')
  s = s.replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
  s = s.replace(/(?<!\w)_([^_\n]+)_(?!\w)/g, '<em>$1</em>')
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>')
  // Elimina cualquier asterisco o símbolo markdown que haya quedado suelto
  s = s.replace(/[*`#]/g, '')
  return s
}

// ─── LIMPIA ENCABEZADOS (heading #) → texto plano ─────────────────────────────
export function cleanHeading(text: string): string {
  if (!text) return ''
  return text
    .replace(/^#{1,6}\s*/, '')
    .replace(/^[•\-\*·]\s+/, '')
    .replace(/\*{2,3}([^*]+)\*{2,3}/g, '$1')
    .replace(/_{2,3}([^_]+)_{2,3}/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/[*_`#]/g, '')
    .trim()
}

// ─── IDENTIFICADOR UNIVERSAL DE TIPO DE LÍNEA ─────────────────────────────────
type LineKind =
  | 'MAIN_TITLE'      // DEMANDA, CARTA NOTARIAL, CONTRATO, DENUNCIA PENAL...
  | 'AUTHORITY'       // SEÑOR JUEZ, SEÑOR FISCAL, AL JUZGADO...
  | 'SUMILLA'         // SUMILLA: ...
  | 'SECTION_ROMAN'   // I. OBJETO  II. HECHOS   III. DERECHO...
  | 'SECTION_TEXT'    // PRIMERO: PETITORIO   OTROSI DIGO...
  | 'SECTION_NUM'     // 1. ... 2. ... numerados en secciones
  | 'HEADING_MD'      // ## Título markdown
  | 'BULLET'          // • - * item
  | 'SEPARATOR'       // __________ (línea de firma)
  | 'SIGNATURE_LABEL' // DNI N°: ... ABOGADO: ... CAL N°:
  | 'FIELD'           // Nombre: [xxx] DNI: [xxx] Domicilio: ...
  | 'PLAIN'           // Párrafo normal

function classifyLine(line: string): LineKind {
  const t = line.trim()
  const plain = cleanHeading(t)

  if (!t) return 'PLAIN'

  // Separador de firma
  if (/^_{5,}[-–—_\s]*$/.test(t)) return 'SEPARATOR'

  // Título principal del documento (centrado, bold, mayúsculas)
  if (/^(CARTA NOTARIAL|DENUNCIA PENAL|DENUNCIA|DEMANDA DE|DEMANDA|CONTRATO DE|CONTRATO|RECURSO DE APELACI[OÓ]N|RECURSO DE RECLAMACI[OÓ]N|RECURSO DE QUEJA|MEDIDA CAUTELAR|SOLICITUD DE|SOLICITUD|ESCRITO DE DESCARGO|ESCRITO|INFORME|DICTAMEN)/i.test(plain)) return 'MAIN_TITLE'

  // Autoridad destinataria
  if (/^(SE[ÑN]OR\s+(JUEZ|FISCAL|PRESIDENTE|DIRECTOR|NOTARIO|SECRETARIO)|AL\s+(JUZGADO|SEÑOR|SE[ÑN]OR|DESPACHO)|A\s+LA\s+(FISCALÍA|JUNTA|AUTORIDAD|CORTE|SALA))/i.test(plain)) return 'AUTHORITY'

  // Sumilla, expediente
  if (/^(SUMILLA\s*:|EXPEDIENTE\s*N?°?\s*:|CUADERNO\s*:|ESCRITO\s*N?°?\s*:|SECRETARIO\s*:|ESPECIALISTA\s*:)/i.test(plain)) return 'SUMILLA'

  // Encabezados markdown ## ### ####
  if (/^#{2,4}\s/.test(t)) return 'HEADING_MD'

  // Secciones romanas: I. II. III. IV. ...
  if (/^[IVXLCDM]+\.\s+[A-ZÁÉÍÓÚÑ].{2,}/i.test(plain)) return 'SECTION_ROMAN'

  // Secciones texto: PRIMERO, SEGUNDO, POR TANTO, OTROSI...
  if (/^(PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|S[EÉ]PTIMO|OCTAVO|NOVENO|D[EÉ]CIMO|POR\s+TANTO|OTROSI\s+DIGO|OTROSI|PETITORIO|FUNDAMENTOS?(\s+DE)?\s+(HECHO|DERECHO)|MEDIOS?\s+PROBATORIOS?|ANEXOS?|POR\s+LO\s+EXPUESTO)\s*:?\s*$/i.test(plain)) return 'SECTION_TEXT'

  // Numeración de sección: 1. texto 2. texto
  if (/^\d{1,2}\.\s+[A-ZÁÉÍÓÚÑ].{3,}/.test(plain) && plain.length < 80) return 'SECTION_NUM'

  // Etiqueta de firma
  if (/^(FIRMA|DNI\s*N?°|RUC\s*N?°|CAL\s*N?°|CIP\s*N?°|ABOGADO\s*:|COLEGIO DE ABOGADOS|N?°\s*COLEGIATURA|LUGAR\s+Y\s+FECHA|FECHA\s*:)\s*[:\s]/i.test(plain)) return 'SIGNATURE_LABEL'

  // Campo de datos: Nombre: / Domicilio: / DNI:
  if (/^(NOMBRE\s*:|DNI\s*(?:N°)?\s*:|DOMICILIO\s*(REAL|PROCESAL|ELECTRÓNICO)?\s*:|DIRECCIÓN\s*:|CORREO\s*:|TELÉFONO\s*:|REPRESENTANTE\s*:|ESTADO CIVIL\s*:|OCUPACIÓN\s*:|CASILLA\s*(JUDICIAL|ELECTRÓNICA)?\s*:|RUC\s*(?:N°)?\s*:)/i.test(plain)) return 'FIELD'

  // Viñetas / listas
  if (/^[•\-\*·]\s+/.test(t)) return 'BULLET'

  return 'PLAIN'
}

// ─── GENERADOR DE CUERPO HTML PARA PREVIEW EN CHAT / PDF ──────────────────────
export function renderDocHtmlBody(content: string): string {
  const lines = content
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')

  const blocks: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()
    const kind = classifyLine(trimmed)

    // Línea vacía → separador visual
    if (!trimmed) {
      i++
      continue
    }

    const htmlLine = parseInlineMarkdownToHtml(cleanHeading(trimmed))

    switch (kind) {
      case 'MAIN_TITLE':
        blocks.push(`<h1 class="doc-title">${htmlLine}</h1>`)
        break

      case 'AUTHORITY':
        blocks.push(`<div class="doc-authority">${htmlLine}</div>`)
        break

      case 'SUMILLA':
        blocks.push(`<div class="doc-sumilla">${htmlLine}</div>`)
        break

      case 'HEADING_MD':
        blocks.push(`<h2 class="doc-section">${htmlLine}</h2>`)
        break

      case 'SECTION_ROMAN':
      case 'SECTION_TEXT':
      case 'SECTION_NUM':
        blocks.push(`<h2 class="doc-section">${htmlLine}</h2>`)
        break

      case 'SEPARATOR':
        blocks.push(`<div class="doc-sig-line">_______________________________</div>`)
        break

      case 'SIGNATURE_LABEL':
        blocks.push(`<div class="doc-sig-field">${htmlLine}</div>`)
        break

      case 'FIELD':
        blocks.push(`<div class="doc-field">${htmlLine}</div>`)
        break

      case 'BULLET': {
        const bulletText = trimmed.replace(/^[•\-\*·]\s+/, '').trim()
        blocks.push(`<div class="doc-bullet"><span class="doc-bullet-dot">•</span><span>${parseInlineMarkdownToHtml(bulletText)}</span></div>`)
        break
      }

      case 'PLAIN':
      default: {
        // Acumula líneas PLAIN consecutivas en un párrafo
        const paraLines: string[] = [parseInlineMarkdownToHtml(trimmed)]
        i++
        while (i < lines.length) {
          const next = lines[i].trim()
          if (!next) break
          const nextKind = classifyLine(next)
          if (nextKind === 'PLAIN') {
            paraLines.push(parseInlineMarkdownToHtml(next))
            i++
          } else break
        }
        blocks.push(`<p class="doc-paragraph">${paraLines.join(' ')}</p>`)
        continue
      }
    }
    i++
  }

  return blocks.join('\n')
}

// ─── HOJA CSS COMPLETA PARA IMPRESIÓN / PDF ────────────────────────────────────
function buildDocCSS(fmt: Required<DocFormatOptions>): string {
  return `
    @page {
      size: A4 portrait;
      margin: ${fmt.marginTopCm}cm ${fmt.marginRightCm}cm ${fmt.marginBottomCm}cm ${fmt.marginLeftCm}cm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: ${fmt.fontFamilyCss};
      font-size: ${fmt.fontSizePt}pt;
      line-height: ${fmt.lineHeight};
      color: #111;
      background: #fff;
      padding: ${fmt.marginTopCm}cm ${fmt.marginRightCm}cm ${fmt.marginBottomCm}cm ${fmt.marginLeftCm}cm;
      max-width: 21cm;
      margin: 0 auto;
      text-rendering: optimizeLegibility;
    }
    /* ── Título principal centrado ── */
    .doc-title {
      font-size: 13pt;
      font-weight: bold;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin: 18pt 0 14pt;
      page-break-after: avoid;
    }
    /* ── Destinatario / Autoridad ── */
    .doc-authority {
      font-weight: bold;
      margin: 0 0 6pt;
      line-height: 1.4;
      page-break-after: avoid;
    }
    /* ── Sumilla / Expediente ── */
    .doc-sumilla {
      font-weight: bold;
      margin: 0 0 14pt;
      line-height: 1.4;
    }
    /* ── Secciones (I. II. PRIMERO: etc.) ── */
    .doc-section {
      font-size: ${fmt.fontSizePt}pt;
      font-weight: bold;
      text-transform: uppercase;
      margin: 14pt 0 6pt;
      page-break-after: avoid;
    }
    /* ── Párrafo legal justificado ── */
    .doc-paragraph {
      text-align: justify;
      text-justify: inter-word;
      margin: 0 0 8pt;
      line-height: ${fmt.lineHeight};
      orphans: 3;
      widows: 3;
      page-break-inside: avoid;
    }
    /* ── Campos de datos (Nombre: / DNI:) ── */
    .doc-field {
      margin: 2pt 0 2pt 18pt;
      line-height: 1.4;
    }
    /* ── Viñetas ── */
    .doc-bullet {
      display: flex;
      align-items: flex-start;
      gap: 7px;
      margin: 3pt 0 3pt 14pt;
      text-align: justify;
      line-height: ${fmt.lineHeight};
    }
    .doc-bullet-dot {
      font-weight: bold;
      flex-shrink: 0;
      margin-top: 1px;
    }
    /* ── Línea de firma ── */
    .doc-sig-line {
      text-align: center;
      margin: 42pt 0 3pt;
      letter-spacing: 2px;
    }
    /* ── Etiquetas de firma ── */
    .doc-sig-field {
      text-align: center;
      font-weight: bold;
      margin: 2pt 0;
      line-height: 1.4;
    }
    /* ── Inline ── */
    strong, b { font-weight: bold; }
    em, i { font-style: italic; }
    code { font-family: Consolas, monospace; font-size: 10pt; background: #f4f4f4; padding: 1px 4px; border-radius: 2px; }
    /* ── Botón de impresión ── */
    .no-print { margin: 14px auto 24px; text-align: center; }
    .btn-print {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 11px 28px; background: #c9a84c; color: #111;
      border: none; border-radius: 8px; font-size: 13px;
      font-weight: 700; cursor: pointer; font-family: Arial, sans-serif;
      box-shadow: 0 3px 12px rgba(201,168,76,0.35);
    }
    .btn-print:hover { background: #dfbc5e; }
    @media print {
      body { padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
      .no-print { display: none !important; }
      .doc-paragraph { page-break-inside: auto; }
    }
  `
}

// ─── CONSTRUCTOR HTML OFICIAL PARA IMPRESIÓN Y PDF ────────────────────────────
export function buildPrintHTML(
  title: string,
  content: string,
  options?: DocFormatOptions
): string {
  const fmt = { ...DEFAULT_LEGAL_FORMAT, ...options } as Required<DocFormatOptions>
  const bodyHtml = renderDocHtmlBody(content)
  const css = buildDocCSS(fmt)

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${title || 'Documento Legal Oficial'}</title>
<style>${css}</style>
</head>
<body>
<div class="no-print">
  <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Guardar como PDF Oficial</button>
</div>
<div class="doc-container">
${bodyHtml}
</div>
</body>
</html>`
}

// ─── GENERADOR DOCX NATIVO OPENXML (.docx) ────────────────────────────────────
export async function downloadWordDoc(
  filename: string,
  content: string,
  title?: string,
  options?: DocFormatOptions
) {
  const fmt = { ...DEFAULT_LEGAL_FORMAT, ...options } as Required<DocFormatOptions>

  const lines = content
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')

  const docChildren: Paragraph[] = []

  // Agrupar líneas en párrafos lógicos (las líneas vacías son separadores)
  let paraBuffer: string[] = []

  const flushPara = () => {
    if (!paraBuffer.length) return

    const firstLine = paraBuffer[0].trim()
    const kind = classifyLine(firstLine)
    const allText = paraBuffer.map((l) => l.trim()).filter(Boolean)

    switch (kind) {
      case 'MAIN_TITLE':
        docChildren.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 320, after: 240, line: 360 },
          keepNext: true,
          children: [new TextRun({
            text: cleanHeading(firstLine).toUpperCase(),
            font: 'Times New Roman',
            size: 27, // 13.5pt
            bold: true,
          })],
        }))
        break

      case 'AUTHORITY':
        for (const l of allText) {
          docChildren.push(new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 80, after: 60, line: 320 },
            keepNext: true,
            children: [new TextRun({
              text: cleanHeading(l),
              font: 'Times New Roman',
              size: 24,
              bold: true,
            })],
          }))
        }
        break

      case 'SUMILLA':
        for (const l of allText) {
          docChildren.push(new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 60, after: 60, line: 320 },
            keepNext: true,
            children: parseInlineMarkdownToDocx(cleanHeading(l), { bold: true, size: 24 }),
          }))
        }
        break

      case 'SECTION_ROMAN':
      case 'SECTION_TEXT':
      case 'SECTION_NUM':
      case 'HEADING_MD':
        docChildren.push(new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 280, after: 100, line: 360 },
          keepNext: true,
          children: [new TextRun({
            text: cleanHeading(firstLine).toUpperCase(),
            font: 'Times New Roman',
            size: 24,
            bold: true,
          })],
        }))
        // Líneas adicionales del mismo bloque
        for (let idx = 1; idx < allText.length; idx++) {
          docChildren.push(new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 40, after: 100, line: 360 },
            children: parseInlineMarkdownToDocx(allText[idx], { size: 24 }),
          }))
        }
        break

      case 'SEPARATOR':
        docChildren.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 720, after: 120, line: 280 },
          children: [new TextRun({
            text: '______________________________',
            font: 'Times New Roman',
            size: 24,
          })],
        }))
        break

      case 'SIGNATURE_LABEL':
        for (const l of allText) {
          docChildren.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 60, after: 60, line: 280 },
            children: parseInlineMarkdownToDocx(l, { bold: true, size: 24 }),
          }))
        }
        break

      case 'FIELD':
        for (const l of allText) {
          docChildren.push(new Paragraph({
            alignment: AlignmentType.LEFT,
            indent: { left: convertMillimetersToTwip(10) },
            spacing: { before: 40, after: 40, line: 320 },
            children: parseInlineMarkdownToDocx(l, { size: 24 }),
          }))
        }
        break

      case 'BULLET':
        for (const l of allText) {
          const bulletText = l.trim().replace(/^[•\-\*·]\s+/, '').trim()
          docChildren.push(new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            indent: { left: convertMillimetersToTwip(12), hanging: convertMillimetersToTwip(6) },
            spacing: { before: 40, after: 60, line: 340 },
            children: [
              new TextRun({ text: '•  ', font: 'Times New Roman', size: 24, bold: true }),
              ...parseInlineMarkdownToDocx(bulletText, { size: 24 }),
            ],
          }))
        }
        break

      case 'PLAIN':
      default: {
        // Párrafo normal justificado — une líneas y preserva formato negrita real
        const joined = allText.join(' ')
        if (joined.trim()) {
          docChildren.push(new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 60, after: 160, line: 360 },
            children: parseInlineMarkdownToDocx(joined, { size: 24 }),
          }))
        }
        break
      }
    }

    paraBuffer = []
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      flushPara()
    } else {
      paraBuffer.push(trimmed)
    }
  }
  flushPara()

  // ── Documento OpenXML .docx con márgenes oficiales peruanos ──
  const doc = new Document({
    creator: 'Fiscalia IA — Bufete Digital Perú',
    title: title || filename || 'Documento Legal',
    description: 'Documento legal generado por Fiscalia IA bajo estándares del Poder Judicial del Perú',
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertMillimetersToTwip(fmt.marginTopCm),       // 3.0 cm
              bottom: convertMillimetersToTwip(fmt.marginBottomCm), // 2.5 cm
              left: convertMillimetersToTwip(fmt.marginLeftCm),     // 3.0 cm
              right: convertMillimetersToTwip(fmt.marginRightCm),   // 2.5 cm
            },
          },
        },
        children: docChildren,
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const cleanName = (filename || title || 'Documento_Legal').replace(/[^a-zA-Z0-9_\-]/g, '_')
  a.href = url
  a.download = `${cleanName}.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── IMPRESIÓN / PDF ───────────────────────────────────────────────────────────
export function printDocument(title: string, content: string, options?: DocFormatOptions) {
  const html = buildPrintHTML(title, content, options)
  const win = window.open('', '_blank', 'width=970,height=780')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}

// ─── EXTRACCIÓN DE DOCUMENTOS DEL MENSAJE IA ──────────────────────────────────
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

  // 1. Bloque explícito ```document ... ```
  const docBlockRegex = /```(?:document|doc|escrito|contrato|demanda|denuncia)\s*\n([\s\S]*?)```/i
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

    docBody = blockContent
      .replace(/^TITULO:\s*.*$/im, '')
      .replace(/^TIPO:\s*.*$/im, '')
      .replace(/^---+\s*$/m, '')
      .trim()

    const conversationalText = rawContent.replace(docBlockRegex, '').trim()
    return {
      conversationalText,
      document: { title, type: docType, content: docBody || blockContent },
    }
  }

  // 2. Detección automática de encabezados legales formales
  const legalMarkers = [
    /(?:^|\n)(CARTA NOTARIAL[\s\S]{100,})/i,
    /(?:^|\n)(SE[ÑN]OR\s+JUEZ[\s\S]{100,})/i,
    /(?:^|\n)(SE[ÑN]OR\s+FISCAL[\s\S]{100,})/i,
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
      const firstLine = docBody.split('\n')[0].replace(/[*#_`]/g, '').trim()
      const title = firstLine.length > 5 && firstLine.length < 80 ? firstLine : 'Documento_Legal'
      const conversationalText = rawContent.replace(m[1], '').trim()
      return {
        conversationalText,
        document: { title, type: 'DOCUMENTO OFICIAL', content: docBody },
      }
    }
  }

  return { conversationalText: rawContent, document: null }
}
