/**
 * HARDMAN PNP — MOTOR DE INTELIGENCIA JURÍDICA DISCIPLINARIA
 * Corpus legal: Ley N° 30714, D.S. 003-2020-IN, D.L. 1267, Precedentes TDP y TUO LPAG
 */

export interface PnpPrescriptionResult {
  category: 'LEVE' | 'GRAVE' | 'MUY_GRAVE'
  infractionCode: string
  prescriptionPeriodMonths: number
  elapsedMonths: number
  isPrescribed: boolean
  remainingDays: number
  legalBasis: string
}

export function calculatePnpPrescription(
  infractionCode: string,
  incidentDate: Date,
  initiationDate: Date = new Date()
): PnpPrescriptionResult {
  const code = infractionCode.toUpperCase().trim()
  let category: 'LEVE' | 'GRAVE' | 'MUY_GRAVE' = 'GRAVE'
  let prescriptionMonths = 24 // 2 años por defecto para graves

  if (code.startsWith('L') || code.includes('LEVE')) {
    category = 'LEVE'
    prescriptionMonths = 6 // 6 meses
  } else if (code.startsWith('MG') || code.includes('MUY GRAVE')) {
    category = 'MUY_GRAVE'
    prescriptionMonths = 36 // 3 años (o 4 años en hechos continuados)
  } else {
    category = 'GRAVE'
    prescriptionMonths = 24 // 2 años
  }

  const diffMs = initiationDate.getTime() - incidentDate.getTime()
  const elapsedDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
  const elapsedMonths = +(elapsedDays / 30.41).toFixed(1)
  const totalLimitDays = prescriptionMonths * 30.41
  const remainingDays = Math.round(totalLimitDays - elapsedDays)
  const isPrescribed = remainingDays <= 0

  return {
    category,
    infractionCode: code,
    prescriptionPeriodMonths: prescriptionMonths,
    elapsedMonths,
    isPrescribed,
    remainingDays,
    legalBasis: `Art. 68 de la Ley N° 30714 y Art. 47 del D.S. N° 003-2020-IN`,
  }
}

export const PNP_COMMON_INFRACTIONS = [
  {
    code: 'G-24',
    type: 'Grave',
    label: 'Faltar al servicio policial o ausentarse del puesto sin causa justificada',
    sanction: 'Pase a la situación de disponibilidad de 1 a 6 meses',
    defenseStrategy: 'Demostrar causa de fuerza mayor, descanso médico no ingresado a tiempo o defecto en el relevo de guardia.',
  },
  {
    code: 'G-26',
    type: 'Grave',
    label: 'Incumplir directivas, órdenes o planes de operaciones policiales',
    sanction: 'Pase a disponibilidad de 1 a 6 meses',
    defenseStrategy: 'Cuestionar claridad de la orden, falta de medios logísticos proporcionados o contradicción con el manual de patrullaje.',
  },
  {
    code: 'MG-12',
    type: 'Muy Grave',
    label: 'Conducir vehículo policial en estado de ebriedad o drogadicción',
    sanction: 'Pase a la situación de retiro',
    defenseStrategy: 'Control de legalidad del dosaje etílico, cadena de custodia de la muestra de sangre y respeto al Art. 21 de la Ley 30714.',
  },
  {
    code: 'MG-45',
    type: 'Muy Grave',
    label: 'Realizar actos que atenten gravemente contra la ética, disciplina o imagen institucional',
    sanction: 'Pase a la situación de retiro',
    defenseStrategy: 'Vulneración al principio de tipicidad y legalidad (cláusula abierta e indeterminada, precedente vinculante TDP).',
  },
  {
    code: 'MG-87',
    type: 'Muy Grave',
    label: 'Solicitar, aceptar o recibir dádivas, dinero o ventajas económicas indebidas (Cohecho/Coima)',
    sanction: 'Pase a la situación de retiro e inicio de acción penal FECOF',
    defenseStrategy: 'Ausencia de flagrancia, prueba ilícita o provocada, no individualización del agente, contradicciones en acta de intervención.',
  },
  {
    code: 'L-14',
    type: 'Leve',
    label: 'Descuidar el aseo o presentación del uniforme reglamentario',
    sanction: 'Amonestación o de 1 a 10 días de sanción simple',
    defenseStrategy: 'Subsanación inmediata y aplicación del principio de razonabilidad y proporcionalidad.',
  },
]

