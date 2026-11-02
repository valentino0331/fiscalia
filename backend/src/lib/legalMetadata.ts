// Helper para extraer metadatos procesales peruanos (Expediente, Carpeta Fiscal, Autoridad, Materia)
export function extractLegalMetadata(text: string) {
  const clean = text || '';
  
  // 1. Patrones de Expediente o Carpeta Fiscal
  let detectedExpediente: string | null = null;
  const expPatterns = [
    /(?:EXP(?:EDIENTE)?\.?|CARPETA\s+FISCAL|CASO|REGISTRO)\s*(?:N[°º.]?|NUMERO|NRO\.?)?\s*:?\s*([0-9A-Z\-/.]+-[0-9]{4}[0-9A-Z\-/.]*)/i,
    /\b([0-9]{3,6}-[0-9]{4}-[0-9]+-[0-9A-Z]+(?:-[A-Z]+-[0-9]+)?)\b/,
    /\b(CASO\s*N[°º]?\s*[0-9]{9,15}-[0-9]{4}-[0-9]+)\b/i,
    /\b([0-9]{9,15}-[0-9]{4}-[0-9]+)\b/,
    /\b(EXP\.?\s*N[°º]?\s*[0-9]{1,6}-[0-9]{4})\b/i,
  ];

  for (const regex of expPatterns) {
    const match = clean.match(regex);
    if (match && match[1]) {
      detectedExpediente = match[1].trim();
      break;
    }
  }

  // 2. Patrones de Autoridad / Juzgado / Fiscalía
  let detectedAuthority: string | null = null;
  const authPatterns = [
    /(?:JUZGADO|SALA|FISCAL[IÍ]A|CORTE\s+SUPERIOR|INSPECTOR[IÍ]A|COMISAR[IÍ]A|SUNAT|SAT|OEFA|OSINERGMIN|INDECOPI)[^\n\r,.;:]+/i,
    /(?:FISCAL\s+PROVINCIAL|JUEZ\s+DE\s+PAZ|JUEZ\s+ESPECIALIZADO)[^\n\r,.;:]+/i,
  ];

  for (const regex of authPatterns) {
    const match = clean.match(regex);
    if (match && match[0]) {
      detectedAuthority = match[0].trim().replace(/\s+/g, ' ');
      if (detectedAuthority.length > 80) {
        detectedAuthority = detectedAuthority.slice(0, 80) + '...';
      }
      break;
    }
  }

  // 3. Materia y Especialista Recomendado
  const lower = clean.toLowerCase();
  let materia = 'General / Administrativo';
  let recommendedAgentId = 'marco';
  let recommendedAgentName = 'Marco (Especialista Administrativo)';
  let alertLevel: 'red' | 'yellow' | 'green' = 'yellow';
  let alertTitle = 'Notificación o Cédula Judicial en Revisión';
  let deadlineText = 'Revisa la fecha de recepción física o virtual (plazo estimado: 3 a 5 días hábiles).';
  const actionSteps: string[] = [];

  if (
    lower.includes('despido') ||
    lower.includes('preaviso') ||
    lower.includes('carta de imputación') ||
    lower.includes('falta grave') ||
    lower.includes('sunafil') ||
    lower.includes('liquidación de beneficios') ||
    lower.includes('beneficios sociales')
  ) {
    materia = 'Derecho Laboral';
    recommendedAgentId = 'valentina';
    recommendedAgentName = 'Valentina (Especialista Laboral)';
    alertLevel = 'red';
    alertTitle = detectedExpediente
      ? `Expediente Laboral ${detectedExpediente} — Preaviso / Conflicto Laboral`
      : 'Riesgo de Despido / Preaviso Notificado';
    deadlineText = lower.includes('preaviso') || lower.includes('imputación')
      ? 'Tienes exactamente 6 días naturales para formular tus descargos por escrito.'
      : 'Plazo legal de prescripción para accionar por despido: 30 días hábiles.';
    actionSteps.push('No firmes cartas de renuncia ni documentos en blanco bajo presión.');
    actionSteps.push('Prepara tu descargo negando las faltas imputadas y adjuntando medios probatorios (correos, mensajes, asistencias).');
    actionSteps.push('Si te impiden ingresar al centro laboral, solicita de inmediato una constatación policial por despido incausado.');
  } else if (
    lower.includes('prisión preventiva') ||
    lower.includes('fiscalía') ||
    lower.includes('fiscalia') ||
    lower.includes('carpeta fiscal') ||
    lower.includes('citación policial') ||
    lower.includes('conducción compulsiva') ||
    lower.includes('apercibimiento') ||
    lower.includes('formalización de investigación') ||
    lower.includes('requerimiento acusatorio') ||
    lower.includes('auto de enjuiciamiento') ||
    lower.includes('declaración de imputado')
  ) {
    materia = 'Derecho Penal y Procesal Penal';
    recommendedAgentId = 'sebastian';
    recommendedAgentName = 'Sebastián (Especialista Penal)';
    alertLevel = 'red';
    alertTitle = detectedExpediente
      ? `Carpeta/Exp. Penal ${detectedExpediente} — Requerimiento Fiscal / Penal`
      : 'Citación o Disposición Fiscal / Penal Urgente';
    deadlineText = 'Revisa con extrema atención la fecha y hora fijadas. El incumplimiento acarrea conducción compulsiva.';
    actionSteps.push('Ejerce tu derecho constitucional a no declarar sin la presencia obligatoria de tu abogado defensor.');
    actionSteps.push('Exige la lectura íntegra de la denuncia y copia completa de los actuados antes de rendir manifestación.');
    actionSteps.push('Si careces de recursos, solicita de inmediato la asignación de un Defensor Público del MINJUSDH.');
  } else if (
    lower.includes('alimentos') ||
    lower.includes('pensión de alimentos') ||
    lower.includes('juzgado de paz letrado') ||
    lower.includes('tenencia') ||
    lower.includes('régimen de visitas') ||
    lower.includes('violencia familiar') ||
    lower.includes('medidas de protección')
  ) {
    materia = 'Derecho de Familia';
    recommendedAgentId = 'camila';
    recommendedAgentName = 'Camila (Especialista de Familia)';
    alertLevel = lower.includes('medidas de protección') ? 'red' : 'yellow';
    alertTitle = detectedExpediente
      ? `Exp. de Familia ${detectedExpediente} — Demanda o Medidas de Protección`
      : 'Trámite Procesal de Familia / Alimentos';
    deadlineText = 'Plazo para contestar demanda: 5 días hábiles desde la notificación válida.';
    actionSteps.push('Recuerda que los procesos de alimentos están exonerados de tasas judiciales y auxilio judicial previo.');
    actionSteps.push('Acredita las necesidades del beneficiario con comprobantes reales de vivienda, educación, alimentación y salud.');
    actionSteps.push('Si eres el demandado, acredita fehacientemente tus ingresos netos y cargas familiares para una pensión proporcional.');
  } else if (
    lower.includes('desalojo') ||
    lower.includes('arrendamiento') ||
    lower.includes('inquilino') ||
    lower.includes('allanamiento') ||
    lower.includes('prescripción adquisitiva') ||
    lower.includes('reivindicación') ||
    lower.includes('ejecución de garantías') ||
    lower.includes('remate judicial')
  ) {
    materia = 'Derecho Civil e Inmobiliario';
    recommendedAgentId = 'diego';
    recommendedAgentName = 'Diego (Especialista Civil)';
    alertLevel = lower.includes('remate') || lower.includes('desalojo') ? 'red' : 'yellow';
    alertTitle = detectedExpediente
      ? `Exp. Civil ${detectedExpediente} — Proceso Inmobiliario / Civil`
      : 'Notificación Civil / Inmobiliaria';
    deadlineText = 'Plazo procesal ordinario de 3 a 5 días hábiles según la vía (sumarísimo o abreviado).';
    actionSteps.push('Revisa si el contrato cuenta con cláusula de allanamiento a futuro o desalojo notarial (Ley 30933).');
    actionSteps.push('Verifica la vigencia y regularidad de la carta notarial de requerimiento de restitución o pago.');
    actionSteps.push('Prepara los recibos de pago o medios de defensa para evitar el lanzamiento judicial.');
  } else if (
    lower.includes('sunat') ||
    lower.includes('sat') ||
    lower.includes('coactivo') ||
    lower.includes('cobranza coactiva') ||
    lower.includes('retención de cuentas') ||
    lower.includes('embargo en forma de retención') ||
    lower.includes('resolución de ejecución coactiva') ||
    lower.includes('orden de pago') ||
    lower.includes('resolución de determinación')
  ) {
    materia = 'Derecho Tributario y Cobranza Coactiva';
    recommendedAgentId = 'fernanda';
    recommendedAgentName = 'Fernanda (Especialista Tributaria)';
    alertLevel = 'red';
    alertTitle = detectedExpediente
      ? `Exp. Coactivo ${detectedExpediente} — Riesgo de Embargo de Cuentas`
      : 'Resolución de Cobranza Coactiva — Riesgo de Embargo';
    deadlineText = 'Tienes exactamente 7 días hábiles tras la REC para cancelar o interponer recurso de suspensión / queja.';
    actionSteps.push('Verifica si la deuda está prescrita (4 años para tributos no determinados o exigibles).');
    actionSteps.push('Ten presente que los sueldos en cuenta de haberes son inembargables hasta por 5 URP (S/ 2,575).');
    actionSteps.push('Evalúa una solicitud de fraccionamiento tributario o demanda de revisión judicial si hubo vicios de notificación.');
  } else if (
    lower.includes('oefa') ||
    lower.includes('osinergmin') ||
    lower.includes('minería') ||
    lower.includes('ambiental') ||
    lower.includes('informe final de instrucción') ||
    lower.includes('dfai') ||
    lower.includes('tastem')
  ) {
    materia = 'Derecho Minero & Ambiental';
    recommendedAgentId = 'rodrigo';
    recommendedAgentName = 'Rodrigo (Especialista Minero & Ambiental)';
    alertLevel = 'yellow';
    alertTitle = detectedExpediente
      ? `Expediente OEFA/Osinergmin ${detectedExpediente} — Procedimiento Sancionador`
      : 'Supervisión / Sanción Ambiental o Minera';
    deadlineText = 'Plazo de 10 a 15 días hábiles según la directiva del ente supervisor (OEFA / Osinergmin).';
    actionSteps.push('Revisa el Acta de Supervisión y coteja las observaciones técnicas frente a los estándares vigentes.');
    actionSteps.push('Acredita medidas de subsanación voluntaria antes del inicio del PAS para mitigar o eximir multas.');
    actionSteps.push('Prepara el informe de descargos técnico-legal con peritajes ambientales o de seguridad.');
  } else if (
    lower.includes('comisaría') ||
    lower.includes('inspectoría') ||
    lower.includes('disciplinario pnp') ||
    lower.includes('ley 30714') ||
    lower.includes('infracción muy grave') ||
    lower.includes('pase al retiro')
  ) {
    materia = 'Régimen Disciplinario PNP';
    recommendedAgentId = 'sebastian';
    recommendedAgentName = 'Sebastián (Especialista Penal y PNP)';
    alertLevel = 'red';
    alertTitle = detectedExpediente
      ? `Expediente Disciplinario PNP ${detectedExpediente}`
      : 'Procedimiento Administrativo Disciplinario PNP (Ley 30714)';
    deadlineText = 'Plazo perentorio de 10 días hábiles para presentar descargos ante Inspectoría.';
    actionSteps.push('Solicita copia íntegra de la resolución de inicio y de los actuados de la Oficina de Disciplina.');
    actionSteps.push('Acredita ausencia de dolo, estado de necesidad en acto del servicio o vicios de tipicidad.');
    actionSteps.push('Recurre en apelación ante el Tribunal de Disciplina Policial de ser necesario.');
  } else {
    alertTitle = detectedExpediente
      ? `Expediente Oficial ${detectedExpediente}`
      : 'Documento Legal Procesado';
    deadlineText = 'Verifica la fecha de la diligencia o notificación (plazo estimado: 3 a 8 días hábiles).';
    actionSteps.push('Identifica el número de expediente, fojas y la autoridad u oficina que suscribe el acto.');
    actionSteps.push('Revisa con detalle la sección de considerandos y la parte resolutiva del documento.');
    actionSteps.push('Inicia de inmediato una consulta técnica con el especialista para preparar tu escrito de respuesta.');
  }

  return {
    detectedExpediente,
    detectedAuthority,
    materia,
    alertLevel,
    alertTitle,
    deadlineText,
    actionSteps,
    recommendedAgentId,
    recommendedAgentName,
  };
}

