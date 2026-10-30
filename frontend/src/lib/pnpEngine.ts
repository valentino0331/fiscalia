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

  // 1. Acta de Intervención Policial en Flagrancia (Art. 259 NCPP)
  if (prompt.includes('intervenci') || prompt.includes('flagrancia') || prompt.includes('259')) {
    const docTitle = 'ACTA DE INTERVENCIÓN POLICIAL EN FLAGRANCIA (ART. 259 NCPP)'
    const docContent = `POLICÍA NACIONAL DEL PERÚ
REGIÓN POLICIAL LIMA • DIVPOL SUR 1
COMISARÍA PNP DE SURQUILLO • SECCIÓN DE INVESTIGACIÓN DE DELITOS

ACTA DE INTERVENCIÓN POLICIAL EN FLAGRANCIA DELICTIVA
(CONFORME AL ARTÍCULO 259° DEL CÓDIGO PROCESAL PENAL)

En la ciudad de Lima, distrito de Surquillo, siendo las [HORA: MINUTOS] horas del día [FECHA], los suscritos [GRADO Y NOMBRE DEL EFECTIVO INTERVINIENTE], con CIP N° [XXXXXX], a bordo de la unidad móvil [MÓVIL / PLACA], encontrándonos de servicio de patrullaje motorizado en el cuadrante asignado, dejamos constancia de lo siguiente:

I. LUGAR DE LA INTERVENCIÓN:
Inmediaciones de la intersección entre la Av. Angamos Este y Jr. San Agustín, distrito de Surquillo, provincia y departamento de Lima (coordenadas georreferenciadas aprox. Lat: -12.1124, Long: -77.0215).

II. CIRCUNSTANCIAS DE LA INTERVENCIÓN Y MOTIVO:
2.1. Circunstancias en que el personal policial se encontraba en desplazamiento táctico, se visualizó a una persona de sexo masculino en actitud sospechosa, quien al advertir la presencia de la unidad policial procedió a acelerar el paso e intentar ingresar raudamente a un callejón adyacente.
2.2. Configuración de flagrancia: Conforme al Art. 259°, inc. 3 del NCPP, el sujeto fue intervenido de manera inmediata en flagrancia delictiva tras haber sido sindicado por la agraviada [NOMBRE AGRAVIADA], quien solicitó auxilio vociferando haber sido despojada violentamente de su teléfono celular marca [MARCA/MODELO].

III. IDENTIFICACIÓN DEL INTERVENIDO:
• Nombres y Apellidos: [NOMBRES COMPLETOS DEL INTERVENIDO]
• DNI / Carné de Extranjería: [NÚMERO DE DOCUMENTO]
• Edad: [EDAD] años   ·   Estado Civil: [ESTADO CIVIL]
• Domicilio: [DIRECCIÓN COMPLETA]

IV. REGISTRO PRELIMINAR Y ESPECIES ENCONTRADAS:
Al realizarse la reducción y control físico de seguridad, se le halló a la altura de la cintura del lado derecho:
1. Un (01) equipo telefónico celular color negro, con pantalla trizada, reconocido de plano por la víctima.
2. Un (01) objeto punzocortante con mango de madera de aprox. 20 cm de longitud.

V. LECTURA DE DERECHOS:
En el acto se dio lectura expresa de sus derechos consagrados en el Artículo 71° del Código Procesal Penal, entregándole copia de la papeleta de lectura de derechos.

Siendo las [HORA DE TÉRMINO] horas, se da por concluida la presente diligencia, procediendo a firmar los intervinientes en señal de conformidad.

_____________________________                _____________________________
   EFECTIVO INTERVINIENTE                         PERSONA INTERVENIDA
       CIP N° [XXXXXX]                              DNI N° [XXXXXXXX]`

    return {
      response: `### 📋 Acta de Intervención en Flagrancia Proyectada (Art. 259 NCPP)

Colega, he proyectado el **Acta de Intervención Policial en Flagrancia** con estricta descripción de tiempo, lugar, modo y sindicación directa para que el Fiscal de Turno no tenga ningún motivo para ordenar la libertad indebida del intervenido ni el abogado plantee control de detención.

Descárgala en **Word (.docx)** con membrete reglamentario lista para imprimir y firmar:`,
      docTitle,
      docContent,
    }
  }

  // 2. Registro Personal e Incautación (Art. 210 NCPP)
  if (prompt.includes('registro personal') || prompt.includes('incautaci') || prompt.includes('lacrado') || prompt.includes('210')) {
    const docTitle = 'ACTA DE REGISTRO PERSONAL, INCAUTACIÓN Y COMISO (ART. 210 NCPP)'
    const docContent = `POLICÍA NACIONAL DEL PERÚ
REGIÓN POLICIAL LIMA • DIVISIÓN DE INVESTIGACIÓN CRIMINAL
DEPINCRI • ÁREA DE DELITOS CONTRA EL PATRIMONIO

ACTA DE REGISTRO PERSONAL, INCAUTACIÓN, COMISO Y LACRADO
(ARTÍCULOS 210°, 218° Y 220° DEL CÓDIGO PROCESAL PENAL)

En la sede de la dependencia policial, siendo las [HORA] horas del día [FECHA], ante la presencia del instructor policial que suscribe, se procede a practicar la diligencia de REGISTRO PERSONAL al ciudadano:

INTERVENIDO: [NOMBRES Y APELLIDOS COMPLETOS]
DNI N°: [NÚMERO DE DNI]   ·   ALIAS: "[ALIAS]"

I. OBJETO DE LA DILIGENCIA:
Verificar la existencia en su indumentaria o pertenencias de bienes, efectos del delito, armas o sustancias prohibidas vinculadas a la investigación preliminar.

II. RESULTADO DEL REGISTRO PERSONAL:
1. En el bolsillo delantero derecho de su pantalón: Se halló una bolsa de polietileno transparente conteniendo [CANTIDAD] envoltorios tipo "kete" con sustancia parduzca pulverulenta al parecer PBC.
2. En el bolsillo posterior: La suma de S/ [MONTO] en billetes de diversa denominación.
3. A la altura del cinto abdominal: Se halló un arma de fuego tipo revólver, con número de serie limado/erradicado, abastecido con seis (06) cartuchos sin percutar.

III. MEDIDA DE ASEGURAMIENTO Y CADENA DE CUSTODIA:
Las especies descritas son INCAUTADAS Y COMISADAS formalmente, procediéndose en este acto a su rotulado y lacrado en sobre de manila con cinta adhesiva de seguridad y firma de los presentes, garantizando la debida Cadena de Custodia (Art. 220° NCPP).

Con lo que concluyó la presente diligencia a las [HORA DE CIERRE] horas del mismo día.

_____________________________                _____________________________
     INSTRUCTOR POLICIAL                          PERSONA REGISTRADA
       CIP N° [XXXXXX]                              DNI N° [XXXXXXXX]`

    return {
      response: `### 📦 Acta de Registro Personal e Incautación Proyectada (Art. 210 NCPP)

Colega, tienes lista el **Acta de Registro Personal, Incautación y Lacrado** con estricta sujeción al protocolo de cadena de custodia para evitar tachas en el juzgado de investigación preparatoria.

Descárgala en **Word (.docx)** lista para incorporar al expediente policial:`,
      docTitle,
      docContent,
    }
  }

  // 3. Lectura de Derechos (Art. 71 NCPP)
  if (prompt.includes('derechos') || prompt.includes('71')) {
    const docTitle = 'ACTA DE LECTURA DE DERECHOS DEL IMPUTADO (ART. 71 NCPP)'
    const docContent = `POLICÍA NACIONAL DEL PERÚ
COMISARÍA PNP [NOMBRE DE LA COMISARÍA]

ACTA DE INFORMACIÓN Y LECTURA DE DERECHOS DEL IMPUTADO
(CONFORME AL ARTÍCULO 71° DEL CÓDIGO PROCESAL PENAL)

A la persona de [NOMBRES Y APELLIDOS COMPLETOS DEL DETENIDO], intervenido(a) el [FECHA] a horas [HORA], en [LUGAR], se le notifica que se encuentra en calidad de DETENIDO(A) por la presunta comisión del delito contra [DELITO IMPUTADO], en agravio de [AGRAVIADO / EL ESTADO], y se le hace saber que la Constitución y la Ley le conceden los siguientes derechos:

1. Conocer los cargos y motivos de su detención de manera clara y comprensible.
2. Designar a la persona o institución a la que debe comunicarse su detención de forma inmediata.
3. Ser asistido desde los actos iniciales de investigación por un Abogado Defensor de su libre elección o por un Defensor Público del MINJUS.
4. Abstenerse de declarar; y si acepta hacerlo, a que su Abogado Defensor esté presente.
5. Que no se emplee en su contra medios coactivos, intimidatorios o contrarios a su dignidad ni a ser sometido a torturas o tratos crueles.
6. Ser examinado por el Médico Legista o quien haga sus veces si presentara lesiones.

CONSTANCIA DE LECTURA Y CONFORMIDAD:
El intervenido declara haber sido informado y haber comprendido la totalidad de sus derechos.
• Abogado que designa: [DEFENSOR PARTICULAR / DEFENSORÍA PÚBLICA]
• Familiar comunicado: [NOMBRE Y TELÉFONO DE FAMILIAR]

_____________________________                _____________________________
     INSTRUCTOR POLICIAL                          PERSONA DETENIDA
       CIP N° [XXXXXX]                              DNI N° [XXXXXXXX]`

    return {
      response: `### ⚖️ Acta de Lectura de Derechos Blindada (Art. 71 NCPP)

Aquí tienes el **Acta de Notificación y Lectura de Derechos del Imputado**, esencial para blindar el procedimiento de detención y anular cualquier intento de tutela de derechos del abogado del intervenido.`,
      docTitle,
      docContent,
    }
  }

  // 4. Oficio Poniendo Detenido y Actuados a Disposición de Fiscalía
  if (prompt.includes('oficio') || prompt.includes('disposicion') || prompt.includes('disposición')) {
    const docTitle = 'OFICIO POLICIAL DE PUESTA A DISPOSICIÓN DE DETENIDO A FISCALÍA'
    const docContent = `POLICÍA NACIONAL DEL PERÚ
REGIÓN POLICIAL LIMA • DIVPOL SUR 1
COMISARÍA PNP DE SURQUILLO • SECCIÓN DE INVESTIGACIÓN DE DELITOS

OFICIO N° [NÚMERO]-2026-REGPOL-LIMA/DIVPOL-S1/COM-SURQ-SID
Surquillo, [FECHA].

SEÑOR DOCTOR:
FISCAL PROVINCIAL DE TURNO DE LA FISCALÍA PROVINCIAL PENAL CORPORATIVA DE SURQUILLO.

ASUNTO: PONE A DISPOSICIÓN PERSONA DETENIDA EN FLAGRANCIA DELICTIVA, ESPECIES INCAUTADAS Y ACTUADOS POLICIALES.
REF.   : ACTA DE INTERVENCIÓN POLICIAL DE FECHA [FECHA] Y CASO SGF N° [XXXX].

Tengo el honor de dirigirme a usted con la finalidad de PONER A SU DISPOSICIÓN en calidad de DETENIDO en FLAGRANCIA DELICTIVA (Art. 259° NCPP) a la persona de:

• Nombres y Apellidos: [NOMBRES COMPLETOS DEL DETENIDO]
• DNI / CE N°       : [NÚMERO DE DOCUMENTO]
• Situación          : DETENIDO EN FLAGRANCIA (Custodia Policial)
• Presunto Delito    : CONTRA EL PATRIMONIO — ROBO AGRAVADO (Art. 189° C.P.)
• Agraviado(a)       : [NOMBRES DE LA VÍCTIMA]

ADJUNTOS EN CALIDAD DE RECAUDOS FORMALES:
1. Acta de Intervención Policial en Flagrancia (02 fs.)
2. Acta de Registro Personal, Incautación y Lacrado (02 fs.)
3. Acta de Lectura de Derechos del Imputado Art. 71 NCPP (01 f.)
4. Cadena de Custodia y Especies Incautadas en sobre de manila lacrado (01)
5. Certificado Médico Legal N° [XXXX] del intervenido y de la agraviada.

Lo que pongo a su conocimiento y disposición para los fines de formalización de la investigación preparatoria conforme a sus atribuciones de ley.

Dios guarde a usted.

_____________________________
    COMISARIO PNP SURQUILLO
       CIP N° [XXXXXX]`

    return {
      response: `### 📨 Oficio de Puesta a Disposición a Fiscalía Proyectado

Colega: he redactado el **Oficio Policial Formal** remitiendo al detenido en flagrancia, las actas y las especies en cadena de custodia a la Fiscalía de Turno dentro del plazo legal estricto.

Puedes descargarlo de inmediato en **Word (.docx)** con membrete reglamentario listo para firma del Oficial de Permanencia o Comisario:`,
      docTitle,
      docContent,
    }
  }

  // 5. Informe Policial de Diligencias Preliminares (Ley N° 32130)
  if (prompt.includes('informe policial') || prompt.includes('32130') || prompt.includes('diligencias preliminares')) {
    const docTitle = 'INFORME POLICIAL DE INVESTIGACIÓN PRELIMINAR (LEY N° 32130)'
    const docContent = `POLICÍA NACIONAL DEL PERÚ
DIVISIÓN DE INVESTIGACIÓN CRIMINAL • DEPINCRI
ÁREA DE INVESTIGACIÓN DE DELITOS CONTRA EL PATRIMONIO

INFORME POLICIAL N° 088-2026-DIRINCRI/DEPINCRI-SUR/SECINV
(ELABORADO CONFORME AL ARTÍCULO 332° NCPP MODIFICADO POR LA LEY N° 32130)

ASUNTO: Diligencias preliminares practicadas con relación al presunto delito contra el Patrimonio en agravio de [NOMBRE DE LA VÍCTIMA].
REF.   : Carpeta Fiscal N° 506014500-2026-214-0 (Fiscalía Provincial Penal).

I. ANTECEDENTES:
Con fecha [FECHA], se recepcionó la denuncia verbal y acta de intervención policial que dio mérito al inicio de las diligencias preliminares materiales a cargo de esta unidad policial bajo la conducción jurídica fiscal.

II. DILIGENCIAS PRACTICADAS POR LA POLICÍA:
2.1. Inspección Técnico Policial (ITP) y fijación fotográfica de la escena del hecho.
2.2. Toma de declaración de la parte agraviada con asistencia legal.
2.3. Visualización y extracción forense de cámaras de seguridad adyacentes al lugar de los hechos.
2.4. Peritaje balístico / químico / dactiloscópico de las especies incautadas.
2.5. Tomas de manifestación preliminar de testigos presenciales.

III. ANÁLISIS DE LOS HECHOS Y VALORACIÓN TÉCNICO-POLICIAL:
Del análisis conjunto de los elementos de convicción recabados, se determina la existencia de fundadas sospechas graves sobre la autoría material del imputado [NOMBRES], individualizado por reconocimiento fotográfico y registro personal positivo.

IV. CONCLUSIÓN TÉCNICO-POLICIAL:
Se concluye que los hechos investigados revisten los caracteres del delito contra el Patrimonio en la modalidad de Robo Agravado, recomendando la formalización de la investigación penal.

Surquillo, [FECHA].

_____________________________
    EL INSTRUCTOR POLICIAL
       CIP N° [XXXXXX]`

    return {
      response: `### 📑 Informe Policial de Diligencias Preliminares (Ley N° 32130)

Colega: he estructurado el **Informe Policial** bajo el amparo de la **Ley N° 32130** (que restituye la investigación material del delito a la PNP bajo conducción jurídica fiscal), con análisis táctico-criminalístico y conclusiones fundadas.

Descárgalo en **Word (.docx)** listo para visar e incorporar a la Carpeta Fiscal:`,
      docTitle,
      docContent,
    }
  }

  // 6. Recurso de Apelación ante el Tribunal de Disciplina Policial (TDP)
  if (prompt.includes('apelaci') || prompt.includes('recurso de apelacion') || prompt.includes('tdp') || prompt.includes('tribunal')) {
    const docTitle = 'RECURSO DE APELACIÓN ANTE EL TRIBUNAL DE DISCIPLINA POLICIAL (TDP)'
    const docContent = `SEÑOR CORONEL PNP JEFE DE LA OFICINA DE DISCIPLINA / ÓRGANO SANCIONADOR DE LA PNP:
PARA SER ELEVADO AL TRIBUNAL DE DISCIPLINA POLICIAL (TDP) DEL MINISTERIO DEL INTERIOR.

EXPEDIENTE: EXP. N° 034-2026-IGPNP/DIRINV-OD
SUMILLA   : INTERPONE RECURSO DE APELACIÓN CONTRA RESOLUCIÓN DE SANCIÓN N° [NUMERO] Y SOLICITA SU REVOCACIÓN TOTAL O NULIDAD.

[GRADO Y NOMBRES COMPLETOS DEL EFECTIVO], con CIP N° [XXXXXX], prestando servicios en [UNIDAD], con domicilio procesal en [DIRECCIÓN], ante usted respetuosamente digo:

I. PETITORIO:
Que, al amparo del Artículo 67° de la Ley N° 30714 y el TUO de la Ley N° 27444, dentro del plazo perentorio de QUINCE (15) DÍAS HÁBILES de notificado con la Resolución de Sanción N° [NÚMERO], interpongo formal RECURSO DE APELACIÓN solicitando al Colegiado del Tribunal de Disciplina Policial (TDP) se sirva REVOCAR TOTALMENTE la sanción impuesta de [SANCIÓN: DISPONIBILIDAD / RETIRO] y declarar mi ABSOLUCIÓN DEFINITIVA, o subsidiarimente declarar la NULIDAD de todo lo actuado por graves agravios al debido procedimiento:

II. FUNDAMENTOS DE LOS AGRAVIOS:
2.1. VULNERACIÓN DEL PRINCIPIO DE DEBIDA MOTIVACIÓN Y CONGRUENCIA (ART. 139° INC. 5 CONST.): La resolución sancionatoria de primera instancia incurre en motivación aparente y defectuosa, limitándose a transcribir los hechos del informe de instrucción sin valorar los medios probatorios de descargo ofrecidos oportunamente.
2.2. VULNERACIÓN DEL PRINCIPIO DE TIPICIDAD ESTRICTA: La conducta imputada no encuadra en los elementos constitutivos de la falta [CÓDIGO], pretendiendo la administración forzar una subsunción arbitraria sin prueba directa de culpabilidad.
2.3. INDEBIDA INAPLICACIÓN DE CAUSAL EXIMENTE (ART. 21 LEY 30714): Se acreditó fehacientemente que la ausencia del servicio obedeció a una emergencia médica atendida por nosocomio policial, supuesto que conforme al precedente vinculante del TDP Res. N° 312-2024-IN/TDP exime de toda responsabilidad disciplinaria.

POR TANTO:
Solicito conceder la apelación con efecto suspensivo y elevar los actuados de inmediato a la Sala correspondiente del TDP.

Lima, [FECHA].

_____________________________
    [FIRMA Y CIP DEL EFECTIVO]`

    return {
      response: `### 🏛️ Recurso de Apelación ante el Tribunal de Disciplina Policial (TDP)

Colega: he blindado tu **Recurso de Apelación ante el TDP** atacando la resolución de primera instancia por vicios de **debida motivación, atipicidad y omisión de causales eximentes (Art. 21)**.

Descárgalo en **Word (.docx)** para presentarlo dentro del plazo fatal de 15 días hábiles:`,
      docTitle,
      docContent,
    }
  }

  // 7. Uso Legítimo de la Fuerza (D.L. 1186 y Ley 31012)
  if (prompt.includes('fuerza') || prompt.includes('1186') || prompt.includes('31012') || prompt.includes('arma')) {
    const docTitle = 'INFORME DE USO LEGÍTIMO Y REGLAMENTARIO DE LA FUERZA POLICIAL'
    const docContent = `SEÑOR CORONEL PNP JEFE DE LA DIVPOL [JURISDICCIÓN]:
OFICINA DE DISCIPLINA / INSPECTORÍA GENERAL PNP:

SUMILLA: ELEVA INFORME DETALLADO DE USO REGLAMENTARIO DE LA FUERZA LETAL EN CUMPLIMIENTO DEL DEBER CONFORME AL D.L. N° 1186 Y LEY N° 31012.

[GRADO Y NOMBRE DEL EFECTIVO], con CIP N° [XXXXXX], prestando servicios en [UNIDAD], ante usted con el debido respeto me presento y expongo:

I. OBJETO:
Dar cuenta circunstanciada y técnica del empleo progresivo y diferenciado de la fuerza y uso reglamentario del arma de fuego asignada por el Estado, durante la intervención policial realizada el [FECHA] a horas [HORA] en [LUGAR].

II. JUSTIFICACIÓN OPERATIVA SEGÚN EL D.L. N° 1186 (PRINCIPIOS BÁSICOS):
1. LEGALIDAD: La actuación policial se ejecutó en estricto cumplimiento del deber constitucional de protección de la vida humana y preservación del orden interno.
2. NECESIDAD: Se agotaron los niveles previos de control verbal y reducción táctica física. El atacante esgrimió [DESCRIPCIÓN DE AMENAZA: ARMA DE FUEGO / CUCHILLO], existiendo riesgo inminente de muerte para terceros y el personal policial.
3. PROPORCIONALIDAD: Ante una agresión letal, el uso del arma de fuego constituyó el único medio idóneo para neutralizar la agresión ilícita en curso.

III. AMPARO LEGAL BAJO LA LEY N° 31012 (LEY DE PROTECCIÓN POLICIAL):
Conforme al Artículo 4° de la Ley N° 31012, rige en favor del personal policial la presunción de inocencia y la exención de responsabilidad penal y administrativa por haber actuado en cumplimiento del deber reglamentario.

IV. CONCLUSIÓN:
Solicito elevar el presente actuado al comando institucional y a la defensa legal de la PNP para los fines de blindaje procesal correspondiente.

Lima, [FECHA].

_____________________________
    [FIRMA Y CIP DEL EFECTIVO]`

    return {
      response: `### 🛡️ Informe de Uso Reglamentario de la Fuerza Blindado (D.L. 1186 / Ley 31012)

Colega: ante una intervención con uso de fuerza o arma, este informe establece la justificación de **Legalidad, Necesidad y Proporcionalidad**, activando la protección jurídica de la **Ley N° 31012**.

Descárgalo en **Word (.docx)** para remitirlo a tu Comando e Inspectoría:`,
      docTitle,
      docContent,
    }
  }

  // 5. Prescripción y Caducidad (Art. 68 Ley 30714)
  if (prompt.includes('prescrip') || prompt.includes('caduc') || prompt.includes('plazo') || prompt.includes('68')) {
    return {
      response: `### ⏱️ Dictamen Técnico de Prescripción y Caducidad (Ley N° 30714)

Conforme al **Artículo 68 de la Ley N° 30714** y el **Artículo 47 del D.S. N° 003-2020-IN**, los plazos de prescripción de la potestad disciplinaria policial son perentorios e improrrogables:

1. **Infracciones Leves (L)**: Prescriben a los **tres (03) meses** de cometida la infracción, o a los tres meses de que el superior tomó conocimiento.
2. **Infracciones Graves (G)**: Prescriben a los **dos (02) años** de cometida la infracción.
3. **Infracciones Muy Graves (MG)**: Prescriben a los **tres (03) años** de la fecha del hecho. *(En hechos continuados, a los 4 años)*.
4. **Caducidad del Procedimiento Administrativo Disciplinario (PAD)**: Si el PAD no se resuelve en el plazo máximo de **nueve (09) meses** calendario desde la notificación del Auto de Inicio, opera la caducidad de pleno derecho y el ARCHIVO DEFINITIVO.

> **💡 Consejo Táctico**: Si Inspectoría notificó el inicio hace más de 9 meses sin resolución final, presenta de inmediato la **Deducción de Caducidad del PAD** exigiendo el archivo y la devolución de legajo limpio.`,
    }
  }

  // 6. Modo Inspectoría: Generación de Auto de Inicio o Informe
  if (mode === 'INSPECTORIA' || prompt.includes('auto de inicio') || prompt.includes('inspector')) {
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

Puedes descargarlo en **Word (.docx)** con membrete oficial y márgenes reglamentarios listo para firma del Oficial Instructor:`,
      docTitle,
      docContent,
    }
  }

  // 7. Modo Defensa: Generación de Descargo General
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

Colega: he preparado tu **Escrito de Descargo Técnico** atacando la imputación mediante la causal de **Fuerza Mayor y Ausencia de Tipicidad (Art. 21 Ley 30714)**, citando jurisprudencia del Tribunal de Disciplina Policial (TDP).

Puedes descargarlo inmediatamente en **Word (.docx)** para imprimir, adjuntar tus pruebas y presentarlo en Mesa de Partes de Inspectoría:`,
    docTitle,
    docContent,
  }
}