export function generatePnpStandardResponse(
  mode: 'INSPECTORIA' | 'DEFENSA',
  userPrompt: string
): { response: string; docTitle?: string; docContent?: string } {
  const prompt = userPrompt.toLowerCase()

  // 1. Caso: Prescripción
  if (prompt.includes('prescrip') || prompt.includes('cuanto tiempo') || prompt.includes('plazo')) {
    return {
      response: `### ⏱️ Dictamen Técnico de Prescripción (Ley N° 30714)

Conforme al **Artículo 68 de la Ley N° 30714** y el **Artículo 47 del D.S. N° 003-2020-IN (Reglamento)**, los plazos de prescripción de la potestad disciplinaria policial son perentorios e improrrogables:

1. **Infracciones Leves (L)**: Prescriben a los **tres (03) meses** de cometida la infracción, o a los tres (03) meses de que el superior tomó conocimiento formal.
2. **Infracciones Graves (G)**: Prescriben a los **dos (02) años** de cometida la infracción.
3. **Infracciones Muy Graves (MG)**: Prescriben a los **tres (03) años** de la fecha del hecho. *(En hechos continuados, a los 4 años)*.
4. **Prescripción del Procedimiento (Caducidad)**: Si el Procedimiento Administrativo Disciplinario (PAD) no se resuelve en el plazo de **nueve (09) meses** calendario desde la notificación del Auto de Inicio, opera la caducidad y archivo definitivo.

> **💡 Recomendación Estratégica**: ${
        mode === 'INSPECTORIA'
          ? 'Como Instructor, verifique la fecha exacta del parte o acta de intervención. Si el plazo está a 30 días de vencer, declare caso complejo o emita resolución de inicio con habilitación urgente de días no laborables.'
          : 'Como defensa, si han transcurrido más de los plazos señalados sin notificación válida de inicio, presente de inmediato la **Excepción de Prescripción de la Acción Disciplinaria**, solicitando el archivo de plano sin ingresar al fondo.'
      }`,
    }
  }

  // 2. Modo Inspectoría: Generación de Auto de Inicio o Informe
  if (mode === 'INSPECTORIA') {
    const docTitle = 'AUTO DE INICIO DE PROCEDIMIENTO ADMINISTRATIVO DISCIPLINARIO'
    const docContent = `POLICÍA NACIONAL DEL PERÚ
INSPECTORÍA GENERAL • DIRECCIÓN DE INVESTIGACIONES
OFICINA DE DISCIPLINA N° 01 - SEDE LIMA

AUTO DE INICIO DE PROCEDIMIENTO ADMINISTRATIVO DISCIPLINARIO
RESOLUCIÓN N° 148-2026-IGPNP/DIRINV-OD.LIMA

EXPEDIENTE: EXP. N° 024-2026-IGPNP/DIRINV-OD
INVESTIGADO: S2 PNP Juan Carlos PÉREZ ROJAS (CIP: 31849201)
INFRACCIÓN IMPUTADA: GRAVE (Código G-24)
ÓRGANO INSTRUCTOR: Teniente PNP Marco Antonio VILCA PAREDES

I. VISTOS:
El Informe Policial N° 045-2026-REGPOL-LIMA/DIVPOL-SUR/COM-SURQUILLO, de fecha 15 de marzo de 2026, mediante el cual se da cuenta del presunto abandono de puesto y servicio de guardia del efectivo investigado.

II. ANTECEDENTES Y HECHOS IMPUTADOS:
2.1. Con fecha 12 de marzo de 2026, siendo aproximadamente las 22:30 horas, durante el rol de servicio nocturno en la Comisaría de Surquillo, se verificó mediante control de lista la ausencia injustificada del S2 PNP Juan Carlos PÉREZ ROJAS de su puesto asignado en el Área de Investigaciones Comunes.
2.2. Dicha conducta no contó con papeleta de salida, descanso médico visado ni autorización escrita del Oficial de Guardia, afectando la continuidad del servicio esencial de seguridad ciudadana.

III. CALIFICACIÓN JURÍDICA Y SUBSUNCIÓN (LEY N° 30714):
Los hechos precedentemente descritos se subsumen presuntamente en la Tabla de Infracciones y Sanciones de la Ley N° 30714 - Ley del Régimen Disciplinario de la PNP:
• INFRACCIÓN GRAVE (Código G-24): «Faltar al servicio policial o ausentarse del puesto asignado sin causa justificada».
• Sanción conminada: Pase a la situación de disponibilidad de uno (01) a seis (06) meses.

IV. DISPOSICIÓN:
PRIMERO.- INICIAR Procedimiento Administrativo Disciplinario contra el S2 PNP Juan Carlos PÉREZ ROJAS por la presunta comisión de la infracción Grave G-24 de la Ley 30714.
SEGUNDO.- CONCEDER al efectivo investigado el plazo improrrogable de DIEZ (10) DÍAS HÁBILES, computados a partir del día siguiente de su notificación formal, para que presente su respectivo INFORME DE DESCARGO por escrito, ofreciendo los medios probatorios que considere pertinentes para su defensa.
TERCERO.- NOTIFICAR la presente resolución con las formalidades del TUO de la Ley N° 27444.

Regístrese, comuníquese y cúmplase.`

    return {
      response: `### 🏛️ Documento Oficial Proyectado para Inspectoría

He redactado el **Auto de Inicio de Procedimiento Administrativo Disciplinario** cumpliendo con los estándares de la Ley N° 30714, debida motivación de hechos y tipicidad estricta.

Puedes revisarlo a continuación y descargarlo inmediatamente en **Word (.docx)** con membrete oficial y márgenes reglamentarios listo para firma del Oficial Instructor:`,
      docTitle,
      docContent,
    }
  }

  // 3. Modo Defensa: Generación de Descargo
  const docTitle = 'ESCRITO DE DESCARGO Y SOLICITUD DE ABSOLUCIÓN'
  const docContent = `SEÑOR CORONEL PNP JEFE DE LA OFICINA DE DISCIPLINA DE INSPECTORÍA GENERAL PNP:

EXPEDIENTE: EXP. N° 024-2026-IGPNP/DIRINV-OD
SUMILLA: PRESENTA ESCRITO DE DESCARGO CONTRA AUTO DE INICIO POR PRESUNTA INFRACCIÓN G-24 Y SOLICITA ARCHIVO DEFINITIVO POR ATIPICIDAD Y FUERZA MAYOR.

S2 PNP Juan Carlos PÉREZ ROJAS, identificado con DNI N° 45892104, con CIP N° 31849201, prestando servicios en la Región Policial Lima, señalando domicilio procesal en Jr. Huancavelica N° 450, Of. 302, Cercado de Lima, ante usted con el debido respeto me presento y expongo:

I. PETITORIO:
Que, al amparo del Artículo 139° incisos 3 y 14 de la Constitución Política del Perú, en concordancia con el Artículo 64° de la Ley N° 30714 y el TUO de la Ley N° 27444, dentro del plazo legal interpongo formal INFORME DE DESCARGO contra el Auto de Inicio de Procedimiento Administrativo Disciplinario, solicitando se sirva declarar NO HA LUGAR A IMPOSICIÓN DE SANCIÓN y se ordene el ARCHIVO DEFINITIVO del presente actuado disciplinario, en mérito a los siguientes fundamentos fácticos y jurídicos:

II. FUNDAMENTOS DE HECHO:
2.1. Niego categóricamente haber incurrido en falta voluntaria de abandono de puesto. Con fecha 12 de marzo de 2026, durante el ejercicio de mi servicio, presenté un cuadro agudo de cólico renal y descompensación física severa.
2.2. Ante dicha emergencia médica sobreviniente, procedí a poner en conocimiento verbal inmediato al Suboficial Brigadier de Permanencia, trasladándome de urgencia al Hospital Central de la PNP «Luis N. Sáenz» para recibir atención médica impostergable.
2.3. No existió dolo ni desdén por la función policial, sino una causa de FUERZA MAYOR debidamente justificada en el resguardo de la salud y la vida.

III. FUNDAMENTOS DE DERECHO (LEY N° 30714 Y PRECEDENTES TDP):
3.1. AUSENCIA DE ANTIJURIDICIDAD Y TIPICIDAD: El Artículo 21° de la Ley N° 30714 consagra las causas eximentes de responsabilidad disciplinaria, precisando expresamente en el inciso 1 que obra exento de sanción quien actúa bajo caso fortuito o fuerza mayor debidamente comprobada.
3.2. PRINCIPIO DE CULPABILIDAD Y RAZONABILIDAD: El Tribunal de Disciplina Policial en reiterada y uniforme jurisprudencia vinculante (Res. N° 312-2024-IN/TDP) ha establecido que no se configura la infracción G-24 cuando el efectivo demuestra que la ausencia obedeció a una emergencia médica atendida por nosocomio policial.

IV. MEDIOS PROBATORIOS:
1. Copia legalizada de la Ficha de Atención de Emergencia N° 89412 del Hospital Central PNP.
2. Descanso Médico N° 00234 expedido por el médico de turno del Servicio de Urgencias PNP.
3. Declaración testimonial del S1 PNP Mario Céspedes, quien constató el estado de postración física previo a la salida.

POR TANTO:
A usted Señor Coronel PNP, solicito tener por presentado el presente descargo, admitir los medios probatorios y en su oportunidad archivar el expediente.

Lima, 23 de octubre de 2026.`

  return {
    response: `### 🛡️ Escrito de Descargo Blindado (Ley N° 30714)

He preparado tu **Escrito de Descargo Técnico** atacando la imputación mediante la causal de **Fuerza Mayor y Ausencia de Tipicidad (Art. 21 Ley 30714)**, citando la jurisprudencia del Tribunal de Disciplina Policial (TDP).

Puedes revisarlo y descargarlo inmediatamente en **Word (.docx)** para imprimir, adjuntar tus pruebas médicas y presentarlo en Mesa de Partes de Inspectoría:`,
    docTitle,
    docContent,
  }
}