export function extractDatesFromText(text: string): string[] {
  if (!text) return [];
  const dateRegex = /\b(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}|\d{1,2}\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|setiembre|septiembre|octubre|noviembre|diciembre)\s+de\s+\d{4})\b/gi;
  const matches = text.match(dateRegex) || [];
  return Array.from(new Set(matches.map((m) => m.trim())));
}

export function detectContradictionsAcrossFiles(
  filesMeta: Array<{ fileName: string; meta: any; dates: string[] }>
): string[] {
  const contradictions: string[] = [];
  const distinctExpedientes = Array.from(
    new Set(filesMeta.map((f) => f.meta?.detectedExpediente).filter(Boolean))
  );
  if (distinctExpedientes.length > 1) {
    contradictions.push(
      `DISCREPANCIA DE EXPEDIENTE: Se detectaron múltiples expedientes distintos en el lote de archivos (${distinctExpedientes.join(', ')}). Verifica si corresponden a cuadernos separados (cautelar, apelación, principal) o expedientes no relacionados.`
    );
  }

  const distinctAuthorities = Array.from(
    new Set(filesMeta.map((f) => f.meta?.detectedAuthority).filter(Boolean))
  );
  if (distinctAuthorities.length > 1) {
    contradictions.push(
      `MÚLTIPLES SEDES JUDICIALES/FISCALES: Se detectaron diferentes órganos emisores (${distinctAuthorities.join(' vs. ')}). Verifica si hubo declinatoria de competencia, elevación a Sala o acumulación de procesos.`
    );
  }

  return contradictions;
}

