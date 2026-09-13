/**
 * ══════════════════════════════════════════════════════════════════════════════
 * FISCALIA IA — Motor de Exportación de Documentos Legales Oficiales
 * ══════════════════════════════════════════════════════════════════════════════
 * Estándares aplicados:
 *  - Poder Judicial del Perú: Art. 424-425 CPC, Art. 16 NLPT, NCPP
 *  - Notarías Perú: D.Leg. 1049 (Ley del Notariado), Ley 30933, Ley 32430 (2026)
 *  - Formato A4 oficial | Times New Roman 12pt / 11pt | Interlineado 1.15 - 1.5
 *  - Márgenes procesales y notariales: Sup 2.5cm · Izq 3.0cm · Der 2.5cm · Inf 2.5cm
 *  - Soporte nativo de firmas dobles (Arrendador/Arrendatario, Demandante/Abogado)
 *    en tabla invisible a 2 columnas (Word), grid CSS (HTML) y coordenadas paralelas (PDF)
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
  Header,
  Footer,
  PageNumber,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from 'docx'
import { jsPDF } from 'jspdf'

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

// ─── LIMPIEZA TOTAL DE MARKDOWN ───────────────────────────────────────────────
export function stripAllMarkdown(raw: string): string {
  if (!raw) return ''
  return raw
    .replace(/\*{3}([^*]+)\*{3}/g, '$1')
    .replace(/\*{2}([^*]+)\*{2}/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_{3}([^_]+)_{3}/g, '$1')
    .replace(/_{2}([^_]+)_{2}/g, '$1')
    .replace(/(?<!\w)_([^_]+)_(?!\w)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s*/gm, '')
    .replace(/^[-*_]{3,}\s*$/gm, '')
    .replace(/^[-•·]\s+/gm, '• ')
    .replace(/  +/g, ' ')
    .trim()
}

