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
} from 'docx'
import { stripAllMarkdown } from './exportDoc'

export interface PnpDocumentOptions {
  title: string
  referenceNumber?: string
  content: string
  mode: 'INSPECTORIA' | 'DEFENSA'
  officerName?: string
  officerCip?: string
  dateStr?: string
}

export async function downloadPnpWordDoc(options: PnpDocumentOptions): Promise<void> {
  const {
    title,
    referenceNumber = 'EXP. N° 000-2026-IGPNP/DIRINV-OD',
    content,
    mode,
    officerName = 'EFECTIVO PNP',
    officerCip = 'CIP N° 00000000',
    dateStr = new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }),
  } = options

  const cleanText = stripAllMarkdown(content)
  const paragraphs = cleanText.split('\n').filter((p) => p.trim().length > 0)

  const docParagraphs: Paragraph[] = []

  // Encabezado institucional superior
  if (mode === 'INSPECTORIA') {
    docParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: 'POLICÍA NACIONAL DEL PERÚ',
            font: 'Times New Roman',
            bold: true,
            size: 24, // 12pt
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: 'INSPECTORÍA GENERAL • DIRECCIÓN DE INVESTIGACIONES',
            font: 'Times New Roman',
            bold: true,
            size: 22, // 11pt
            color: '333333',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: 'OFICINA DE DISCIPLINA - RÉGIMEN DISCIPLINARIO LEY N° 30714',
            font: 'Times New Roman',
            italics: true,
            size: 18, // 9pt
            color: '666666',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        children: [
          new TextRun({
            text: '«AÑO DE LA SOBERANÍA Y JUSTICIA DISCIPLINARIA POLICIAL»',
            font: 'Times New Roman',
            size: 18,
            italics: true,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 240 },
        children: [
          new TextRun({
            text: referenceNumber,
            font: 'Times New Roman',
            bold: true,
            size: 22,
          }),
        ],
      })
    )
  } else {
    // Modo Defensa
    docParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: `EXPEDIENTE: ${referenceNumber}\n`,
            font: 'Times New Roman',
            bold: true,
            size: 22,
          }),
          new TextRun({
            text: `SUMILLA: ${title.toUpperCase()}\n`,
            font: 'Times New Roman',
            bold: true,
            size: 22,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 240 },
        children: [
          new TextRun({
            text: 'SEÑOR CORONEL PNP JEFE DE LA OFICINA DE DISCIPLINA / INSPECTORÍA GENERAL PNP:',
            font: 'Times New Roman',
            bold: true,
            size: 22,
          }),
        ],
      })
    )
  }

  // Título Principal
  docParagraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 240 },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          font: 'Times New Roman',
          bold: true,
          underline: {},
          size: 26, // 13pt
        }),
      ],
    })
  )

  // Cuerpo del texto
  paragraphs.forEach((pText) => {
    const isHeading =
      /^(I|II|III|IV|V|VI|VII|VIII|IX|X)\.\s+/i.test(pText.trim()) ||
      /^(VISTOS|OBJETO|ANTECEDENTES|ANÁLISIS|CONCLUSIONES|RECOMENDACIONES|FUNDAMENTOS|PETITORIO):/i.test(
        pText.trim()
      )

    docParagraphs.push(
      new Paragraph({
        alignment: isHeading ? AlignmentType.LEFT : AlignmentType.JUSTIFIED,
        spacing: { before: isHeading ? 200 : 80, after: isHeading ? 100 : 80, line: 276 }, // 1.15 line spacing
        indent: isHeading ? undefined : { firstLine: convertMillimetersToTwip(10) },
        children: [
          new TextRun({
            text: pText.trim(),
            font: 'Times New Roman',
            bold: isHeading,
            size: 24, // 12pt
          }),
        ],
      })
    )
  })

  // Bloque de Firma
  docParagraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600, after: 100 },
      children: [
        new TextRun({
          text: `Lima, ${dateStr}`,
          font: 'Times New Roman',
          size: 22,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 500, after: 60 },
      children: [
        new TextRun({
          text: '___________________________________________',
          font: 'Times New Roman',
          size: 22,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: mode === 'INSPECTORIA' ? 'EL INSTRUCTOR / OFICIAL DE DISCIPLINA' : officerName.toUpperCase(),
          font: 'Times New Roman',
          bold: true,
          size: 22,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: mode === 'INSPECTORIA' ? 'OFICINA DE DISCIPLINA PNP' : officerCip,
          font: 'Times New Roman',
          size: 20,
        }),
      ],
    })
  )

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertMillimetersToTwip(30),
              right: convertMillimetersToTwip(25),
              bottom: convertMillimetersToTwip(25),
              left: convertMillimetersToTwip(30),
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'HARDMAN PNP • SISTEMA DE EXPEDIENTES DISCIPLINARIOS',
                    font: 'Times New Roman',
                    size: 16,
                    color: '888888',
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Página ',
                    font: 'Times New Roman',
                    size: 18,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: 'Times New Roman',
                    size: 18,
                  }),
                ],
              }),
            ],
          }),
        },
        children: docParagraphs,
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const safeFilename = `${title.toLowerCase().replace(/[^a-z0-9]/gi, '_')}_pnp.docx`
  a.download = safeFilename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