// ─── PARSER INLINE MARKDOWN → DOCX TextRuns ───────────────────────────────────
export function parseInlineMarkdownToDocx(
  rawText: string,
  baseStyle: { font?: string; size?: number; bold?: boolean; italics?: boolean } = {}
): TextRun[] {
  const font = baseStyle.font || 'Times New Roman'
  const size = baseStyle.size || 24 // 24 half-points = 12pt

  if (!rawText) return [new TextRun({ text: '', font, size })]

  const parts: Array<{ text: string; bold: boolean; italics: boolean }> = []
  const regex = /(\*{3}[^*]+\*{3}|_{3}[^_]+_{3}|\*{2}[^*]+\*{2}|_{2}[^_]+_{2}|\*[^*]+\*|_[^_]+_)/g
  let lastIdx = 0
  let m: RegExpExecArray | null

  while ((m = regex.exec(rawText)) !== null) {
    if (m.index > lastIdx) {
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

// ─── PARSER INLINE MARKDOWN → HTML LIMPIO ─────────────────────────────────────
export function parseInlineMarkdownToHtml(rawText: string): string {
  if (!rawText) return ''
  let s = rawText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  s = s.replace(/\*{3}([^*]+)\*{3}/g, '<strong><em>$1</em></strong>')
  s = s.replace(/_{3}([^_]+)_{3}/g, '<strong><em>$1</em></strong>')
  s = s.replace(/\*{2}([^*]+)\*{2}/g, '<strong>$1</strong>')
  s = s.replace(/_{2}([^_]+)_{2}/g, '<strong>$1</strong>')
  s = s.replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
  s = s.replace(/(?<!\w)_([^_\n]+)_(?!\w)/g, '<em>$1</em>')
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>')
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

// ─── IDENTIFICADOR DE CLÁUSULA CONTRACTUAL PERUANA ───────────────────────────
export function isClauseHeading(text: string): boolean {
  if (!text) return false
  const p = cleanHeading(text).toUpperCase()
  return /^(CL[ÁA]USULA\s+)?(PRIMER[OA]|SEGUND[OA]|TERCER[OA]|CUART[OA]|QUINT[OA]|SEXT[OA]|S[ÉE]PTIM[OA]|OCTAV[OA]|NOVEN[OA]|D[ÉE]CIM[OA](\s+(PRIMER[OA]|SEGUND[OA]|TERCER[OA]|CUART[OA]|QUINT[OA]|SEXT[OA]|S[ÉE]PTIM[OA]|OCTAV[OA]|NOVEN[OA]))?|VIG[ÉE]SIM[OA](\s+\w+)?)\s*(\.-|\.|\:|\-)/i.test(p)
}

// ─── IDENTIFICADOR UNIVERSAL DE TIPO DE LÍNEA ─────────────────────────────────
export type LineKind =
  | 'MAIN_TITLE'
  | 'AUTHORITY'
  | 'SUMILLA'
  | 'CLAUSE'
  | 'SECTION_ROMAN'
  | 'SECTION_TEXT'
  | 'SECTION_NUM'
  | 'HEADING_MD'
  | 'BULLET'
  | 'SEPARATOR'
  | 'SIGNATURE_LABEL'
  | 'FIELD'
  | 'TABLE_ROW'
  | 'PLAIN'

export function classifyLine(line: string): LineKind {
  const t = line.trim()
  const plain = cleanHeading(t)

  if (!t) return 'PLAIN'

  // Fila de tabla markdown (| Col 1 | Col 2 | o |---|---|)
  if (/^\|.*\|$/.test(t)) return 'TABLE_ROW'

  // Separador de firma
  if (/^_{4,}[-–—_\s]*$/.test(t)) return 'SEPARATOR'

  // Cláusulas de contratos (PRIMERA.-, SEGUNDA.-, DÉCIMO PRIMERA.-, etc.)
  if (isClauseHeading(t)) return 'CLAUSE'

  // Título principal del documento
  if (/^(CONTRATO DE ARRENDAMIENTO|CONTRATO DE|CONTRATO|CARTA NOTARIAL|DENUNCIA PENAL|DENUNCIA|DEMANDA DE|DEMANDA|RECURSO DE APELACI[OÓ]N|RECURSO DE RECLAMACI[OÓ]N|RECURSO DE QUEJA|MEDIDA CAUTELAR|SOLICITUD DE|SOLICITUD|ESCRITO DE DESCARGO|ESCRITO|INFORME|DICTAMEN|PODER SIMPLE|PODER ESPECIAL)/i.test(plain)) return 'MAIN_TITLE'

  // Autoridad destinataria
  if (/^(SE[ÑN]OR\s+(JUEZ|FISCAL|PRESIDENTE|DIRECTOR|NOTARIO|SECRETARIO)|AL\s+(JUZGADO|SEÑOR|SE[ÑN]OR|DESPACHO)|A\s+LA\s+(FISCALÍA|JUNTA|AUTORIDAD|CORTE|SALA))/i.test(plain)) return 'AUTHORITY'

  // Sumilla, expediente, carpeta fiscal, carátula judicial / fiscal
  if (/^(SUMILLA\s*:|EXPEDIENTE(\s+JUDICIAL)?\s*N?°?\s*:|EXP\.?\s*(NOTARIAL|JUDICIAL)?\s*N?°?\s*:|CARPETA\s+FISCAL\s*N?°?\s*:|FISCAL(\s+RESPONSABLE|\s+RESP\.?)?\s*:|CUADERNO\s*:|ESCRITO\s*N?°?\s*:|SECRETARIO(\s+JUDICIAL)?\s*:|ESPECIALISTA(\s+LEGAL)?\s*:|CASILLA\s*(SINOE|ELECTR[OÓ]NICA|F[IÍ]SICA)?\s*N?°?\s*:|KARDEX(\s+NOTARIAL)?\s*N?°?\s*:)/i.test(plain)) return 'SUMILLA'

  // Encabezados markdown ## ### ####
  if (/^#{2,4}\s/.test(t)) return 'HEADING_MD'

  // Secciones romanas: I. II. III. IV. ...
  if (/^[IVXLCDM]+\.\s+[A-ZÁÉÍÓÚÑ].{2,}/i.test(plain)) return 'SECTION_ROMAN'

  // Secciones texto: PRIMERO, SEGUNDO, POR TANTO, OTROSI...
  if (/^((PRIMER|SEGUNDO|TERCER|CUARTO|QUINTO|SEXTO)\s+)?OTROS[IÍ](\s+DIGO)?(\.-|\s*:|\s*-)/i.test(plain) || /^(PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|S[EÉ]PTIMO|OCTAVO|NOVENO|D[EÉ]CIMO|POR\s+TANTO|OTROSI\s+DIGO|OTROSI|PETITORIO|FUNDAMENTOS?(\s+DE)?\s+(HECHO|DERECHO)|MEDIOS?\s+PROBATORIOS?|ANEXOS?|POR\s+LO\s+EXPUESTO)\s*:?\s*$/i.test(plain)) return 'SECTION_TEXT'

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

// ─── ESTRUCTURA DE FIRMA Y BLOQUES DE DOCUMENTO ──────────────────────────────
export interface SignatureCol {
  line?: string
  role?: string
  name?: string
  docId?: string
  extra?: string
}

export interface DoubleSignatureData {
  left: SignatureCol
  right: SignatureCol
}

export type DocBlock =
  | { kind: 'MAIN_TITLE'; text: string }
  | { kind: 'AUTHORITY'; lines: string[] }
  | { kind: 'SUMILLA'; lines: string[] }
  | { kind: 'CLAUSE'; text: string }
  | { kind: 'SECTION'; text: string; sublines: string[] }
  | { kind: 'BULLET'; items: string[] }
  | { kind: 'FIELD'; lines: string[] }
  | { kind: 'SEPARATOR'; text: string }
  | { kind: 'SIGNATURE_LABEL'; lines: string[] }
  | { kind: 'DOUBLE_SIGNATURE'; data: DoubleSignatureData }
  | { kind: 'TABLE'; headers: string[]; rows: string[][] }
  | { kind: 'PLAIN'; text: string }

// ─── PARSER INTELIGENTE DE BLOQUES LEGALES ────────────────────────────────────
export function parseDocumentBlocks(content: string): DocBlock[] {
  const rawLines = content
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')

  const blocks: DocBlock[] = []
  let i = 0

  while (i < rawLines.length) {
    const line = rawLines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      i++
      continue
    }

    // 1. Detección de bloque de firmas dobles en una misma línea (ej. "_____          _____")
    if (/^_{4,}\s{3,}_{4,}/.test(trimmed)) {
      const leftCol: SignatureCol = { line: '_________________________________' }
      const rightCol: SignatureCol = { line: '_________________________________' }
      i++

      const sigLines: string[] = []
      while (i < rawLines.length && sigLines.length < 5) {
        const next = rawLines[i].trim()
        if (!next) {
          i++
          if (i < rawLines.length && rawLines[i].trim()) continue
          break
        }
        if (/^_{5,}/.test(next) || isClauseHeading(next) || classifyLine(next) === 'MAIN_TITLE') {
          break
        }
        sigLines.push(next)
        i++
      }

      for (const sl of sigLines) {
        const parts = sl.split(/\s{3,}|\t+/).map(p => p.trim()).filter(Boolean)
        if (parts.length >= 2) {
          const pLeft = parts[0]
          const pRight = parts[1]

          if (!leftCol.name && (/^(?:NOMBRE|\[\s*NOMBRE)/i.test(pLeft) || /^(?:NOMBRE|\[\s*NOMBRE)/i.test(pRight))) {
            leftCol.name = pLeft
            rightCol.name = pRight
            continue
          }

          if (!leftCol.role && (/^(EL\s+ARRENDADOR|EL\s+DEMANDANTE|EL\s+PRESTAMISTA|EL\s+MUTUANTE|EL\s+OTORGANTE|EL\s+VENDEDOR|EL\s+LOCADOR|EL\s+PROPIETARIO|PARTE\s+A|DEMANDANTE|PROPIETARIO)\b/i.test(pLeft) || /^(EL\s+ARRENDATARIO|EL\s+DEMANDADO|EL\s+PRESTATARIO|EL\s+MUTUARIO|EL\s+APODERADO|EL\s+COMPRADOR|EL\s+INQUILINO|ABOGADO|PARTE\s+B)\b/i.test(pRight)) && !/^(?:NOMBRE|\[\s*NOMBRE)/i.test(pLeft) && !/^(?:NOMBRE|\[\s*NOMBRE)/i.test(pRight)) {
            leftCol.role = pLeft
            rightCol.role = pRight
            continue
          }

          if (!leftCol.name && !/^(DNI|RUC|CAL|CIP|LEGALIZACI[OÓ]N|REG\.?)/i.test(pLeft)) {
            leftCol.name = pLeft
            rightCol.name = pRight
            continue
          }

          if (/^(DNI|RUC|CAL|CIP|DOCUMENTO|REG\.?)/i.test(pLeft) || /^(DNI|RUC|CAL|CIP|DOCUMENTO|REG\.?)/i.test(pRight) || !leftCol.docId) {
            leftCol.docId = pLeft
            rightCol.docId = pRight
            continue
          }

          if (!leftCol.role) {
            leftCol.role = pLeft
            rightCol.role = pRight
            continue
          }

          if (!leftCol.extra) {
            leftCol.extra = pLeft
            rightCol.extra = pRight
          }
        }
      }

      blocks.push({
        kind: 'DOUBLE_SIGNATURE',
        data: { left: leftCol, right: rightCol },
      })
      continue
    }

    // 2. Detección de dos bloques de firmas consecutivos (ej. contratos extraídos donde cada parte tiene su propio bloque)
    if (/^_{4,}/.test(trimmed)) {
      let lookAheadIdx = i + 1
      const firstBlockLines: string[] = []
      while (lookAheadIdx < rawLines.length && firstBlockLines.length < 5) {
        const la = rawLines[lookAheadIdx].trim()
        if (!la) {
          lookAheadIdx++
          continue
        }
        if (/^_{4,}/.test(la)) {
          break
        }
        if (isClauseHeading(la) || classifyLine(la) === 'MAIN_TITLE') {
          break
        }
        firstBlockLines.push(la)
        lookAheadIdx++
      }

      // Si inmediatamente o tras líneas vacías sigue otro separador de firma
      if (lookAheadIdx < rawLines.length && /^_{4,}/.test(rawLines[lookAheadIdx].trim())) {
        const secondBlockLines: string[] = []
        lookAheadIdx++ // salta el segundo separador
        while (lookAheadIdx < rawLines.length && secondBlockLines.length < 5) {
          const la = rawLines[lookAheadIdx].trim()
          if (!la) {
            lookAheadIdx++
            continue
          }
          if (/^_{4,}/.test(la) || isClauseHeading(la) || classifyLine(la) === 'MAIN_TITLE') {
            break
          }
          secondBlockLines.push(la)
          lookAheadIdx++
        }

        const parseSigLines = (arr: string[]): SignatureCol => {
          const col: SignatureCol = { line: '_________________________________' }
          for (const item of arr) {
            if (/^(EL\s+ARRENDADOR|EL\s+ARRENDATARIO|EL\s+DEMANDANTE|EL\s+DEMANDADO|EL\s+PRESTAMISTA|EL\s+PRESTATARIO|EL\s+MUTUANTE|EL\s+MUTUARIO|EL\s+OTORGANTE|EL\s+APODERADO|EL\s+VENDEDOR|EL\s+COMPRADOR|EL\s+LOCADOR|ABOGADO|PROPIETARIO|INQUILINO|FIRMA)/i.test(item)) {
              col.role = item
            } else if (/^(DNI|RUC|CAL|CIP|DOCUMENTO)/i.test(item)) {
              col.docId = item
            } else if (!col.name) {
              col.name = item
            } else {
              col.extra = item
            }
          }
          return col
        }

        const left = parseSigLines(firstBlockLines)
        const right = parseSigLines(secondBlockLines)

        blocks.push({
          kind: 'DOUBLE_SIGNATURE',
          data: { left, right },
        })
        i = lookAheadIdx
        continue
      }
    }

    // 3. Cláusula de contrato
    if (isClauseHeading(trimmed)) {
      blocks.push({ kind: 'CLAUSE', text: cleanHeading(trimmed) })
      i++
      continue
    }

    const kind = classifyLine(trimmed)

    switch (kind) {
      case 'MAIN_TITLE':
        blocks.push({ kind: 'MAIN_TITLE', text: cleanHeading(trimmed) })
        i++
        break

      case 'AUTHORITY': {
        const authLines = [cleanHeading(trimmed)]
        i++
        while (i < rawLines.length) {
          const next = rawLines[i].trim()
          if (!next) break
          if (classifyLine(next) === 'AUTHORITY') {
            authLines.push(cleanHeading(next))
            i++
          } else break
        }
        blocks.push({ kind: 'AUTHORITY', lines: authLines })
        break
      }

      case 'SUMILLA': {
        const sumLines = [cleanHeading(trimmed)]
        i++
        while (i < rawLines.length) {
          const next = rawLines[i].trim()
          if (!next) break
          const nextKind = classifyLine(next)
          if (nextKind === 'SUMILLA') {
            sumLines.push(cleanHeading(next))
            i++
          } else if (nextKind === 'FIELD' && /^(DENUNCIANTE|DENUNCIADO|IMPUTADO|INVESTIGADO|AGRAVIADO|DELITO|MATERIA|DEMANDANTE|DEMANDADO)\s*:/i.test(cleanHeading(next))) {
            // Campos de carátula judicial o fiscal que forman parte del recuadro derecho
            sumLines.push(cleanHeading(next))
            i++
          } else break
        }
        blocks.push({ kind: 'SUMILLA', lines: sumLines })
        break
      }

      case 'SECTION_ROMAN':
      case 'SECTION_TEXT':
      case 'SECTION_NUM':
      case 'HEADING_MD': {
        const titleText = cleanHeading(trimmed)
        const sublines: string[] = []
        i++
        while (i < rawLines.length) {
          const next = rawLines[i].trim()
          if (!next) break
          if (isClauseHeading(next)) break
          const nKind = classifyLine(next)
          if (nKind === 'PLAIN') {
            sublines.push(next)
            i++
          } else break
        }
        blocks.push({ kind: 'SECTION', text: titleText, sublines })
        break
      }

      case 'BULLET': {
        const items = [trimmed.replace(/^[•\-\*·]\s+/, '').trim()]
        i++
        while (i < rawLines.length) {
          const next = rawLines[i].trim()
          if (!next) break
          if (classifyLine(next) === 'BULLET') {
            items.push(next.replace(/^[•\-\*·]\s+/, '').trim())
            i++
          } else break
        }
        blocks.push({ kind: 'BULLET', items })
        break
      }

      case 'FIELD': {
        const fieldLines = [cleanHeading(trimmed)]
        i++
        while (i < rawLines.length) {
          const next = rawLines[i].trim()
          if (!next) break
          if (classifyLine(next) === 'FIELD') {
            fieldLines.push(cleanHeading(next))
            i++
          } else break
        }
        blocks.push({ kind: 'FIELD', lines: fieldLines })
        break
      }

      case 'SEPARATOR':
        blocks.push({ kind: 'SEPARATOR', text: '_______________________________' })
        i++
        break

      case 'SIGNATURE_LABEL': {
        const sigLines = [cleanHeading(trimmed)]
        i++
        while (i < rawLines.length) {
          const next = rawLines[i].trim()
          if (!next) break
          if (classifyLine(next) === 'SIGNATURE_LABEL') {
            sigLines.push(cleanHeading(next))
            i++
          } else break
        }
        blocks.push({ kind: 'SIGNATURE_LABEL', lines: sigLines })
        break
      }

      case 'TABLE_ROW': {
        const tableLines: string[] = [trimmed]
        i++
        while (i < rawLines.length) {
          const next = rawLines[i].trim()
          if (!next) break
          if (classifyLine(next) === 'TABLE_ROW') {
            tableLines.push(next)
            i++
          } else break
        }

        const parseCells = (rowStr: string): string[] => {
          let s = rowStr.trim()
          if (s.startsWith('|')) s = s.slice(1)
          if (s.endsWith('|')) s = s.slice(0, -1)
          return s.split('|').map(cell => cell.trim())
        }

        if (tableLines.length >= 2) {
          const firstCells = parseCells(tableLines[0])
          const secondLine = tableLines[1].trim()
          const isSeparator = /^\|?[\s\-:|]+\|?$/.test(secondLine) && secondLine.includes('-')

          let headers: string[] = []
          let dataLines: string[] = []

          if (isSeparator) {
            headers = firstCells
            dataLines = tableLines.slice(2)
          } else {
            if (firstCells.some(h => /^(CONCEPTO|MONTO|DATO|DETALLE|N°|ITEM|DESCRIPCI[OÓ]N)/i.test(h))) {
              headers = firstCells
              dataLines = tableLines.slice(1)
            } else {
              headers = []
              dataLines = tableLines
            }
          }

          const rows = dataLines
            .filter(l => !(/^\|?[\s\-:|]+\|?$/.test(l.trim()) && l.includes('-')))
            .map(parseCells)
            .filter(r => r.some(c => c.length > 0))

          blocks.push({ kind: 'TABLE', headers, rows })
        } else if (tableLines.length === 1) {
          blocks.push({ kind: 'TABLE', headers: [], rows: [parseCells(tableLines[0])] })
        }
        break
      }

      case 'PLAIN':
      default: {
        const paraLines = [trimmed]
        i++
        while (i < rawLines.length) {
          const next = rawLines[i].trim()
          if (!next) break
          if (isClauseHeading(next)) break
          if (/^_{4,}/.test(next)) break
          const nKind = classifyLine(next)
          if (nKind === 'PLAIN') {
            paraLines.push(next)
            i++
          } else break
        }
        blocks.push({ kind: 'PLAIN', text: paraLines.join(' ') })
        break
      }
    }
  }

  return blocks
}

// ─── MEMBRETE DE ESTUDIO JURÍDICO & REEMPLAZO DE PLACEHOLDERS ──────────────────
export interface LawFirmLetterhead {
  firmName?: string
  attorneyInfo?: string
  contactInfo?: string
  attorneyName?: string
  cal?: string
  colegiatura?: string
  sinoe?: string
  email?: string
  phone?: string
  address?: string
}

export function getSavedLetterhead(): LawFirmLetterhead | null {
  try {
    const raw = localStorage.getItem('hardman_letterhead')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (
        parsed.firmName ||
        parsed.attorneyInfo ||
        parsed.contactInfo ||
        parsed.attorneyName ||
        parsed.cal ||
        parsed.sinoe
      ) {
        return parsed
      }
    }
  } catch {
    // ignore
  }
  return null
}

export function parseLetterheadDetails(letterhead?: LawFirmLetterhead | null): {
  firmName: string
  attorneyName: string
  cal: string
  sinoe: string
  email: string
  phone: string
  address: string
} {
  if (!letterhead) {
    return { firmName: '', attorneyName: '', cal: '', sinoe: '', email: '', phone: '', address: '' }
  }

  const res = {
    firmName: (letterhead.firmName || '').trim(),
    attorneyName: (letterhead.attorneyName || '').trim(),
    cal: (letterhead.cal || letterhead.colegiatura || '').trim(),
    sinoe: (letterhead.sinoe || '').trim(),
    email: (letterhead.email || '').trim(),
    phone: (letterhead.phone || '').trim(),
    address: (letterhead.address || '').trim(),
  }

  // 1. Extraer nombre y colegiatura de attorneyInfo si no están definidos explícitamente
  const att = (letterhead.attorneyInfo || '').trim()
  if (att) {
    if (!res.attorneyName) {
      const parts = att.split(/\s*[-—|]\s*|\s+(?:Reg\.?|C\.?A\.?L\.?|Colegiatura)\b/i)
      if (parts[0] && parts[0].trim()) {
        res.attorneyName = parts[0].trim()
      }
    }
    if (!res.cal) {
      const calMatch = att.match(/(?:Reg\.?\s*C\.?A\.?L\.?|C\.?A\.?L\.?|Colegiatura|Reg\.?)\s*(?:N°|N|#)?\s*[:.]?\s*([0-9A-Za-z-]+)/i)
        || att.match(/\bCAL\s*[:.]?\s*([0-9A-Za-z-]+)/i)
        || att.match(/\b([0-9]{4,6})\b/)
      if (calMatch) {
        res.cal = calMatch[1] || calMatch[0]
      }
    }
  }

  // 2. Extraer datos de contacto (SINOE, email, celular, dirección) si no están definidos explícitamente
  const contact = (letterhead.contactInfo || '').trim()
  if (contact) {
    if (!res.sinoe) {
      const sinoeMatch = contact.match(/(?:Casilla\s*(?:Electr[oó]nica)?\s*(?:SINOE)?|SINOE)\s*(?:N°|N|#)?\s*[:.]?\s*([0-9A-Za-z-]+)/i)
        || contact.match(/\bSINOE\s*[:.]?\s*([0-9A-Za-z-]+)/i)
      if (sinoeMatch) {
        res.sinoe = sinoeMatch[1]
      }
    }
    if (!res.email) {
      const emailMatch = contact.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
      if (emailMatch) {
        res.email = emailMatch[0]
      }
    }
    if (!res.phone) {
      const phoneMatch = contact.match(/(?:Cel(?:ular)?|Tel(?:[eé]fono)?|Movil|Móvil)\.?\s*[:.]?\s*([0-9\s-]{7,15})/i)
        || contact.match(/\b(9\d{2}[\s.-]?\d{3}[\s.-]?\d{3})\b/)
      if (phoneMatch) {
        res.phone = phoneMatch[1].trim()
      }
    }
    if (!res.address) {
      const segments = contact.split(/[\n|]/).map(s => s.trim()).filter(Boolean)
      for (const seg of segments) {
        if (!/(?:Cel|SINOE|Casilla|@|Tel)/i.test(seg) && seg.length > 5) {
          res.address = seg
          break
        }
      }
    }
  }

  return res
}

export function replaceLetterheadPlaceholders(
  text: string,
  letterhead?: LawFirmLetterhead | null
): string {
  if (!text) return text
  const lhead = letterhead ?? getSavedLetterhead()
  if (!lhead) return text
  const p = parseLetterheadDetails(lhead)

  let res = text

  // 1. Nombre del Abogado
  if (p.attorneyName) {
    res = res.replace(
      /\[\s*(?:NOMBRE\s+(?:COMPLETO\s+)?(?:DEL\s+)?ABOGADO(?:\s+(?:DEFENSOR|PATROCINANTE|QUE\s+SUSCRIBE))?|NOMBRE\s+DEL\s+ABOGADO\s*\/\s*ESTUDIO|NOMBRE\s+DEL\s+ABOGADO\s+DEFENSOR\s*\/\s*IMPUTADO|ABOGADO\s+(?:DEFENSOR|PATROCINANTE)|ABOGADO)\s*\]/gi,
      p.attorneyName
    )
  }

  // 2. Registro CAL / Colegiatura
  if (p.cal) {
    res = res.replace(
      /\[\s*(?:REGISTRO\s+CAL(?:\s*N°)?|REGISTRO\s+C\.?A\.?L\.?|CAL\s*N°|CAL|COLEGIATURA|N°\s+DE\s+COLEGIATURA|N°\s+COLEGIATURA|REGISTRO\s+DE\s+COLEGIATURA)\s*\]/gi,
      p.cal
    )
  }

  // 3. Casilla SINOE
  if (p.sinoe) {
    res = res.replace(
      /\[\s*(?:CASILLA\s+SINOE(?:\s*N°)?|CASILLA\s+ELECTR[OÓ]NICA\s+SINOE|CASILLA\s+ELECTR[OÓ]NICA|CASILLA\s+ELECTRONICA|CASILLA|SINOE)\s*\]/gi,
      p.sinoe
    )
  }

  // 4. Correo electrónico procesal
  if (p.email) {
    res = res.replace(
      /\[\s*(?:CORREO\s+ELECTR[OÓ]NICO\s+PROCESAL|CORREO\s+ELECTRONICO\s+PROCESAL|CORREO\s+ELECTR[OÓ]NICO|CORREO\s+ELECTRONICO|CORREO|EMAIL)\s*\]/gi,
      p.email
    )
  }

  // 5. Teléfono / Celular
  if (p.phone) {
    res = res.replace(
      /\[\s*(?:TEL[EÉ]FONO\s+DE\s+CONTACTO|TELEFONO\s+DE\s+CONTACTO|N[UÚ]MERO\s+DE\s+CONTACTO|NUMERO\s+DE\s+CONTACTO|TEL[EÉ]FONO|TELEFONO|CELULAR|NUMERO|N[UÚ]MERO)\s*\]/gi,
      p.phone
    )
  }

  // 6. Domicilio Procesal / Dirección del Estudio
  if (p.address) {
    res = res.replace(
      /\[\s*(?:DIRECCI[OÓ]N\s+(?:DEL\s+ESTUDIO(?:\s+JUR[IÍ]DICO)?|PROCESAL)|DIRECCION\s+(?:DEL\s+ESTUDIO(?:\s+JURIDICO)?|PROCESAL)|DOMICILIO\s+(?:DEL\s+ESTUDIO(?:\s+JUR[IÍ]DICO)?|PROCESAL)(?:\s*\/\s*ESTUDIO)?|DIRECCI[OÓ]N\s+COMPLETA|DIRECCION\s+COMPLETA|DOMICILIO\s+LEGAL|DIRECCI[OÓ]N\s+LEGAL)\s*\]/gi,
      p.address
    )
  }

  // 7. Nombre del Estudio / Razón Social
  if (p.firmName) {
    res = res.replace(
      /\[\s*(?:NOMBRE\s+DEL\s+ESTUDIO(?:\s+JUR[IÍ]DICO)?|ESTUDIO\s+JUR[IÍ]DICO|ESTUDIO\s+JURIDICO|RAZ[OÓ]N\s+SOCIAL|RAZON\s+SOCIAL)\s*\]/gi,
      p.firmName
    )
  }

  // 8. Casilla Física (asigna número SINOE o valor registrado)
  if (p.sinoe) {
    res = res.replace(/\[\s*(?:CASILLA\s+F[IÍ]SICA(?:\s*N°)?|CASILLA\s+FISICA)\s*\]/gi, p.sinoe)
  }

  // 9. Año actual (ej. N° 01-[AÑO ACTUAL])
  const now = new Date()
  res = res.replace(/\[\s*(?:A[ÑN]O\s+ACTUAL|A[ÑN]O)\s*\]/gi, `${now.getFullYear()}`)

  // 10. Fecha procesal (sustituye [fecha completa] o [FECHA] por fecha actual en español)
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre']
  const formattedDate = `${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()}`
  res = res.replace(/\[\s*(?:FECHA\s+COMPLETA|FECHA\s+ACTUAL|FECHA)\s*\]/gi, formattedDate)

  return res
}

// ─── GENERADOR DE CUERPO HTML PARA PREVIEW EN CHAT Y MODALES ───────────────────
export function renderDocHtmlBody(content: string, letterhead?: LawFirmLetterhead | null): string {
  const cleanContent = replaceLetterheadPlaceholders(content, letterhead)
  const blocks = parseDocumentBlocks(cleanContent)
  const htmlParts: string[] = []

  for (const block of blocks) {
    switch (block.kind) {
      case 'MAIN_TITLE':
        htmlParts.push(`<h1 class="doc-title">${parseInlineMarkdownToHtml(block.text)}</h1>`)
        break

      case 'AUTHORITY':
        for (const l of block.lines) {
          htmlParts.push(`<div class="doc-authority">${parseInlineMarkdownToHtml(l)}</div>`)
        }
        break

      case 'SUMILLA':
        htmlParts.push(`<div class="doc-sumilla-box">`)
        for (const l of block.lines) {
          htmlParts.push(`<div class="doc-sumilla">${parseInlineMarkdownToHtml(l)}</div>`)
        }
        htmlParts.push(`</div>`)
        break

      case 'CLAUSE':
        htmlParts.push(`<div class="doc-clause">${parseInlineMarkdownToHtml(block.text)}</div>`)
        break

      case 'SECTION':
        htmlParts.push(`<h2 class="doc-section">${parseInlineMarkdownToHtml(block.text)}</h2>`)
        for (const sl of block.sublines) {
          htmlParts.push(`<p class="doc-paragraph">${parseInlineMarkdownToHtml(sl)}</p>`)
        }
        break

      case 'BULLET':
        for (const item of block.items) {
          htmlParts.push(`<div class="doc-bullet"><span class="doc-bullet-dot">•</span><span>${parseInlineMarkdownToHtml(item)}</span></div>`)
        }
        break

      case 'FIELD':
        for (const f of block.lines) {
          htmlParts.push(`<div class="doc-field">${parseInlineMarkdownToHtml(f)}</div>`)
        }
        break

      case 'SEPARATOR':
        htmlParts.push(`<div class="doc-sig-line">_______________________________</div>`)
        break

      case 'SIGNATURE_LABEL':
        for (const sl of block.lines) {
          htmlParts.push(`<div class="doc-sig-field">${parseInlineMarkdownToHtml(sl)}</div>`)
        }
        break

      case 'DOUBLE_SIGNATURE':
        htmlParts.push(`
          <div class="doc-sig-grid">
            <div class="doc-sig-col">
              <div class="doc-sig-line">${parseInlineMarkdownToHtml(block.data.left.line || '_________________________________')}</div>
              ${block.data.left.role ? `<div class="doc-sig-role">${parseInlineMarkdownToHtml(block.data.left.role)}</div>` : ''}
              ${block.data.left.name ? `<div class="doc-sig-name">${parseInlineMarkdownToHtml(block.data.left.name)}</div>` : ''}
              ${block.data.left.docId ? `<div class="doc-sig-id">${parseInlineMarkdownToHtml(block.data.left.docId)}</div>` : ''}
              ${block.data.left.extra ? `<div class="doc-sig-extra">${parseInlineMarkdownToHtml(block.data.left.extra)}</div>` : ''}
            </div>
            <div class="doc-sig-col">
              <div class="doc-sig-line">${parseInlineMarkdownToHtml(block.data.right.line || '_________________________________')}</div>
              ${block.data.right.role ? `<div class="doc-sig-role">${parseInlineMarkdownToHtml(block.data.right.role)}</div>` : ''}
              ${block.data.right.name ? `<div class="doc-sig-name">${parseInlineMarkdownToHtml(block.data.right.name)}</div>` : ''}
              ${block.data.right.docId ? `<div class="doc-sig-id">${parseInlineMarkdownToHtml(block.data.right.docId)}</div>` : ''}
              ${block.data.right.extra ? `<div class="doc-sig-extra">${parseInlineMarkdownToHtml(block.data.right.extra)}</div>` : ''}
            </div>
          </div>
        `)
        break

      case 'TABLE': {
        htmlParts.push('<div class="doc-table-container"><table class="doc-table">')
        if (block.headers.length > 0) {
          htmlParts.push('<thead><tr>')
          for (const h of block.headers) {
            htmlParts.push(`<th>${parseInlineMarkdownToHtml(h)}</th>`)
          }
          htmlParts.push('</tr></thead>')
        }
        htmlParts.push('<tbody>')
        for (const row of block.rows) {
          const isTotal = row.some(cell => /TOTAL/i.test(cell))
          htmlParts.push(`<tr class="${isTotal ? 'doc-table-total-row' : ''}">`)
          row.forEach((cell, cellIdx) => {
            const isMoney = /^(?:S\/?\.?|\$)\s*[\d,.]+|\b[\d,.]+\s*soles\b/i.test(cell)
            const isHeaderCol = block.headers.length === 2 && cellIdx === 0 && !/^(?:CONCEPTO|N°|ITEM)/i.test(block.headers[0])
            const alignClass = isMoney ? 'text-right' : (isHeaderCol ? 'font-bold bg-gray' : '')
            htmlParts.push(`<td class="${alignClass}">${parseInlineMarkdownToHtml(cell)}</td>`)
          })
          htmlParts.push('</tr>')
        }
        htmlParts.push('</tbody></table></div>')
        break
      }

      case 'PLAIN':
        htmlParts.push(`<p class="doc-paragraph">${parseInlineMarkdownToHtml(block.text)}</p>`)
        break
    }
  }

  return htmlParts.join('\n')
}

// ─── HOJA CSS COMPLETA PARA IMPRESIÓN / PDF ────────────────────────────────────
function buildDocCSS(fmt: Required<DocFormatOptions>): string {
  return `
    /* ── Tablas procesales oficiales ── */
    .doc-table-container {
      width: 100%;
      margin: 12pt 0;
      page-break-inside: avoid;
    }
    .doc-table {
      width: 100%;
      border-collapse: collapse;
      font-family: ${fmt.fontFamilyCss};
      font-size: 11pt;
      line-height: 1.35;
    }
    .doc-table th, .doc-table td {
      border: 0.5pt solid #444444;
      padding: 5pt 8pt;
      vertical-align: top;
    }
    .doc-table th {
      background-color: #D3D3D3;
      color: #111;
      font-weight: bold;
      text-align: left;
    }
    .doc-table tr.doc-table-total-row td {
      background-color: #D3D3D3;
      font-weight: bold;
      text-transform: uppercase;
    }
    .doc-table td.bg-gray {
      background-color: #D3D3D3;
      font-weight: bold;
    }
    .doc-table td.text-right {
      text-align: right;
    }

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
      font-size: 13.5pt;
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
    /* ── Sumilla / Expediente / Carátula Judicial y Fiscal ── */
    .doc-sumilla-box {
      margin: 0 0 16pt auto;
      max-width: 65%;
      text-align: right;
    }
    .doc-sumilla {
      font-weight: bold;
      margin: 0 0 3.5pt;
      line-height: 1.35;
      text-align: right;
      font-size: 10.5pt;
    }
    /* ── Cláusulas de contratos (PRIMERA.-, SEGUNDA.-, etc.) ── */
    .doc-clause {
      font-size: ${fmt.fontSizePt}pt;
      font-weight: bold;
      text-transform: uppercase;
      margin: 16pt 0 6pt;
      letter-spacing: 0.3px;
      page-break-after: avoid;
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
    /* ── Línea de firma individual ── */
    .doc-sig-line {
      text-align: center;
      margin: 36pt 0 3pt;
      letter-spacing: 1px;
    }
    /* ── Etiquetas de firma individual ── */
    .doc-sig-field {
      text-align: center;
      font-weight: bold;
      margin: 2pt 0;
      line-height: 1.4;
    }
    /* ── Firmas dobles en paralelo (Arrendador / Arrendatario) ── */
    .doc-sig-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      column-gap: 36px;
      row-gap: 6px;
      margin-top: 48pt;
      margin-bottom: 24pt;
      text-align: center;
      page-break-inside: avoid;
    }
    .doc-sig-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
    }
    .doc-sig-grid .doc-sig-line {
      margin: 0 0 6pt;
      letter-spacing: 1px;
      color: #333;
    }
    .doc-sig-grid .doc-sig-role {
      font-weight: bold;
      text-transform: uppercase;
      font-size: 10.5pt;
      margin-bottom: 3pt;
      color: #111;
    }
    .doc-sig-grid .doc-sig-name {
      font-size: 10.5pt;
      margin-bottom: 2pt;
      color: #222;
    }
    .doc-sig-grid .doc-sig-id {
      font-size: 9.5pt;
      color: #444;
    }
    .doc-sig-grid .doc-sig-extra {
      font-size: 9pt;
      font-style: italic;
      color: #666;
      margin-top: 2pt;
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
      .doc-sig-grid { page-break-inside: avoid; }
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
  const letterhead = getSavedLetterhead()
  const cleanContent = replaceLetterheadPlaceholders(content, letterhead)
  const bodyHtml = renderDocHtmlBody(cleanContent, letterhead)
  const css = buildDocCSS(fmt)

  let letterheadHtml = ''
  if (letterhead) {
    letterheadHtml = `
    <div style="border-bottom: 2px solid #222; padding-bottom: 10px; margin-bottom: 18pt; display: flex; justify-content: space-between; align-items: flex-end;">
      <div>
        <div style="font-size: 13pt; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; color: #111;">${parseInlineMarkdownToHtml(letterhead.firmName || '')}</div>
        <div style="font-size: 9.5pt; color: #444; margin-top: 3px;">${parseInlineMarkdownToHtml(letterhead.attorneyInfo || '')}</div>
      </div>
      <div style="font-size: 8.5pt; color: #555; text-align: right; line-height: 1.35;">
        ${parseInlineMarkdownToHtml(letterhead.contactInfo || '').replace(/\n/g, '<br>')}
      </div>
    </div>`
  }

  const safeTitle = (title || 'Documento Legal Oficial')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${safeTitle}</title>
<style>${css}</style>
</head>
<body>
<div class="no-print">
  <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Guardar como PDF Oficial</button>
</div>
<div class="doc-container">
${letterheadHtml}
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
  const docChildren: any[] = []

  const letterhead = getSavedLetterhead()
  if (letterhead) {
    if (letterhead.firmName) {
      docChildren.push(new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 0, after: 40, line: 240 },
        children: [
          new TextRun({
            text: letterhead.firmName.toUpperCase(),
            font: 'Times New Roman',
            size: 24, // 12pt
            bold: true,
            color: '1A1A1A',
          }),
        ],
      }))
    }
    if (letterhead.attorneyInfo) {
      docChildren.push(new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 0, after: 40, line: 220 },
        children: [
          new TextRun({
            text: letterhead.attorneyInfo,
            font: 'Times New Roman',
            size: 19, // 9.5pt
            italics: true,
            color: '444444',
          }),
        ],
      }))
    }
    if (letterhead.contactInfo) {
      const contactLines = letterhead.contactInfo.split('\n').map(c => c.trim()).filter(Boolean)
      for (const cl of contactLines) {
        docChildren.push(new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 0, after: 30, line: 200 },
          children: [
            new TextRun({
              text: cl,
              font: 'Times New Roman',
              size: 18, // 9pt
              color: '555555',
            }),
          ],
        }))
      }
    }
    docChildren.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 200, line: 200 },
      children: [
        new TextRun({
          text: '____________________________________________________________________',
          font: 'Times New Roman',
          size: 18,
          color: '333333',
        }),
      ],
    }))
  }

  const cleanContent = replaceLetterheadPlaceholders(content, letterhead)
  const blocks = parseDocumentBlocks(cleanContent)

  for (const block of blocks) {
    switch (block.kind) {
      case 'MAIN_TITLE':
        docChildren.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 280, after: 220, line: 360 },
          keepNext: true,
          children: [new TextRun({
            text: cleanHeading(block.text).toUpperCase(),
            font: 'Times New Roman',
            size: 28, // 14pt
            bold: true,
          })],
        }))
        break

      case 'AUTHORITY':
        for (const l of block.lines) {
          docChildren.push(new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 60, after: 40, line: 320 },
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
        for (const l of block.lines) {
          docChildren.push(new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 20, after: 20, line: 240 },
            keepNext: true,
            indent: { left: 3600 },
            children: parseInlineMarkdownToDocx(cleanHeading(l), { bold: true, size: 22 }),
          }))
        }
        break

      case 'CLAUSE':
        docChildren.push(new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 260, after: 120, line: 276 },
          keepNext: true,
          children: [new TextRun({
            text: cleanHeading(block.text),
            font: 'Times New Roman',
            size: 24,
            bold: true,
          })],
        }))
        break

      case 'SECTION':
        docChildren.push(new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 260, after: 100, line: 320 },
          keepNext: true,
          children: [new TextRun({
            text: cleanHeading(block.text).toUpperCase(),
            font: 'Times New Roman',
            size: 24,
            bold: true,
          })],
        }))
        for (const sl of block.sublines) {
          docChildren.push(new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 40, after: 120, line: 320 },
            children: parseInlineMarkdownToDocx(sl, { size: 24 }),
          }))
        }
        break

      case 'BULLET':
        for (const item of block.items) {
          docChildren.push(new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            indent: { left: convertMillimetersToTwip(12), hanging: convertMillimetersToTwip(6) },
            spacing: { before: 40, after: 60, line: 320 },
            children: [
              new TextRun({ text: '•  ', font: 'Times New Roman', size: 24, bold: true }),
              ...parseInlineMarkdownToDocx(item, { size: 24 }),
            ],
          }))
        }
        break

      case 'FIELD':
        for (const f of block.lines) {
          docChildren.push(new Paragraph({
            alignment: AlignmentType.LEFT,
            indent: { left: convertMillimetersToTwip(10) },
            spacing: { before: 40, after: 40, line: 300 },
            children: parseInlineMarkdownToDocx(f, { size: 24 }),
          }))
        }
        break

      case 'SEPARATOR':
        docChildren.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 600, after: 100, line: 260 },
          children: [new TextRun({
            text: '______________________________',
            font: 'Times New Roman',
            size: 24,
          })],
        }))
        break

      case 'SIGNATURE_LABEL':
        for (const sl of block.lines) {
          docChildren.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 40, after: 40, line: 260 },
            children: parseInlineMarkdownToDocx(sl, { bold: true, size: 24 }),
          }))
        }
        break

      case 'DOUBLE_SIGNATURE':
        // ── Renderizado de firmas paralelas mediante Tabla Word invisible (estándar notarial peruano) ──
        docChildren.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: {
                    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 680, after: 60, line: 240 },
                      children: [new TextRun({ text: block.data.left.line || '_________________________________', font: 'Times New Roman', size: 22 })],
                    }),
                    ...(block.data.left.name ? [new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 20, after: 20, line: 240 },
                      children: [new TextRun({ text: block.data.left.name, font: 'Times New Roman', size: 22, bold: true })],
                    })] : []),
                    ...(block.data.left.docId ? [new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 20, after: 20, line: 240 },
                      children: [new TextRun({ text: block.data.left.docId, font: 'Times New Roman', size: 22 })],
                    })] : []),
                    ...(block.data.left.role ? [new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 20, after: 20, line: 240 },
                      children: [new TextRun({ text: block.data.left.role, font: 'Times New Roman', size: 22 })],
                    })] : []),
                    ...(block.data.left.extra ? [new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 20, after: 20, line: 240 },
                      children: [new TextRun({ text: block.data.left.extra, font: 'Times New Roman', size: 20, italics: true })],
                    })] : []),
                  ],
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: {
                    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 680, after: 60, line: 240 },
                      children: [new TextRun({ text: block.data.right.line || '_________________________________', font: 'Times New Roman', size: 22 })],
                    }),
                    ...(block.data.right.name ? [new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 20, after: 20, line: 240 },
                      children: [new TextRun({ text: block.data.right.name, font: 'Times New Roman', size: 22, bold: true })],
                    })] : []),
                    ...(block.data.right.docId ? [new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 20, after: 20, line: 240 },
                      children: [new TextRun({ text: block.data.right.docId, font: 'Times New Roman', size: 22 })],
                    })] : []),
                    ...(block.data.right.role ? [new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 20, after: 20, line: 240 },
                      children: [new TextRun({ text: block.data.right.role, font: 'Times New Roman', size: 22 })],
                    })] : []),
                    ...(block.data.right.extra ? [new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 20, after: 20, line: 240 },
                      children: [new TextRun({ text: block.data.right.extra, font: 'Times New Roman', size: 20, italics: true })],
                    })] : []),
                  ],
                }),
              ],
            }),
          ],
        }))
        break

      case 'TABLE': {
        const numCols = Math.max(block.headers.length, ...block.rows.map(r => r.length), 1)
        const is2Col = numCols === 2
        const isCalcTable = is2Col && (
          block.headers.some(h => /CONCEPTO/i.test(h)) ||
          block.rows.some(r => r.some(c => /^(?:S\/?\.?|\$)\s*[\d,.]+/i.test(c)))
        )
        const isDataTable = is2Col && !isCalcTable

        const tableBorder = { style: BorderStyle.SINGLE, size: 4, color: '444444' }
        const docxRows: TableRow[] = []

        if (block.headers.length > 0) {
          const headerCells = block.headers.map((h, colIdx) => {
            const widthDxa = isCalcTable
              ? (colIdx === 0 ? 5760 : 2880)
              : (isDataTable ? (colIdx === 0 ? 3600 : 5040) : Math.floor(8640 / numCols))
            const isMoney = /MONTO/i.test(h)
            return new TableCell({
              width: { size: widthDxa, type: WidthType.DXA },
              shading: { fill: 'D3D3D3' },
              borders: {
                top: tableBorder,
                bottom: tableBorder,
                left: tableBorder,
                right: tableBorder,
              },
              children: [
                new Paragraph({
                  alignment: isMoney ? AlignmentType.RIGHT : AlignmentType.LEFT,
                  spacing: { before: 80, after: 80, line: 240 },
                  children: [
                    new TextRun({
                      text: cleanHeading(h).toUpperCase(),
                      font: 'Times New Roman',
                      size: 22,
                      bold: true,
                      color: '111111',
                    }),
                  ],
                }),
              ],
            })
          })
          docxRows.push(new TableRow({ children: headerCells, tableHeader: true }))
        }

        for (const row of block.rows) {
          const isTotalRow = row.some(cell => /TOTAL/i.test(cell))
          const cells = row.map((cell, colIdx) => {
            const widthDxa = isCalcTable
              ? (colIdx === 0 ? 5760 : 2880)
              : (isDataTable ? (colIdx === 0 ? 3600 : 5040) : Math.floor(8640 / numCols))
            const isLabelCol = isDataTable && colIdx === 0
            const isMoney = isCalcTable && (colIdx === 1 || /^(?:S\/?\.?|\$)\s*[\d,.]+/i.test(cell))

            const fillShading = (isTotalRow || isLabelCol) ? 'D3D3D3' : 'FFFFFF'
            const isBold = isTotalRow || isLabelCol
            const cellText = isTotalRow ? cleanHeading(cell).toUpperCase() : cleanHeading(cell)

            return new TableCell({
              width: { size: widthDxa, type: WidthType.DXA },
              shading: { fill: fillShading },
              borders: {
                top: tableBorder,
                bottom: tableBorder,
                left: tableBorder,
                right: tableBorder,
              },
              children: [
                new Paragraph({
                  alignment: isMoney ? AlignmentType.RIGHT : AlignmentType.LEFT,
                  spacing: { before: 60, after: 60, line: 240 },
                  children: parseInlineMarkdownToDocx(cellText, {
                    bold: isBold,
                    size: 22,
                  }),
                }),
              ],
            })
          })

          docxRows.push(new TableRow({ children: cells }))
        }

        docChildren.push(new Table({
          width: { size: 8640, type: WidthType.DXA },
          borders: {
            top: tableBorder,
            bottom: tableBorder,
            left: tableBorder,
            right: tableBorder,
            insideHorizontal: tableBorder,
            insideVertical: tableBorder,
          },
          rows: docxRows,
        }))

        docChildren.push(new Paragraph({
          spacing: { before: 80, after: 120, line: 240 },
          children: [new TextRun({ text: '' })],
        }))
        break
      }

      case 'PLAIN':
        docChildren.push(new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { before: 40, after: 140, line: 300 },
          children: parseInlineMarkdownToDocx(block.text, { size: 24 }),
        }))
        break
    }
  }

  // ── Documento OpenXML .docx con márgenes oficiales peruanos y paginación judicial ──
  const doc = new Document({
    creator: letterhead?.firmName || 'Hardman Inteligencia Jurídica Perú',
    title: title || filename || 'Documento Legal Oficial',
    description: 'Documento procesal formal generado bajo estándares del Poder Judicial del Perú',
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertMillimetersToTwip(fmt.marginTopCm * 10),
              bottom: convertMillimetersToTwip(fmt.marginBottomCm * 10),
              left: convertMillimetersToTwip(fmt.marginLeftCm * 10),
              right: convertMillimetersToTwip(fmt.marginRightCm * 10),
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 140, after: 0 },
                children: [
                  new TextRun({
                    text: letterhead?.firmName ? `${letterhead.firmName}  |  ` : 'Estudio Jurídico  |  ',
                    font: 'Times New Roman',
                    size: 20, // 10pt (20 half-points)
                    color: '555555',
                  }),
                  new TextRun({
                    text: 'Página ',
                    font: 'Times New Roman',
                    size: 20,
                    color: '555555',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: 'Times New Roman',
                    size: 20,
                    color: '555555',
                  }),
                  new TextRun({
                    text: ' de ',
                    font: 'Times New Roman',
                    size: 20,
                    color: '555555',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    font: 'Times New Roman',
                    size: 20,
                    color: '555555',
                  }),
                ],
              }),
            ],
          }),
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

// ─── GENERADOR NATIVO PDF OFICIAL A4 (jsPDF) ──────────────────────────────────
export async function downloadPdfDoc(
  filename: string,
  content: string,
  title?: string,
  options?: DocFormatOptions
): Promise<void> {
  const cleanTitle = (filename || title || 'Documento_Legal').replace(/[^a-zA-Z0-9_\-]/g, '_')
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = 210
  const pageHeight = 297
  const marginLeft = 30 // mm
  const marginRight = 25 // mm
  const marginTop = 25 // mm
  const marginBottom = 25 // mm
  const contentWidth = pageWidth - marginLeft - marginRight // 155 mm

  const letterhead = getSavedLetterhead()
  let currentY = marginTop

  const addHeader = (pageNum: number) => {
    if (letterhead && letterhead.firmName) {
      pdf.setFont('times', 'bold')
      pdf.setFontSize(10.5)
      pdf.setTextColor(20, 20, 20)
      pdf.text(letterhead.firmName.toUpperCase(), marginLeft, 15)

      if (letterhead.attorneyInfo) {
        pdf.setFont('times', 'italic')
        pdf.setFontSize(8)
        pdf.setTextColor(90, 90, 90)
        pdf.text(letterhead.attorneyInfo, marginLeft, 19)
      }

      pdf.setDrawColor(200, 200, 200)
      pdf.setLineWidth(0.3)
      pdf.line(marginLeft, 21.5, pageWidth - marginRight, 21.5)
    }
  }

  const addFooter = (pageNum: number, totalPages: number) => {
    const footerY = pageHeight - 11
    pdf.setDrawColor(215, 215, 215)
    pdf.setLineWidth(0.2)
    pdf.line(marginLeft, footerY - 2.5, pageWidth - marginRight, footerY - 2.5)

    pdf.setFont('times', 'normal')
    pdf.setFontSize(7.5)
    pdf.setTextColor(120, 120, 120)

    const firmStr = letterhead?.firmName ? `${letterhead.firmName}` : 'Hardman Inteligencia Jurídica Perú'
    pdf.text(firmStr, marginLeft, footerY + 1)

    const pageStr = `Página ${pageNum} de ${totalPages}`
    const pageStrWidth = pdf.getTextWidth(pageStr)
    pdf.text(pageStr, pageWidth - marginRight - pageStrWidth, footerY + 1)
  }

  if (letterhead?.firmName) {
    currentY = 27
  }

  const cleanContent = replaceLetterheadPlaceholders(content, letterhead)
  const blocks = parseDocumentBlocks(cleanContent)

  for (const block of blocks) {
    switch (block.kind) {
      case 'MAIN_TITLE': {
        currentY += 4
        if (currentY > pageHeight - marginBottom - 15) {
          pdf.addPage()
          currentY = letterhead?.firmName ? 27 : marginTop
        }
        pdf.setFont('times', 'bold')
        pdf.setFontSize(13)
        pdf.setTextColor(10, 10, 10)
        const wrapped = pdf.splitTextToSize(cleanHeading(block.text).toUpperCase(), contentWidth)
        wrapped.forEach((wl: string) => {
          const textW = pdf.getTextWidth(wl)
          const xPos = marginLeft + (contentWidth - textW) / 2
          pdf.text(wl, xPos, currentY)
          currentY += 6
        })
        currentY += 2
        break
      }

      case 'SUMILLA': {
        pdf.setFont('times', 'bold')
        pdf.setFontSize(10)
        pdf.setTextColor(20, 20, 20)
        const sumillaWidth = 95
        const sumillaX = pageWidth - marginRight - sumillaWidth
        for (const l of block.lines) {
          const wrapped = pdf.splitTextToSize(cleanHeading(l), sumillaWidth)
          wrapped.forEach((wl: string) => {
            if (currentY > pageHeight - marginBottom - 10) {
              pdf.addPage()
              currentY = letterhead?.firmName ? 27 : marginTop
            }
            pdf.text(wl, sumillaX, currentY)
            currentY += 4.8
          })
        }
        currentY += 2
        break
      }

      case 'AUTHORITY': {
        currentY += 2.5
        pdf.setFont('times', 'bold')
        pdf.setFontSize(10.5)
        pdf.setTextColor(10, 10, 10)
        for (const l of block.lines) {
          const wrapped = pdf.splitTextToSize(cleanHeading(l).toUpperCase(), contentWidth)
          wrapped.forEach((wl: string) => {
            if (currentY > pageHeight - marginBottom - 10) {
              pdf.addPage()
              currentY = letterhead?.firmName ? 27 : marginTop
            }
            pdf.text(wl, marginLeft, currentY)
            currentY += 5.2
          })
        }
        currentY += 1.5
        break
      }

      case 'CLAUSE': {
        currentY += 3.5
        if (currentY > pageHeight - marginBottom - 15) {
          pdf.addPage()
          currentY = letterhead?.firmName ? 27 : marginTop
        }
        pdf.setFont('times', 'bold')
        pdf.setFontSize(10.5)
        pdf.setTextColor(15, 15, 15)
        const wrapped = pdf.splitTextToSize(cleanHeading(block.text), contentWidth)
        wrapped.forEach((wl: string) => {
          pdf.text(wl, marginLeft, currentY)
          currentY += 5.2
        })
        currentY += 1
        break
      }

      case 'SECTION': {
        currentY += 3
        if (currentY > pageHeight - marginBottom - 15) {
          pdf.addPage()
          currentY = letterhead?.firmName ? 27 : marginTop
        }
        pdf.setFont('times', 'bold')
        pdf.setFontSize(10.5)
        pdf.setTextColor(15, 15, 15)
        const wrappedTitle = pdf.splitTextToSize(cleanHeading(block.text).toUpperCase(), contentWidth)
        wrappedTitle.forEach((wl: string) => {
          pdf.text(wl, marginLeft, currentY)
          currentY += 5.2
        })
        currentY += 1

        pdf.setFont('times', 'normal')
        pdf.setFontSize(10.5)
        pdf.setTextColor(30, 30, 30)
        for (const sl of block.sublines) {
          const wrapped = pdf.splitTextToSize(cleanHeading(sl), contentWidth)
          wrapped.forEach((wl: string) => {
            if (currentY > pageHeight - marginBottom - 10) {
              pdf.addPage()
              currentY = letterhead?.firmName ? 27 : marginTop
            }
            pdf.text(wl, marginLeft, currentY)
            currentY += 4.9
          })
          currentY += 1
        }
        break
      }

      case 'BULLET': {
        pdf.setFont('times', 'normal')
        pdf.setFontSize(10.5)
        pdf.setTextColor(30, 30, 30)
        for (const item of block.items) {
          if (currentY > pageHeight - marginBottom - 10) {
            pdf.addPage()
            currentY = letterhead?.firmName ? 27 : marginTop
          }
          pdf.setFont('times', 'bold')
          pdf.text('•', marginLeft + 2, currentY)
          pdf.setFont('times', 'normal')
          const wrapped = pdf.splitTextToSize(cleanHeading(item), contentWidth - 8)
          wrapped.forEach((wl: string, idx: number) => {
            pdf.text(wl, marginLeft + 7, currentY)
            currentY += 4.9
          })
          currentY += 0.8
        }
        break
      }

      case 'FIELD': {
        pdf.setFont('times', 'normal')
        pdf.setFontSize(10)
        pdf.setTextColor(20, 20, 20)
        for (const f of block.lines) {
          if (currentY > pageHeight - marginBottom - 10) {
            pdf.addPage()
            currentY = letterhead?.firmName ? 27 : marginTop
          }
          pdf.text(cleanHeading(f), marginLeft + 6, currentY)
          currentY += 4.8
        }
        break
      }

      case 'SEPARATOR': {
        currentY += 12
        if (currentY > pageHeight - marginBottom - 25) {
          pdf.addPage()
          currentY = letterhead?.firmName ? 27 : marginTop
        }
        pdf.setFont('times', 'normal')
        pdf.setFontSize(10)
        pdf.setTextColor(60, 60, 60)
        const sigLine = '____________________________________'
        const sigW = pdf.getTextWidth(sigLine)
        pdf.text(sigLine, marginLeft + (contentWidth - sigW) / 2, currentY)
        currentY += 4.5
        break
      }

      case 'SIGNATURE_LABEL': {
        for (const sl of block.lines) {
          if (currentY > pageHeight - marginBottom - 10) {
            pdf.addPage()
            currentY = letterhead?.firmName ? 27 : marginTop
          }
          pdf.setFont('times', 'bold')
          pdf.setFontSize(9.5)
          pdf.setTextColor(20, 20, 20)
          const textW = pdf.getTextWidth(cleanHeading(sl))
          pdf.text(cleanHeading(sl), marginLeft + (contentWidth - textW) / 2, currentY)
          currentY += 4.2
        }
        break
      }

      case 'DOUBLE_SIGNATURE': {
        currentY += 14
        if (currentY > pageHeight - marginBottom - 35) {
          pdf.addPage()
          currentY = letterhead?.firmName ? 27 : marginTop
        }

        const leftX = marginLeft + (contentWidth * 0.25)
        const rightX = marginLeft + (contentWidth * 0.75)
        const sigLine = '________________________________'

        // 1. Líneas de firma
        pdf.setFont('times', 'normal')
        pdf.setFontSize(10)
        pdf.setTextColor(60, 60, 60)
        pdf.text(sigLine, leftX - pdf.getTextWidth(sigLine) / 2, currentY)
        pdf.text(sigLine, rightX - pdf.getTextWidth(sigLine) / 2, currentY)
        currentY += 5

        // 2. Nombres (Bold)
        if (block.data.left.name || block.data.right.name) {
          pdf.setFont('times', 'bold')
          pdf.setFontSize(9.5)
          pdf.setTextColor(20, 20, 20)
          if (block.data.left.name) {
            pdf.text(block.data.left.name, leftX - pdf.getTextWidth(block.data.left.name) / 2, currentY)
          }
          if (block.data.right.name) {
            pdf.text(block.data.right.name, rightX - pdf.getTextWidth(block.data.right.name) / 2, currentY)
          }
          currentY += 4.5
        }

        // 3. Documentos / DNIs
        if (block.data.left.docId || block.data.right.docId) {
          pdf.setFont('times', 'normal')
          pdf.setFontSize(9)
          pdf.setTextColor(50, 50, 50)
          if (block.data.left.docId) {
            pdf.text(block.data.left.docId, leftX - pdf.getTextWidth(block.data.left.docId) / 2, currentY)
          }
          if (block.data.right.docId) {
            pdf.text(block.data.right.docId, rightX - pdf.getTextWidth(block.data.right.docId) / 2, currentY)
          }
          currentY += 4.2
        }

        // 4. Roles
        if (block.data.left.role || block.data.right.role) {
          pdf.setFont('times', 'normal')
          pdf.setFontSize(9)
          pdf.setTextColor(40, 40, 40)
          if (block.data.left.role) {
            const r = block.data.left.role
            pdf.text(r, leftX - pdf.getTextWidth(r) / 2, currentY)
          }
          if (block.data.right.role) {
            const r = block.data.right.role
            pdf.text(r, rightX - pdf.getTextWidth(r) / 2, currentY)
          }
          currentY += 4.2
        }

        // 5. Extras (si existen)
        if (block.data.left.extra || block.data.right.extra) {
          pdf.setFont('times', 'italic')
          pdf.setFontSize(8)
          pdf.setTextColor(80, 80, 80)
          if (block.data.left.extra) {
            pdf.text(block.data.left.extra, leftX - pdf.getTextWidth(block.data.left.extra) / 2, currentY)
          }
          if (block.data.right.extra) {
            pdf.text(block.data.right.extra, rightX - pdf.getTextWidth(block.data.right.extra) / 2, currentY)
          }
          currentY += 4
        }

        currentY += 6
        break
      }

      case 'TABLE': {
        const numCols = Math.max(block.headers.length, ...block.rows.map(r => r.length), 1)
        const is2Col = numCols === 2
        const isCalcTable = is2Col && (
          block.headers.some(h => /CONCEPTO/i.test(h)) ||
          block.rows.some(r => r.some(c => /^(?:S\/?\.?|\$)\s*[\d,.]+/i.test(c)))
        )
        const isDataTable = is2Col && !isCalcTable

        const colWidths = isCalcTable
          ? [contentWidth * 0.66, contentWidth * 0.34]
          : (isDataTable ? [contentWidth * 0.45, contentWidth * 0.55] : Array(numCols).fill(contentWidth / numCols))

        const rowHeight = 6.5 // mm

        // Header row
        if (block.headers.length > 0) {
          if (currentY > pageHeight - marginBottom - 12) {
            pdf.addPage()
            currentY = letterhead?.firmName ? 27 : marginTop
          }
          pdf.setFillColor(211, 211, 211)
          pdf.setDrawColor(68, 68, 68)
          pdf.setLineWidth(0.2)

          let curX = marginLeft
          block.headers.forEach((h, colIdx) => {
            const w = colWidths[colIdx] || colWidths[0]
            pdf.rect(curX, currentY, w, rowHeight, 'FD')
            pdf.setFont('times', 'bold')
            pdf.setFontSize(9)
            pdf.setTextColor(20, 20, 20)
            const isMoney = /MONTO/i.test(h)
            if (isMoney) {
              const tw = pdf.getTextWidth(cleanHeading(h).toUpperCase())
              pdf.text(cleanHeading(h).toUpperCase(), curX + w - tw - 2, currentY + 4.5)
            } else {
              pdf.text(cleanHeading(h).toUpperCase(), curX + 2, currentY + 4.5)
            }
            curX += w
          })
          currentY += rowHeight
        }

        // Data rows
        for (const row of block.rows) {
          if (currentY > pageHeight - marginBottom - 10) {
            pdf.addPage()
            currentY = letterhead?.firmName ? 27 : marginTop
          }

          const isTotalRow = row.some(c => /TOTAL/i.test(c))
          let curX = marginLeft

          row.forEach((cell, colIdx) => {
            const w = colWidths[colIdx] || colWidths[0]
            const isLabelCol = isDataTable && colIdx === 0
            const isMoney = isCalcTable && (colIdx === 1 || /^(?:S\/?\.?|\$)\s*[\d,.]+/i.test(cell))

            if (isTotalRow || isLabelCol) {
              pdf.setFillColor(211, 211, 211)
              pdf.rect(curX, currentY, w, rowHeight, 'FD')
              pdf.setFont('times', 'bold')
            } else {
              pdf.setFillColor(255, 255, 255)
              pdf.rect(curX, currentY, w, rowHeight, 'FD')
              pdf.setFont('times', 'normal')
            }

            pdf.setFontSize(8.5)
            pdf.setTextColor(20, 20, 20)

            const cellText = isTotalRow ? cleanHeading(cell).toUpperCase() : cleanHeading(cell)
            if (isMoney) {
              const tw = pdf.getTextWidth(cellText)
              pdf.text(cellText, curX + w - tw - 2, currentY + 4.3)
            } else {
              const truncated = pdf.splitTextToSize(cellText, w - 4)[0] || ''
              pdf.text(truncated, curX + 2, currentY + 4.3)
            }

            curX += w
          })
          currentY += rowHeight
        }

        currentY += 4
        break
      }

      case 'PLAIN': {
        pdf.setFont('times', 'normal')
        pdf.setFontSize(10.5)
        pdf.setTextColor(30, 30, 30)
        const wrapped = pdf.splitTextToSize(cleanHeading(block.text), contentWidth)
        wrapped.forEach((wl: string) => {
          if (currentY > pageHeight - marginBottom - 10) {
            pdf.addPage()
            currentY = letterhead?.firmName ? 27 : marginTop
          }
          pdf.text(wl, marginLeft, currentY)
          currentY += 4.9
        })
        currentY += 1.5
        break
      }
    }
  }

  const totalPages = (pdf as any).internal.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p)
    addHeader(p)
    addFooter(p, totalPages)
  }

  pdf.save(`${cleanTitle}.pdf`)
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
      document: { title, type: docType, content: replaceLetterheadPlaceholders(docBody || blockContent) },
    }
  }

  // 2. Detección automática de encabezados legales formales
  const legalMarkers = [
    /(?:^|\n)(CONTRATO DE ARRENDAMIENTO[\s\S]{100,})/i,
    /(?:^|\n)(CONTRATO DE[\s\S]{100,})/i,
    /(?:^|\n)(CARTA NOTARIAL[\s\S]{100,})/i,
    /(?:^|\n)(SE[ÑN]OR\s+JUEZ[\s\S]{100,})/i,
    /(?:^|\n)(SE[ÑN]OR\s+FISCAL[\s\S]{100,})/i,
    /(?:^|\n)(SE[ÑN]OR\s+DIRECTOR[\s\S]{100,})/i,
    /(?:^|\n)(SE[ÑN]ORES\s+DE\s+SUNAFIL[\s\S]{100,})/i,
    /(?:^|\n)(SE[ÑN]OR\s+PRESIDENTE\s+DEL\s+TRIBUNAL[\s\S]{100,})/i,
    /(?:^|\n)(A\s+LA\s+SUPERINTENDENCIA[\s\S]{100,})/i,
    /(?:^|\n)(MINUTA DE[\s\S]{100,})/i,
    /(?:^|\n)(SOLICITO:\s*[\s\S]{100,})/i,
    /(?:^|\n)(EXPEDIENTE\s*:\s*[\s\S]{100,})/i,
    /(?:^|\n)(SUMILLA\s*:\s*[\s\S]{100,})/i,
    /(?:^|\n)(RECURSO DE APELACI[ÓO]N[\s\S]{100,})/i,
    /(?:^|\n)(RECURSO DE RECONSIDERACI[ÓO]N[\s\S]{100,})/i,
    /(?:^|\n)(DEMANDA DE[\s\S]{100,})/i,
    /(?:^|\n)(DENUNCIA PENAL[\s\S]{100,})/i,
    /(?:^|\n)(ESCRITO DE DESCARGO[\s\S]{100,})/i,
    /(?:^|\n)(ESCRITO\s+N[°º]\s*[\s\S]{100,})/i,
    /(?:^|\n)(CARTA DE RENUNCIA[\s\S]{100,})/i,
    /(?:^|\n)(PODER ESPECIAL|PODER SIMPLE[\s\S]{100,})/i,
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
        document: { title, type: 'DOCUMENTO OFICIAL', content: replaceLetterheadPlaceholders(docBody) },
      }
    }
  }

  return { conversationalText: rawContent, document: null }
}
