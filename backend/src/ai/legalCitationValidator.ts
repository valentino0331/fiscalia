/**
 * Legal Citation Validator — HARDMAN
 * 
 * Validador e inspector jurídico independiente y determinista.
 * Audita cada respuesta antes de enviarla al usuario:
 * 1. Detecta y extrae referencias a Casaciones, Acuerdos Plenarios, Artículos y Leyes.
 * 2. Contrasta contra el compendio oficial de jurisprudencia y normativa vigente al 2026.
 * 3. Clasifica la veracidad en: VERIFIED, EXISTENCE_VERIFIED_CONTENT_UNVERIFIED, UNVERIFIED_CLAIM, CONTRADICTED, REPEALED_NORM.
 * 4. Rectifica advertencias de normas derogadas y bloquea alucinaciones sin sustento.
 */

import { DetectedCitation, VerificationSummary } from './types';
import { JURISPRUDENCE_COMPENDIUM, NORMATIVE_REFORMS_COMPENDIUM } from '../lib/spijLegalEngine';
import { LegalSourceRegistry, validateStatutoryArticle } from './legalSourceRegistry';

// Catálogo de precedentes y casaciones canónicas verificadas de la Corte Suprema del Perú
export const VERIFIED_JURISPRUDENCE_REGISTRY: Record<string, {
  title: string;
  court: string;
  subject: string;
  bindingFJ: string;
}> = {
  // --- PLENOS CASATORIOS CIVILES (I al X) ---
  '1465-2007': {
    title: 'I Pleno Casatorio Civil (Casación N° 1465-2007/Cajamarca)',
    court: 'Salas Civiles Reunidas de la Corte Suprema de Justicia',
    subject: 'Transacción extrajudicial no homologada judicialmente y excepción de conclusión del proceso',
    bindingFJ: 'Precedente Vinculante Pleno 1',
  },
  '2229-2008': {
    title: 'II Pleno Casatorio Civil (Casación N° 2229-2008/Lambayeque)',
    court: 'Salas Civiles Reunidas de la Corte Suprema de Justicia',
    subject: 'Prescripción adquisitiva de dominio y coposesión en bienes inmuebles',
    bindingFJ: 'Precedentes Vinculantes 1 al 3',
  },
  '4618-2007': {
    title: 'Tercer Pleno Casatorio Civil (Casación N° 4618-2007/Lima)',
    court: 'Salas Civiles Reunidas de la Corte Suprema de Justicia',
    subject: 'Divorcio por separación de hecho, cónyuge más perjudicado e indemnización obligatoria o adjudicación preferente',
    bindingFJ: 'Precedentes Vinculantes 1 al 6 (Fojas 12-18)',
  },
  '2195-2011': {
    title: 'IV Pleno Casatorio Civil (Casación N° 2195-2011/Ucayali)',
    court: 'Salas Civiles de la Corte Suprema de Justicia',
    subject: 'Desalojo por ocupación precaria y supuestos vinculantes de precariedad',
    bindingFJ: 'Precedentes Vinculantes 1 al 7',
  },
  '3189-2012': {
    title: 'V Pleno Casatorio Civil (Casación N° 3189-2012/Lima Norte)',
    court: 'Salas Civiles Reunidas de la Corte Suprema de Justicia',
    subject: 'Impugnación de acuerdos asociativos, legitimidad para obrar y nulidad de acto jurídico',
    bindingFJ: 'Precedente Vinculante Pleno 1',
  },
  '4004-2012': {
    title: 'VI Pleno Casatorio Civil (Casación N° 4004-2012/Junín)',
    court: 'Salas Civiles Reunidas de la Corte Suprema de Justicia',
    subject: 'Ejecución de garantías reales e hipotecarias, saldo deudor y estado de cuenta de saldo deudor',
    bindingFJ: 'Precedentes Vinculantes Reglas 1 a 7',
  },
  '367-2014': {
    title: 'VII Pleno Casatorio Civil (Casación N° 367-2014/Lima Norte)',
    court: 'Salas Civiles Reunidas de la Corte Suprema de Justicia',
    subject: 'Tercería de propiedad sobre bienes inmuebles no inscritos con fecha cierta frente a embargo judicial inscrito',
    bindingFJ: 'Precedentes Vinculantes Reglas 1 y 2',
  },
  '4442-2015': {
    title: 'VIII Pleno Casatorio Civil (Casación N° 4442-2015/Moquegua)',
    court: 'Salas Civiles Reunidas de la Corte Suprema de Justicia',
    subject: 'Disposición de bienes de la sociedad conyugal por un solo cónyuge y nulidad del acto jurídico',
    bindingFJ: 'Precedentes Vinculantes Reglas 1 a 5',
  },
  '3290-2015': {
    title: 'IX Pleno Casatorio Civil (Casación N° 3290-2015/Lima)',
    court: 'Salas Civiles Reunidas de la Corte Suprema de Justicia',
    subject: 'Proceso sumarísimo de otorgamiento de escritura pública y control judicial de oficio de nulidad manifiesta',
    bindingFJ: 'Precedentes Vinculantes Reglas 1 a 8',
  },
  '1242-2017': {
    title: 'X Pleno Casatorio Civil (Casación N° 1242-2017/Tacna)',
    court: 'Salas Civiles Reunidas de la Corte Suprema de Justicia',
    subject: 'Prueba de oficio en el proceso civil y límites del contradictorio previo bajo el Art. 194° CPC',
    bindingFJ: 'Precedentes Vinculantes Reglas 1 a 12',
  },

  // --- DERECHO DE FAMILIA Y NIÑEZ ---
  '2402-2012': {
    title: 'Casación N° 2402-2012/Lima',
    court: 'Sala Civil Transitoria de la Corte Suprema de Justicia',
    subject: 'Daño moral in re ipsa derivado de denuncias calumniosas, zozobra procesal y separación de hecho',
    bindingFJ: 'Fundamento Jurídico Quinto',
  },
  '2184-2017': {
    title: 'Casación N° 2184-2017/Ica',
    court: 'Sala de Derecho Constitucional y Social Permanente',
    subject: 'Interés superior del niño y tenencia compartida preferente',
    bindingFJ: 'Fundamentos Jurídicos 8 al 12',
  },
  '3784-2014': {
    title: 'Casación N° 3784-2014/Tacna',
    court: 'Sala Civil Permanente de la Corte Suprema',
    subject: 'Pensión de alimentos para hijos mayores de edad que cursan estudios exitosos con notas aprobatorias',
    bindingFJ: 'Fundamentos Jurídicos Cuarto al Séptimo',
  },
  '1663-2017': {
    title: 'Casación N° 1663-2017/Cusco',
    court: 'Sala Civil Transitoria de la Corte Suprema',
    subject: 'Criterios de proporcionalidad y capacidad económica real del obligado en fijación de alimentos',
    bindingFJ: 'Fundamento Jurídico Quinto',
  },
  '3447-2017': {
    title: 'Casación N° 3447-2017/Lima',
    court: 'Sala Civil Transitoria de la Corte Suprema',
    subject: 'Régimen de visitas y su cumplimiento progresivo sin obstaculizaciones parentales',
    bindingFJ: 'Fundamento Jurídico Sexto',
  },
  '4310-2014': {
    title: 'Casación N° 4310-2014/Lima',
    court: 'Sala Civil Permanente de la Corte Suprema',
    subject: 'Separación de patrimonios y liquidación equitativa de sociedad de gananciales',
    bindingFJ: 'Fundamentos Jurídicos 5 y 6',
  },
  '2877-2015': {
    title: 'Casación N° 2877-2015/Lima',
    court: 'Sala Civil Transitoria de la Corte Suprema',
    subject: 'Suspensión y pérdida de la patria potestad por reiterado incumplimiento del deber asistencial',
    bindingFJ: 'Fundamento Jurídico Cuarto',
  },
  '1822-2016': {
    title: 'Casación N° 1822-2016/Lima',
    court: 'Sala Civil Permanente de la Corte Suprema',
    subject: 'Indemnización por daño al proyecto de vida y ruptura del deber conyugal de fidelidad',
    bindingFJ: 'Fundamento Jurídico Séptimo',
  },
  '879-2014': {
    title: 'Casación N° 879-2014/Lima',
    court: 'Sala Civil Transitoria de la Corte Suprema',
    subject: 'Exoneración de alimentos por desaparición del estado de necesidad o subsistencia propia',
    bindingFJ: 'Fundamento Jurídico Quinto',
  },

  // --- DERECHO PENAL Y PROCESAL PENAL ---
  '626-2013': {
    title: 'Casación N° 626-2013/Moquegua',
    court: 'Sala Penal Permanente de la Corte Suprema de Justicia',
    subject: 'Doctrina vinculante sobre los 5 presupuestos materiales de prisión preventiva y cesación',
    bindingFJ: 'Fundamentos Jurídicos 20 al 42 y FJ 49-54',
  },
  '391-2011': {
    title: 'Casación N° 391-2011/Piura',
    court: 'Sala Penal Permanente de la Corte Suprema de Justicia',
    subject: 'Cláusula rebus sic stantibus y principio de mutabilidad en cesación de prisión preventiva',
    bindingFJ: 'Fundamento Jurídico Cuarto',
  },
  '02-2008': {
    title: 'Casación Vinculante N° 02-2008/La Libertad',
    court: 'Sala Penal Permanente de la Corte Suprema',
    subject: 'Control de plazos en diligencias preliminares y tutela de derechos',
    bindingFJ: 'Fundamentos Jurídicos 4 al 8',
  },
  '661-2016': {
    title: 'Casación N° 661-2016/Piura',
    court: 'Sala Penal Permanente de la Corte Suprema',
    subject: 'Colusión agravada: delito de resultado que exige peritaje contable del perjuicio patrimonial al Estado',
    bindingFJ: 'Fundamento Jurídico Sexto',
  },
  '1307-2019': {
    title: 'Casación N° 1307-2019/Nacional',
    court: 'Sala Penal Permanente de la Corte Suprema',
    subject: 'Estándar probatorio de sospecha fuerte en prisión preventiva y evaluación de arraigos de calidad',
    bindingFJ: 'Fundamentos Jurídicos 18 al 29',
  },
  '760-2016': {
    title: 'Casación N° 760-2016/La Libertad',
    court: 'Sala Penal Permanente de la Corte Suprema',
    subject: 'Prueba de oficio en juicio oral penal y principio acusatorio',
    bindingFJ: 'Fundamentos Jurídicos Quinto al Noveno',
  },
  '158-2016': {
    title: 'Casación N° 158-2016/Huaura',
    court: 'Sala Penal Permanente de la Corte Suprema',
    subject: 'Control formal y sustancial de la acusación fiscal en etapa intermedia',
    bindingFJ: 'Fundamentos Jurídicos 7 al 12',
  },
  '342-2017': {
    title: 'Casación N° 342-2017/San Martín',
    court: 'Sala Penal Permanente de la Corte Suprema',
    subject: 'Autonomía del delito de lavado de activos y tipicidad subjetiva',
    bindingFJ: 'Fundamentos Jurídicos 11 al 16',
  },
  '92-2017': {
    title: 'Casación N° 92-2017/Arequipa',
    court: 'Sala Penal Permanente de la Corte Suprema',
    subject: 'Principio de oportunidad, acuerdos reparatorios y extinción de la acción penal',
    bindingFJ: 'Fundamento Jurídico Cuarto',
  },
  '1673-2017': {
    title: 'Casación N° 1673-2017/Nacional',
    court: 'Sala Penal Permanente de la Corte Suprema',
    subject: 'Incomunicación judicial de investigados y garantías procesales',
    bindingFJ: 'Fundamentos Jurídicos 8 al 10',
  },
  '328-2018': {
    title: 'Casación N° 328-2018/Nacional',
    court: 'Sala Penal Permanente de la Corte Suprema',
    subject: 'Elementos constitutivos del delito de organización criminal frente a banda criminal',
    bindingFJ: 'Fundamentos Jurídicos 15 al 22',
  },

  // --- ACUERDOS PLENARIOS PENALES ---
  '01-2019': {
    title: 'Acuerdo Plenario N° 01-2019/CIJ-116',
    court: 'XI Pleno Jurisdiccional Penal de la Corte Suprema',
    subject: 'Prisión preventiva: sospecha grave/fuerte y peligrosismo procesal de calidad',
    bindingFJ: 'Fundamentos Jurídicos 24-27 y 35-48',
  },
  '06-2009': {
    title: 'Acuerdo Plenario N° 06-2009/CJ-116',
    court: 'V Pleno Jurisdiccional Penal de la Corte Suprema',
    subject: 'Control formal y sustancial de la acusación fiscal en etapa intermedia',
    bindingFJ: 'Fundamentos Jurídicos 8 al 15',
  },
  '02-2012': {
    title: 'Acuerdo Plenario Extraordinario N° 02-2012/CJ-116',
    court: 'Pleno Jurisdiccional Penal de la Corte Suprema',
    subject: 'Audiencia de tutela de derechos e imputación suficiente',
    bindingFJ: 'Fundamentos Jurídicos 6 al 10',
  },
  '04-2010': {
    title: 'Acuerdo Plenario N° 04-2010/CJ-116',
    court: 'VI Pleno Jurisdiccional Penal de la Corte Suprema',
    subject: 'Tutela de derechos residual contra actos de investigación fiscal o policial',
    bindingFJ: 'Fundamentos Jurídicos 11 al 19',
  },
  '05-2023': {
    title: 'Acuerdo Plenario N° 05-2023/CIJ-112',
    court: 'XII Pleno Jurisdiccional Penal de la Corte Suprema',
    subject: 'Control difuso e inaplicabilidad de la Ley 31751 (Ley Soto) sobre prescripción',
    bindingFJ: 'Fundamentos Jurídicos 38 al 47',
  },
  '02-2005': {
    title: 'Acuerdo Plenario N° 02-2005/CJ-116',
    court: 'I Pleno Jurisdiccional Penal de la Corte Suprema',
    subject: 'Garantías de certeza en la declaración de la víctima y coimputados',
    bindingFJ: 'Fundamento Jurídico 10',
  },
  '04-2005': {
    title: 'Acuerdo Plenario N° 04-2005/CJ-116',
    court: 'I Pleno Jurisdiccional Penal de la Corte Suprema',
    subject: 'Tentativa y consumación en los delitos de robo y hurto',
    bindingFJ: 'Fundamentos Jurídicos 7 al 9',
  },
  '05-2009': {
    title: 'Acuerdo Plenario N° 05-2009/CJ-116',
    court: 'V Pleno Jurisdiccional Penal de la Corte Suprema',
    subject: 'Proceso de terminación anticipada y reducción premial acumulativa',
    bindingFJ: 'Fundamentos Jurídicos 12 al 18',
  },
  '03-2010': {
    title: 'Acuerdo Plenario N° 03-2010/CJ-116',
    court: 'VI Pleno Jurisdiccional Penal de la Corte Suprema',
    subject: 'Lavado de activos y autonomía procesal frente al delito fuente',
    bindingFJ: 'Fundamentos Jurídicos 25 al 34',
  },
  '02-2016': {
    title: 'Acuerdo Plenario Extraordinario N° 02-2016/CIJ-116',
    court: 'Pleno Jurisdiccional Penal de la Corte Suprema',
    subject: 'Proceso inmediato reformado y supuestos de flagrancia delictiva y confesión',
    bindingFJ: 'Fundamentos Jurídicos 9 al 16',
  },
  '01-2017': {
    title: 'Acuerdo Plenario N° 01-2017/CIJ-116',
    court: 'Pleno Jurisdiccional Penal de la Corte Suprema',
    subject: 'Colaboración eficaz y eficacia probatoria de los actos de corroboración',
    bindingFJ: 'Fundamentos Jurídicos 14 al 23',
  },

  // --- DERECHO LABORAL ---
  '12475-2014': {
    title: 'Casación Laboral N° 12475-2014/Lima',
    court: 'Segunda Sala de Derecho Constitucional y Social Transitoria',
    subject: 'Desnaturalización de contratos modales por incremento de actividad e inexistencia de causa objetiva',
    bindingFJ: 'Fundamento Jurídico Quinto',
  },
  '9957-2017': {
    title: 'Casación Laboral N° 9957-2017/Lima',
    court: 'Segunda Sala de Derecho Constitucional y Social Transitoria',
    subject: 'Hostigamiento laboral, actos de hostilidad y daño moral derivado del cese encubierto',
    bindingFJ: 'Fundamentos Jurídicos 6 al 8',
  },
  '1696-2012': {
    title: 'Casación Laboral N° 1696-2012/Lima',
    court: 'Sala de Derecho Constitucional y Social Permanente',
    subject: 'Principio de primacía de la realidad ante locación de servicios con subordinación encubierta',
    bindingFJ: 'Fundamento Jurídico Séptimo',
  },
  '18450-2015': {
    title: 'Casación Laboral N° 18450-2015/Lima',
    court: 'Primera Sala de Derecho Constitucional y Social Transitoria',
    subject: 'Horas extras, presunción de sobretiempo y fiscalización inmediata del empleador',
    bindingFJ: 'Fundamento Jurídico Sexto',
  },
  '367-2022': {
    title: 'Casación N° 367-2022/Lima',
    court: 'Cuarta Sala de Derecho Constitucional y Social Transitoria',
    subject: 'Prueba indiciaria y actos de hostilidad laboral por reducción de categoría',
    bindingFJ: 'Fundamentos Jurídicos Sexto al Octavo',
  },
  '11169-2014': {
    title: 'Casación Laboral N° 11169-2014/La Libertad',
    court: 'Segunda Sala de Derecho Constitucional y Social Transitoria',
    subject: 'Indemnización por despido fraudulento, daño emergente y lucro cesante laboral',
    bindingFJ: 'Fundamentos Jurídicos 5 al 9',
  },

  // --- DERECHO ADMINISTRATIVO Y CONTENCIOSO ---
  '8453-2014': {
    title: 'Casación N° 8453-2014/Lima',
    court: 'Sala de Derecho Constitucional y Social Permanente',
    subject: 'Caducidad del procedimiento administrativo sancionador (9 meses) y prescripción de 4 años bajo el TUO LPAG',
    bindingFJ: 'Fundamentos Jurídicos Quinto al Noveno',
  },
  '1803-2017': {
    title: 'Casación N° 1803-2017/Lima',
    court: 'Tercera Sala de Derecho Constitucional y Social Transitoria',
    subject: 'Silencio administrativo positivo, efectos jurídicos automáticos y validez del acto presunto',
    bindingFJ: 'Fundamento Jurídico Cuarto',
  },
  '2038-2016': {
    title: 'Casación N° 2038-2016/Lima',
    court: 'Sala de Derecho Constitucional y Social Permanente',
    subject: 'Agotamiento de la vía administrativa y excepciones a la exigibilidad de recursos inútiles',
    bindingFJ: 'Fundamentos Jurídicos 6 y 7',
  },

  // --- PRECEDENTES CONSTITUCIONALES VINCULANTES (TC) ---
  '03525-2021': {
    title: 'STC Exp. N° 03525-2021-PA/TC (Caso Maxco S.A.C.)',
    court: 'Tribunal Constitucional del Perú',
    subject: 'Inconstitucionalidad del cobro de intereses moratorios generados por dilaciones de SUNAT y Tribunal Fiscal',
    bindingFJ: 'Fundamentos Jurídicos 32 al 45',
  },
  '05057-2013': {
    title: 'STC Exp. N° 05057-2013-PA/TC (Precedente Huatuco Huatuco)',
    court: 'Tribunal Constitucional del Perú',
    subject: 'Improcedencia de reposición de trabajadores en el sector público sin concurso público de méritos',
    bindingFJ: 'Fundamentos Jurídicos 18 al 24',
  },
  '00002-2022': {
    title: 'STC Exp. N° 00002-2022-PCC/TC',
    court: 'Tribunal Constitucional del Perú',
    subject: 'Competencias exclusivas constitucionales y límites al control judicial sobre actos parlamentarios',
    bindingFJ: 'Fundamentos Jurídicos 45 al 60',
  },
};

// Catálogo de normas derogadas o reemplazadas al 2026
export const REPEALED_NORMS_CATALOG: {
  pattern: RegExp;
  repealedName: string;
  activeSubstitute: string;
  warningNote: string;
}[] = [
  {
    pattern: /\b(?:Ley\s*N[°º.]?\s*30225|Ley\s+de\s+Contrataciones\s+del\s+Estado\s+30225)\b/i,
    repealedName: 'Ley N° 30225 (Ley de Contrataciones del Estado)',
    activeSubstitute: 'Ley N° 32069 (Ley General de Contrataciones Públicas / OECE) y D.S. N° 009-2025-EF',
    warningNote: 'La Ley N° 30225 y el OSCE se encuentran extintos para convocatorias posteriores al 22 de abril de 2025. Al 2026 rige la Ley N° 32069 y su Reglamento D.S. N° 009-2025-EF bajo rectoría del OECE y el Tribunal de Contrataciones Públicas (TCP). Bajo la Primera Disposición Complementaria Transitoria de la Ley 32069, los contratos derivados de procedimientos convocados antes del 22 de abril de 2025 se rigen ultraactivamente por la Ley N° 30225 hasta su liquidación.',
  },
  {
    pattern: /\b(?:D\.?\s*S\.?\s*N[°º.]?\s*004[-–]2019[-–]JUS|Decreto\s+Supremo\s+004[-–]2019[-–]JUS)\b/i,
    repealedName: 'D.S. N° 004-2019-JUS (Antiguo TUO de la Ley N° 27444 - LPAG)',
    activeSubstitute: 'D.S. N° 006-2026-JUS (Nuevo TUO de la Ley N° 27444 - LPAG)',
    warningNote: 'El D.S. 004-2019-JUS fue derogado y formalmente reemplazado por el D.S. N° 006-2026-JUS (MINJUSDH).',
  },
  {
    pattern: /\b(?:Ley\s*(?:N[°º.]?|Nro\.?|Número)?\s*28677|Ley\s+de\s+Garant[ií]as\s+Mobiliarias\s+28677)\b/i,
    repealedName: 'Ley N° 28677 (Ley de la Garantía Mobiliaria)',
    activeSubstitute: 'Decreto Legislativo N° 1400 (D.L. 1400) y Sistema Informativo de Garantías Mobiliarias (SIGM)',
    warningNote: 'La Ley 28677 fue derogada en su totalidad por el Decreto Legislativo N° 1400 (D.L. 1400) y el SIGM de SUNARP.',
  },
  {
    pattern: /\b(?:RMV\s*(?:de\s*)?S\/?\.?\s*1,?025|RMV\s*(?:de\s*)?S\/?\.?\s*1,?130)\b/i,
    repealedName: 'RMV desactualizada (S/ 1,025 o S/ 1,130)',
    activeSubstitute: 'Remuneración Mínima Vital de S/ 1,230.00 (D.S. N° 015-2026-TR)',
    warningNote: 'Al 2026 la RMV oficial es de S/ 1,230.00 (D.S. N° 015-2026-TR) y la Asignación Familiar asciende a S/ 123.00.',
  },
  {
    pattern: /\b(?:Tribunal\s+del\s+OSCE|del\s+OSCE|ante\s+el\s+OSCE|opini[óo]n\s+(?:vinculante\s+)?del\s+OSCE|solicita\s+al\s+OSCE)\b/i,
    repealedName: 'OSCE (Organismo Supervisor de las Contrataciones del Estado)',
    activeSubstitute: 'OECE (Organismo Especializado para las Contrataciones Públicas Eficientes) y Tribunal de Contrataciones Públicas (TCP)',
    warningNote: 'El OSCE y su Tribunal se encuentran formalmente extintos bajo la Ley N° 32069 y D.S. N° 009-2025-EF, habiendo sido sustituidos por el OECE y el Tribunal de Contrataciones Públicas (TCP).',
  },
  {
    pattern: /\b(?:Ley\s*(?:N[°º.]?|Nro\.?|Número)?\s*26636|Ley\s+Procesal\s+del\s+Trabajo\s+26636)\b/i,
    repealedName: 'Ley N° 26636 (Antigua Ley Procesal del Trabajo)',
    activeSubstitute: 'Ley N° 29497 (Nueva Ley Procesal del Trabajo - NLPT) y Ley N° 32155',
    warningNote: 'La Ley 26636 fue formalmente derogada por la Ley N° 29497 (NLPT), reformada por la Ley N° 32155.',
  },
  {
    pattern: /\b(?:Ley\s*(?:N[°º.]?|Nro\.?|Número)?\s*23506|Ley\s*(?:N[°º.]?|Nro\.?|Número)?\s*28237|C[óo]digo\s+Procesal\s+Constitucional\s+28237)\b/i,
    repealedName: 'Ley N° 23506 / Ley N° 28237 (Código Procesal Constitucional derogado)',
    activeSubstitute: 'Ley N° 31307 (Nuevo Código Procesal Constitucional)',
    warningNote: 'Las leyes 23506 y 28237 fueron derogadas íntegramente por el Nuevo Código Procesal Constitucional (Ley N° 31307).',
  },
  {
    pattern: /\b(?:C[óo]digo\s+de\s+Procedimientos\s+Penales(?:\s+de\s+1940)?|C\.?\s*de\s*P\.?\s*P\.?\s*de\s*1940)\b/i,
    repealedName: 'Código de Procedimientos Penales de 1940 (Ley N° 9024)',
    activeSubstitute: 'Nuevo Código Procesal Penal (Decreto Legislativo N° 957 - NCPP)',
    warningNote: 'El Código de Procedimientos Penales de 1940 ha concluido su proceso de liquidación procesal en el Perú, rigiendo exclusivamente el Nuevo Código Procesal Penal (D. Leg. 957 - NCPP).',
  },
  {
    pattern: /\b(?:D\.?\s*S\.?\s*(?:N[°º.]?\s*)?344[-–]2018[-–]EF|Decreto\s+Supremo\s+344[-–]2018[-–]EF)\b/i,
    repealedName: 'D.S. N° 344-2018-EF (Antiguo Reglamento de Contrataciones)',
    activeSubstitute: 'D.S. N° 009-2025-EF (Reglamento de la Ley N° 32069 - Ley General de Contrataciones Públicas)',
    warningNote: 'El D.S. 344-2018-EF fue formalmente derogado y reemplazado por el D.S. N° 009-2025-EF bajo la Ley N° 32069.',
  },
  {
    pattern: /\b(?:Ley\s*(?:N[°º.]?|Nro\.?|Número)?\s*26002|Ley\s+del\s+Notariado\s+26002)\b/i,
    repealedName: 'Ley N° 26002 (Antigua Ley del Notariado)',
    activeSubstitute: 'Decreto Legislativo N° 1049 (D.L. 1049 - Decreto Legislativo del Notariado)',
    warningNote: 'La Ley 26002 fue derogada en su totalidad por el Decreto Legislativo N° 1049 (D.L. 1049).',
  },
  {
    pattern: /\b(?:Ley\s*(?:N[°º.]?|Nro\.?|Número)?\s*16123|Ley\s+de\s+Sociedades\s+Mercantiles\s+16123)\b/i,
    repealedName: 'Ley N° 16123 (Antigua Ley de Sociedades Mercantiles)',
    activeSubstitute: 'Ley N° 26887 (Ley General de Sociedades - LGS)',
    warningNote: 'La Ley 16123 fue derogada por la actual Ley General de Sociedades (Ley N° 26887).',
  },
  {
    pattern: /\b(?:D\.?\s*L\.?\s*(?:N[°º.]?|Nro\.?)?\s*17752|Decreto\s+Ley\s*(?:N[°º.]?|Nro\.?)?\s*17752|Ley\s+General\s+de\s+Aguas\s+17752)\b/i,
    repealedName: 'Decreto Ley N° 17752 (Antigua Ley General de Aguas)',
    activeSubstitute: 'Ley N° 29338 (Ley de Recursos Hídricos)',
    warningNote: 'El D.L. 17752 fue formalmente derogado por la Ley de Recursos Hídricos (Ley N° 29338).',
  },
];

// Incompatibilidades dogmáticas notorias (atribución errónea)
export const MISATTRIBUTIONS_CATALOG: {
  pattern: RegExp;
  errorDescription: string;
  correctAttribution: string;
}[] = [
  {
    pattern: /(?:(?:art[íi]culo|art\.)\s*62[°º]?[\s\S]{0,100}(?:(?:derecho\s+(?:a\s+(?:la\s+)?)?)?defensa(?:\s+t[ée]cnica)?|asistencia\s+letrada)|(?:(?:derecho\s+(?:a\s+(?:la\s+)?)?)?defensa(?:\s+t[ée]cnica)?|asistencia\s+letrada)[\s\S]{0,100}(?:art[íi]culo|art\.)\s*62[°º]?)/i,
    errorDescription: 'El Artículo 62° del NCPP regula la Exclusión del Fiscal en el proceso penal, NO el derecho de defensa técnica.',
    correctAttribution: 'El Derecho a la Defensa Técnica cautiva se consagra en los Artículos IX del Título Preliminar, 71.2 literal c y 80° al 85° del NCPP.',
  },
  {
    pattern: /(?:(?:art[íi]culo|art\.)\s*480[°º]?[\s\S]{0,100}(?:causales?\s+de\s+divorcio|separaci[óo]n\s+de\s+hecho)|(?:causales?\s+de\s+divorcio|separaci[óo]n\s+de\s+hecho)[\s\S]{0,100}(?:art[íi]culo|art\.)\s*480[°º]?)/i,
    errorDescription: 'El Artículo 480° del Código Procesal Civil regula la vía procedimental de conocimiento, NO las causales de divorcio sustantivo.',
    correctAttribution: 'Las causales sustantivas de divorcio se encuentran tipificadas exclusivamente en el Artículo 333° del Código Civil (la separación de hecho es el inciso 12).',
  },
  {
    pattern: /(?:(?:art[íi]culo|art\.)\s*720[°º]?[\s\S]{0,100}(?:mandato\s+(?:de\s+)?ejecuci[óo]n|tres\s+d[íi]as\s+para\s+contradecir|plazo\s+de\s+contradicci[óo]n)|(?:mandato\s+(?:de\s+)?ejecuci[óo]n|tres\s+d[íi]as\s+para\s+contradecir|plazo\s+de\s+contradicci[óo]n)[\s\S]{0,100}(?:art[íi]culo|art\.)\s*720[°º]?)/i,
    errorDescription: 'El Artículo 720° del CPC regula la procedencia de la ejecución de garantías, NO el mandato de ejecución ni el plazo de contradicción.',
    correctAttribution: 'El mandato de ejecución y el plazo de 3 días hábiles para contradecir se tipifican en el Artículo 721° del Código Procesal Civil.',
  },
  {
    pattern: /(?:bancarizaci[óo]n[\s\S]{0,100}(?:a\s+partir\s+de\s+)?(?:US\$?\s*1,?000|S\/?\.?\s*3,?500)|(?:US\$?\s*1,?000|S\/?\.?\s*3,?500)[\s\S]{0,100}bancarizaci[óo]n)/i,
    errorDescription: 'Los umbrales antiguos de bancarización de US$ 1,000 y S/ 3,500 fueron modificados.',
    correctAttribution: 'Conforme al Decreto Legislativo N° 1529 (D.L. 1529), los nuevos montos mínimos obligatorios para usar Medios de Pago bancarizados son S/ 2,000.00 o US$ 500.00.',
  },
  {
    pattern: /(?:tenencia\s+exclusiva\s+materna\s+es\s+la\s+[úu]nica|preferencia\s+maternal\s+absoluta)/i,
    errorDescription: 'La preferencia maternal automática fue modificada por la reforma de Tenencia Compartida.',
    correctAttribution: 'Conforme a la Ley N° 31590, la regla general y preferente en el Perú es la Tenencia Compartida entre ambos progenitores aptos.',
  },
  {
    pattern: /(?:allanamiento[\s\S]{0,100}sin\s+presencia\s+(?:obligatoria\s+)?d(?:el\s+abogado|e\s+la\s+defensa)|allanar[\s\S]{0,100}sin\s+abogado)/i,
    errorDescription: 'Los allanamientos fiscales sin abogado defensor fueron limitados legalmente.',
    correctAttribution: 'Conforme a la Ley N° 32108, los allanamientos e incautaciones en procesos de crimen organizado exigen la presencia obligatoria de la defensa técnica.',
  },
];

// Catálogo de jurisprudencia y normas de jurisdicciones extranjeras prohibidas en el fuero peruano
export const FOREIGN_JURISDICTION_CATALOG: {
  pattern: RegExp;
  jurisdiction: string;
  foreignSource: string;
  peruvianEquivalent: string;
}[] = [
  {
    pattern: /\b(?:C[óo]digo\s+Civil\s+Federal|CCF(?:\s+de\s+M[ée]xico)?)\b/i,
    jurisdiction: 'México',
    foreignSource: 'Código Civil Federal de México',
    peruvianEquivalent: 'En el Perú rige exclusivamente el Código Civil Peruano (Decreto Legislativo N° 295).',
  },
  {
    pattern: /\b(?:C[óo]digo\s+Nacional\s+de\s+Procedimientos\s+Penales|CNPP(?:\s+de\s+M[ée]xico)?)\b/i,
    jurisdiction: 'México',
    foreignSource: 'Código Nacional de Procedimientos Penales de México',
    peruvianEquivalent: 'En el Perú rige el Nuevo Código Procesal Penal (Decreto Legislativo N° 957 - NCPP).',
  },
  {
    pattern: /\b(?:Ley\s+de\s+Enjuiciamiento\s+Civil|LEC\s+1\/2000)\b/i,
    jurisdiction: 'España',
    foreignSource: 'Ley de Enjuiciamiento Civil española',
    peruvianEquivalent: 'En el Perú rige el Código Procesal Civil (C.P.C. - D. Leg. 768 / D.S. 003-98-JUS).',
  },
  {
    pattern: /\b(?:Ley\s+de\s+Enjuiciamiento\s+Criminal|LECrim)\b/i,
    jurisdiction: 'España',
    foreignSource: 'Ley de Enjuiciamiento Criminal de España',
    peruvianEquivalent: 'En el Perú rige el Código Procesal Penal (D. Leg. 957).',
  },
  {
    pattern: /\b(?:C[óo]digo\s+General\s+del\s+Proceso|CGP\s+colombiano)\b/i,
    jurisdiction: 'Colombia',
    foreignSource: 'Código General del Proceso de Colombia (Ley 1564)',
    peruvianEquivalent: 'En el Perú rige el Código Procesal Civil (Resolución Ministerial N° 010-93-JUS / TUO).',
  },
  {
    pattern: /\b(?:Suprema\s+Corte\s+de\s+Justicia\s+de\s+la\s+Naci[óo]n|SCJN(?:\s+de\s+M[ée]xico)?)\b/i,
    jurisdiction: 'México',
    foreignSource: 'Suprema Corte de Justicia de la Nación (SCJN - México)',
    peruvianEquivalent: 'El máximo tribunal ordinario en el Perú es la Corte Suprema de Justicia de la República (Corte Suprema de Justicia del Perú) y en materia constitucional el Tribunal Constitucional del Perú.',
  },
  {
    pattern: /\b(?:Tribunal\s+Supremo\s+espa[ñn]ol|STS\s+[0-9]+\/[0-9]+)\b/i,
    jurisdiction: 'España',
    foreignSource: 'Tribunal Supremo de España',
    peruvianEquivalent: 'En el fuero judicial peruano la jurisprudencia vinculante emana de la Corte Suprema de Justicia del Perú (Plenos Casatorios y Acuerdos Plenarios).',
  },
  {
    pattern: /\b(?:Estatuto\s+de\s+los\s+Trabajadores|ET\s+espa[ñn]ol)\b/i,
    jurisdiction: 'España',
    foreignSource: 'Estatuto de los Trabajadores de España',
    peruvianEquivalent: 'En el Perú las relaciones laborales se rigen por el Texto Único Ordenado del Decreto Legislativo N° 728 (D.S. 003-97-TR), la Ley N° 29497 (NLPT) y la Ley 32155.',
  },
  {
    pattern: /\b(?:Ley\s+Federal\s+del\s+Trabajo|LFT(?:\s+de\s+M[ée]xico)?)\b/i,
    jurisdiction: 'México',
    foreignSource: 'Ley Federal del Trabajo de México',
    peruvianEquivalent: 'En el Perú rige el Texto Único Ordenado del Decreto Legislativo N° 728 (D.S. 003-97-TR), el Decreto Legislativo N° 713 (descansos remunerados) y la NLPT.',
  },
  {
    pattern: /\b(?:C[óo]digo\s+Fiscal\s+de\s+la\s+Federaci[óo]n|CFF(?:\s+mexicano)?|PRODECON)\b/i,
    jurisdiction: 'México',
    foreignSource: 'Código Fiscal de la Federación de México / PRODECON',
    peruvianEquivalent: 'En el Perú rige el Código Tributario (D.S. 133-2013-EF) bajo administración de la SUNAT, el Tribunal Fiscal y la Defensoría del Contribuyente y Usuario Aduanero (DEFCON).',
  },
  {
    pattern: /\b(?:Ley\s+General\s+de\s+Sociedades\s+Mercantiles|LGSM(?:\s+de\s+M[ée]xico)?)\b/i,
    jurisdiction: 'México',
    foreignSource: 'Ley General de Sociedades Mercantiles de México',
    peruvianEquivalent: 'En el Perú rige la Ley General de Sociedades (Ley N° 26887) y el régimen SACS (D.Leg. 1409).',
  },
  {
    pattern: /\b(?:Ley\s+de\s+Sociedades\s+de\s+Capital|LSC\s+espa[ñn]ola)\b/i,
    jurisdiction: 'España',
    foreignSource: 'Ley de Sociedades de Capital de España',
    peruvianEquivalent: 'En el Perú rige la Ley General de Sociedades (Ley N° 26887).',
  },
  {
    pattern: /\b(?:Ley\s+de\s+Minas(?:\s+de\s+Espa[ñn]a|\s+mexicana)?)\b/i,
    jurisdiction: 'Extranjera',
    foreignSource: 'Ley de Minas extranjera',
    peruvianEquivalent: 'En el Perú la actividad minera se rige por el TUO de la Ley General de Minería (D.S. 014-92-EM) y la Ley 26505.',
  },
  {
    pattern: /\b(?:Tribunal\s+Administrativo\s+Central\s+de\s+Recursos\s+Contractuales|TACRC)\b/i,
    jurisdiction: 'España',
    foreignSource: 'Tribunal Administrativo Central de Recursos Contractuales de España',
    peruvianEquivalent: 'En el Perú la resolución de controversias en contratación pública compete al Tribunal de Contrataciones Públicas (TCP - OECE).',
  },
];

export interface ValidationReport {
  summary: VerificationSummary;
  processedText: string;
  hasBlockingErrors: boolean;
  warnings: string[];
}

/**
 * Validador principal de texto jurídico
 */
export function validateLegalCitations(text: string): ValidationReport {
  if (!text || typeof text !== 'string') {
    return {
      summary: {
        totalCitations: 0,
        verifiedCitations: 0,
        unverifiedCitations: 0,
        repealedWarnings: 0,
        citations: [],
      },
      processedText: text || '',
      hasBlockingErrors: false,
      warnings: [],
    };
  }

  const citations: DetectedCitation[] = [];
  const warnings: string[] = [];
  let processedText = text;

  // 1. Detectar Normas Derogadas
  for (const item of REPEALED_NORMS_CATALOG) {
    if (item.pattern.test(processedText)) {
      citations.push({
        raw: item.repealedName,
        type: 'ley',
        normalized: item.repealedName,
        status: 'REPEALED_NORM',
        officialSource: item.activeSubstitute,
        detail: item.warningNote,
      });
      warnings.push(`⚠️ Norma Derogada detectada: ${item.repealedName}. Reemplazada por ${item.activeSubstitute}.`);
      
      // Sanitizar la mención de la norma derogada en el texto procesal
      processedText = processedText.replace(item.pattern, `[norma derogada — sustituida por ${item.activeSubstitute}]`);

      // Inyectar el cintillo oficial
      const warningBanner = `\n\n> ⚠️ **ALERTA DE VIGENCIA NORMATIVA (SPIJ 2026):** Se advierte que ${item.warningNote}\n\n`;
      if (!processedText.includes(warningBanner.trim())) {
        processedText = warningBanner + processedText;
      }
    }
  }

  // 2. Detectar Atribuciones Erróneas Inadmisibles
  for (const mis of MISATTRIBUTIONS_CATALOG) {
    if (mis.pattern.test(processedText)) {
      citations.push({
        raw: mis.errorDescription,
        type: 'articulo',
        normalized: mis.errorDescription,
        status: 'CONTRADICTED',
        detail: mis.correctAttribution,
      });
      warnings.push(`❌ Atribución jurídica incorrecta: ${mis.errorDescription}`);
      
      // Sanitizar la frase errónea en el texto procesal
      processedText = processedText.replace(mis.pattern, `[atribución jurídica errónea: ${mis.errorDescription} — por mandato legal rige: ${mis.correctAttribution}]`);

      // Inyectar rectificación dogmática
      const fixBanner = `\n\n> 🔍 **RECTIFICACIÓN DOGMÁTICA DE PRECISIÓN:** ${mis.errorDescription} Por mandato legal estricto: ${mis.correctAttribution}\n\n`;
      if (!processedText.includes(fixBanner.trim())) {
        processedText = processedText + fixBanner;
      }
    }
  }

  // 2.1. Detectar Invocación de Legislación o Jurisprudencia Extranjera Prohibida
  for (const f of FOREIGN_JURISDICTION_CATALOG) {
    if (f.pattern.test(processedText)) {
      // Excepción legítima: Si se trata de un análisis explícito de derecho comparado o contraste doctrinario
      const matchPos = processedText.search(f.pattern);
      const surroundingStart = Math.max(0, matchPos - 120);
      const surroundingEnd = Math.min(processedText.length, matchPos + 180);
      const surrounding = processedText.slice(surroundingStart, surroundingEnd);
      const isComparative = /(?:a\s+diferencia\s+de|frente\s+a|en\s+el\s+derecho\s+comparado|comparad[oa]\s+con|en\s+contraste\s+con|mientras\s+que\s+en|a\s+nivel\s+comparado)/i.test(surrounding);

      if (isComparative) {
        citations.push({
          raw: f.foreignSource,
          type: 'ley',
          normalized: `${f.foreignSource} (Derecho Comparado)`,
          status: 'VERIFIED',
          detail: `Referencia académica de derecho comparado (${f.jurisdiction}). Para el caso peruano: ${f.peruvianEquivalent}`,
        });
        continue;
      }

      citations.push({
        raw: f.foreignSource,
        type: 'ley',
        normalized: f.foreignSource,
        status: 'CONTRADICTED',
        detail: `Norma de jurisdicción extranjera (${f.jurisdiction}) no aplicable en el Perú. ${f.peruvianEquivalent}`,
      });
      warnings.push(`❌ Norma extranjera detectada: ${f.foreignSource} (${f.jurisdiction}). ${f.peruvianEquivalent}`);
      
      // Primero sanitizar en el texto procesal
      processedText = processedText.replace(f.pattern, `[norma/tribunal foráneo no aplicable en el Perú — rige legislación nacional: ${f.peruvianEquivalent}]`);

      const foreignBanner = `\n\n> 🚫 **ALERTA DE JURISDICCIÓN EXTRANJERA (LEGAL TRUTH ENGINE):** Se advierte que la referencia a "${f.foreignSource}" pertenece al ordenamiento de ${f.jurisdiction}. Por mandato constitucional y soberanía judicial, en los estrados y procesos peruanos rige exclusivamente la legislación nacional: ${f.peruvianEquivalent}\n\n`;
      if (!processedText.includes(foreignBanner.trim())) {
        processedText = foreignBanner + processedText;
      }
    }
  }

  // 2.2. Detectar Artículos Inexistentes por Límite de Código Nacional (Statutory Boundary Enforcement)
  const articleBoundaryRegex = /\b(?:Art[íi]culo|Art\.?)\s*([0-9]{1,5})(?:[-–]([A-Za-z0-9]+))?\s*(?:[º°\.]\s*)?(?:del|de\s+la|de\s+los|del\s+TUO\s+de\s+la)?\s*(C[óo]digo\s+Civil|C[óo]digo\s+Penal|C[óo]digo\s+Procesal\s+Civil|C[óo]digo\s+Procesal\s+Penal|Nuevo\s+C[óo]digo\s+Procesal\s+Penal|NCPP|CPC|CPP|CC|C\.P\.|C\.C\.|C\.P\.C\.|C[óo]digo\s+Tributario|C[óo]digo\s+Procesal\s+Constitucional|Nuevo\s+C[óo]digo\s+Procesal\s+Constitucional|Constituci[óo]n(?:\s+Pol[íi]tica(?:\s+del\s+Per[úu])?)?|Ley\s+General\s+de\s+Sociedades|LGS|LPAG|Ley\s+(?:del\s+)?Procedimiento\s+Administrativo\s+General|Nueva\s+Ley\s+Procesal\s+del\s+Trabajo|NLPT|Ley\s+de\s+T[íi]tulos\s+Valores)\b/gi;
  let artMatch: RegExpExecArray | null;
  while ((artMatch = articleBoundaryRegex.exec(text)) !== null) {
    const artNum = parseInt(artMatch[1], 10);
    const codeMention = artMatch[3];
    const validation = validateStatutoryArticle(artNum, codeMention);

    if (!validation.isValid && validation.codeBoundary) {
      citations.push({
        raw: artMatch[0],
        type: 'articulo',
        normalized: `Artículo ${artNum} del ${validation.codeBoundary.name}`,
        status: 'CONTRADICTED',
        officialSource: validation.codeBoundary.officialEnactment,
        detail: validation.reason,
      });
      warnings.push(`❌ ARTÍCULO INEXISTENTE: ${artMatch[0]}. ${validation.reason}`);
      processedText = processedText.replace(
        artMatch[0],
        `[artículo inexistente: ${artMatch[0]} — el ordenamiento peruano solo cuenta con ${validation.codeBoundary.maxArticle} artículos en esta norma]`
      );
      processedText += `\n\n> 🔍 **RECTIFICACIÓN NORMATIVA (LEGAL TRUTH ENGINE):** ${validation.reason}\n\n`;
    }
  }

  // 3. Detectar Casaciones Judiciales y cotejar contra registro verificado
  const casacionRegex = /\b(?:Casaci[óo]n|Cas\.)\s*(?:(Laboral|Penal|Civil|Constitucional|Social|Comercial)\s+)?(?:N[°º.]?|Nro\.?|Número)?\s*([0-9]{1,5})[-–/]([0-9]{4})(?:\s*[\/\-]\s*([A-Za-zÁÉÍÓÚáéíóúñÑ]+))?\b/gi;
  let match: RegExpExecArray | null;

  while ((match = casacionRegex.exec(text)) !== null) {
    const specialty = match[1] ? match[1].trim() : '';
    const docketNum = match[2];
    const year = match[3];
    const district = match[4] ? match[4].trim() : '';
    const lookupKey = `${docketNum}-${year}`;
    const rawMatch = match[0];

    const knownDoc = LegalSourceRegistry.getByShortKey(lookupKey);
    const knownVerified = VERIFIED_JURISPRUDENCE_REGISTRY[lookupKey];

    if (knownDoc) {
      // Control de Correspondencia Temática (Ratio Decidendi) y Cita Textual (Round-Trip Grounding)
      const surroundingStart = Math.max(0, match.index - 250);
      const surroundingEnd = Math.min(text.length, match.index + rawMatch.length + 250);
      const surroundingContext = text.slice(surroundingStart, surroundingEnd);
      
      const attribution = LegalSourceRegistry.validateAttribution(lookupKey, surroundingContext);

      if (attribution.isAttributionValid) {
        citations.push({
          raw: rawMatch,
          type: 'casacion',
          normalized: knownDoc.officialNumber,
          status: 'VERIFIED',
          officialSource: knownDoc.issuingEntity,
          detail: `${knownDoc.officialNumber}: ${knownDoc.subject} (${knownDoc.relevantFJ.map(f => f.fjNumber).join(', ')})`,
          citationType: attribution.citationType,
          extractedQuote: attribution.extractedQuote,
          verbatimVerified: attribution.verbatimVerified,
        });
      } else {
        if (attribution.citationType === 'VERBATIM_QUOTE') {
          // Cita textual apócrifa atribuida a una resolución real
          citations.push({
            raw: rawMatch,
            type: 'casacion',
            normalized: knownDoc.officialNumber,
            status: 'CONTRADICTED',
            officialSource: knownDoc.issuingEntity,
            detail: attribution.actualReason,
            citationType: 'VERBATIM_QUOTE',
            extractedQuote: attribution.extractedQuote,
            verbatimVerified: false,
          });
          warnings.push(`❌ CITA TEXTUAL APÓCRIFA: ${rawMatch}. ${attribution.actualReason}`);
          if (attribution.extractedQuote && processedText.includes(attribution.extractedQuote)) {
            processedText = processedText.replace(
              attribution.extractedQuote,
              `[cita textual apócrifa del expediente ${knownDoc.officialNumber} — desclasificada por falta de correspondencia literal]`
            );
          } else {
            processedText = processedText.replace(
              rawMatch,
              `[cita textual apócrifa del expediente ${knownDoc.officialNumber}]`
            );
          }
          processedText += `\n\n> 🔍 **RECTIFICACIÓN JURISPRUDENCIAL (LEGAL TRUTH ENGINE):** ${attribution.actualReason}\n\n`;
        } else {
          // Atribución falsa de fundamento a sentencia real
          citations.push({
            raw: rawMatch,
            type: 'casacion',
            normalized: knownDoc.officialNumber,
            status: 'CONTRADICTED',
            officialSource: knownDoc.issuingEntity,
            detail: attribution.actualReason,
            citationType: attribution.citationType,
            verbatimVerified: false,
          });
          warnings.push(`❌ ATRIBUCIÓN JURISPRUDENCIAL CONTRADICTORIA: ${rawMatch}. ${attribution.actualReason}`);
          processedText = processedText.replace(
            rawMatch,
            `[cita jurisprudencial con atribución temática errónea: ${knownDoc.officialNumber} trata sobre ${knownDoc.subject}]`
          );
          processedText += `\n\n> 🔍 **RECTIFICACIÓN JURISPRUDENCIAL (LEGAL TRUTH ENGINE):** ${attribution.actualReason}\n\n`;
        }
      }
    } else if (knownVerified) {
      citations.push({
        raw: rawMatch,
        type: 'casacion',
        normalized: `Casación ${specialty ? specialty + ' ' : ''}N° ${docketNum}-${year}${district ? '/' + district : ''}`,
        status: 'VERIFIED',
        officialSource: knownVerified.court,
        detail: `${knownVerified.title}: ${knownVerified.subject} (${knownVerified.bindingFJ})`,
        citationType: 'RATIO_PARAPHRASE',
        verbatimVerified: true,
      });
    } else {
      // Casación no registrada en compendio oficial: Marcar como NO VERIFICADA
      citations.push({
        raw: rawMatch,
        type: 'casacion',
        normalized: `Casación ${specialty ? specialty + ' ' : ''}N° ${docketNum}-${year}${district ? '/' + district : ''}`,
        status: 'UNVERIFIED_CLAIM',
        detail: 'Referencia jurisprudencial no contrastada en el compendio oficial de la Corte Suprema.',
      });
      warnings.push(`⚠️ Casación ${rawMatch} no figura en el registro oficial de precedentes vinculantes. Desclasificada a criterio de parte.`);

      // Sanitización preventiva en el cuerpo procesal:
      // Retira el número judicial no contrastado para evitar temeridad procesal y alucinaciones en estrados.
      processedText = processedText.replace(
        rawMatch,
        '[criterio jurisprudencial pendiente de verificación documental]'
      );
    }
  }

  // 3.1. Detectar Sentencias del Tribunal Constitucional (STC) y Precedentes Vinculantes
  const stcRegex = /\b(?:STC\s*(?:Exp\.?\s*(?:N[°º.]?|Nro\.?)?)?\s*([0-9]{1,5})[-–/]([0-9]{4})(?:[-–/]([A-Za-z0-9\/]+))?|(?:Precedente\s+(?:Vinculante\s+)?)?Huatuco|(?:Caso\s+)?Maxco)\b/gi;
  while ((match = stcRegex.exec(text)) !== null) {
    const rawMatch = match[0];
    let lookupKey = '';
    if (/Huatuco/i.test(rawMatch)) {
      lookupKey = '05057-2013';
    } else if (/Maxco/i.test(rawMatch)) {
      lookupKey = '03525-2021';
    } else if (match[1] && match[2]) {
      const docket = match[1].padStart(5, '0');
      lookupKey = `${docket}-${match[2]}`;
      if (!LegalSourceRegistry.getByShortKey(lookupKey)) {
        lookupKey = `${match[1]}-${match[2]}`;
      }
    }

    if (!lookupKey) continue;

    const knownDoc = LegalSourceRegistry.getByShortKey(lookupKey);
    const knownVerified = VERIFIED_JURISPRUDENCE_REGISTRY[lookupKey];

    if (knownDoc) {
      const surroundingStart = Math.max(0, match.index - 250);
      const surroundingEnd = Math.min(text.length, match.index + rawMatch.length + 250);
      const surroundingContext = text.slice(surroundingStart, surroundingEnd);
      
      const attribution = LegalSourceRegistry.validateAttribution(lookupKey, surroundingContext);

      if (attribution.isAttributionValid) {
        citations.push({
          raw: rawMatch,
          type: 'sentencia_tc',
          normalized: knownDoc.officialNumber,
          status: 'VERIFIED',
          officialSource: knownDoc.issuingEntity,
          detail: `${knownDoc.officialNumber}: ${knownDoc.subject} (${knownDoc.relevantFJ.map(f => f.fjNumber).join(', ')})`,
          citationType: attribution.citationType,
          extractedQuote: attribution.extractedQuote,
          verbatimVerified: attribution.verbatimVerified,
        });
      } else {
        if (attribution.citationType === 'VERBATIM_QUOTE') {
          citations.push({
            raw: rawMatch,
            type: 'sentencia_tc',
            normalized: knownDoc.officialNumber,
            status: 'CONTRADICTED',
            officialSource: knownDoc.issuingEntity,
            detail: attribution.actualReason,
            citationType: 'VERBATIM_QUOTE',
            extractedQuote: attribution.extractedQuote,
            verbatimVerified: false,
          });
          warnings.push(`❌ CITA TEXTUAL APÓCRIFA DEL TRIBUNAL CONSTITUCIONAL: ${rawMatch}. ${attribution.actualReason}`);
          if (attribution.extractedQuote && processedText.includes(attribution.extractedQuote)) {
            processedText = processedText.replace(
              attribution.extractedQuote,
              `[cita textual apócrifa del expediente ${knownDoc.officialNumber} — desclasificada por falta de correspondencia literal]`
            );
          } else {
            processedText = processedText.replace(
              rawMatch,
              `[cita textual apócrifa del expediente ${knownDoc.officialNumber}]`
            );
          }
          processedText += `\n\n> 🔍 **RECTIFICACIÓN JURISPRUDENCIAL (LEGAL TRUTH ENGINE):** ${attribution.actualReason}\n\n`;
        } else {
          citations.push({
            raw: rawMatch,
            type: 'sentencia_tc',
            normalized: knownDoc.officialNumber,
            status: 'CONTRADICTED',
            officialSource: knownDoc.issuingEntity,
            detail: attribution.actualReason,
            citationType: attribution.citationType,
            verbatimVerified: false,
          });
          warnings.push(`❌ ATRIBUCIÓN JURISPRUDENCIAL CONTRADICTORIA: ${rawMatch}. ${attribution.actualReason}`);
          processedText = processedText.replace(
            rawMatch,
            `[cita jurisprudencial con atribución temática errónea: ${knownDoc.officialNumber} trata sobre ${knownDoc.subject}]`
          );
          processedText += `\n\n> 🔍 **RECTIFICACIÓN JURISPRUDENCIAL (LEGAL TRUTH ENGINE):** ${attribution.actualReason}\n\n`;
        }
      }
    } else if (knownVerified) {
      citations.push({
        raw: rawMatch,
        type: 'sentencia_tc',
        normalized: knownVerified.title,
        status: 'VERIFIED',
        officialSource: knownVerified.court,
        detail: `${knownVerified.title}: ${knownVerified.subject} (${knownVerified.bindingFJ})`,
        citationType: 'RATIO_PARAPHRASE',
        verbatimVerified: true,
      });
    }
  }

  // 4. Detectar Acuerdos Plenarios
  const apRegex = /\b(?:Acuerdo\s+Plenario|AP)\s*(?:Extraordinario|Ext\.?)?\s*(?:N[°º.]?|Nro\.?)?\s*([0-9]{1,3})[-–/]([0-9]{4})(?:\/([A-Z0-9-]+))?\b/gi;
  while ((match = apRegex.exec(text)) !== null) {
    const apNum = match[1].padStart(2, '0');
    const apYear = match[2];
    const lookupKey = `${apNum}-${apYear}`;
    const rawMatch = match[0];

    const knownDoc = LegalSourceRegistry.getByShortKey(lookupKey);
    const knownVerified = VERIFIED_JURISPRUDENCE_REGISTRY[lookupKey];

    if (knownDoc) {
      const surroundingStart = Math.max(0, match.index - 250);
      const surroundingEnd = Math.min(text.length, match.index + rawMatch.length + 250);
      const surroundingContext = text.slice(surroundingStart, surroundingEnd);

      const attribution = LegalSourceRegistry.validateAttribution(lookupKey, surroundingContext);
      if (attribution.isAttributionValid) {
        citations.push({
          raw: rawMatch,
          type: 'acuerdo_plenario',
          normalized: knownDoc.officialNumber,
          status: 'VERIFIED',
          officialSource: knownDoc.issuingEntity,
          detail: `${knownDoc.subject} (${knownDoc.relevantFJ.map(f => f.fjNumber).join(', ')})`,
          citationType: attribution.citationType,
          extractedQuote: attribution.extractedQuote,
          verbatimVerified: attribution.verbatimVerified,
        });
      } else {
        if (attribution.citationType === 'VERBATIM_QUOTE') {
          citations.push({
            raw: rawMatch,
            type: 'acuerdo_plenario',
            normalized: knownDoc.officialNumber,
            status: 'CONTRADICTED',
            officialSource: knownDoc.issuingEntity,
            detail: attribution.actualReason,
            citationType: 'VERBATIM_QUOTE',
            extractedQuote: attribution.extractedQuote,
            verbatimVerified: false,
          });
          warnings.push(`❌ CITA TEXTUAL APÓCRIFA DE ACUERDO PLENARIO: ${rawMatch}. ${attribution.actualReason}`);
          if (attribution.extractedQuote && processedText.includes(attribution.extractedQuote)) {
            processedText = processedText.replace(
              attribution.extractedQuote,
              `[cita textual apócrifa del ${knownDoc.officialNumber} — desclasificada por falta de correspondencia literal]`
            );
          } else {
            processedText = processedText.replace(
              rawMatch,
              `[cita textual apócrifa del ${knownDoc.officialNumber}]`
            );
          }
          processedText += `\n\n> 🔍 **RECTIFICACIÓN JURISPRUDENCIAL (LEGAL TRUTH ENGINE):** ${attribution.actualReason}\n\n`;
        } else {
          citations.push({
            raw: rawMatch,
            type: 'acuerdo_plenario',
            normalized: knownDoc.officialNumber,
            status: 'CONTRADICTED',
            officialSource: knownDoc.issuingEntity,
            detail: attribution.actualReason,
            citationType: attribution.citationType,
            verbatimVerified: false,
          });
          warnings.push(`❌ ATRIBUCIÓN DE ACUERDO PLENARIO CONTRADICTORIA: ${rawMatch}. ${attribution.actualReason}`);
          processedText = processedText.replace(
            rawMatch,
            `[acuerdo plenario con atribución temática errónea: ${knownDoc.officialNumber} trata sobre ${knownDoc.subject}]`
          );
          processedText += `\n\n> 🔍 **RECTIFICACIÓN JURISPRUDENCIAL (LEGAL TRUTH ENGINE):** ${attribution.actualReason}\n\n`;
        }
      }
    } else if (knownVerified) {
      citations.push({
        raw: rawMatch,
        type: 'acuerdo_plenario',
        normalized: `Acuerdo Plenario N° ${apNum}-${apYear}`,
        status: 'VERIFIED',
        officialSource: knownVerified.court,
        detail: `${knownVerified.title} (${knownVerified.bindingFJ})`,
        citationType: 'RATIO_PARAPHRASE',
        verbatimVerified: true,
      });
    } else {
      citations.push({
        raw: rawMatch,
        type: 'acuerdo_plenario',
        normalized: `Acuerdo Plenario N° ${apNum}-${apYear}`,
        status: 'UNVERIFIED_CLAIM',
        detail: 'Acuerdo Plenario no contrastado en el registro supremo.',
      });
      warnings.push(`⚠️ Acuerdo Plenario ${rawMatch} no figura en el registro oficial. Desclasificado.`);
      processedText = processedText.replace(
        rawMatch,
        '[acuerdo plenario pendiente de verificación documental]'
      );
    }
  }

  // 5. Detectar Plenos Casatorios Civiles (Únicamente I al X) y detectar plenos inexistentes
  const VALID_CIVIL_PLENOS = new Set([
    'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
    '1°', '2°', '3°', '4°', '5°', '6°', '7°', '8°', '9°', '10°',
    'PRIMER', 'SEGUNDO', 'TERCER', 'TERCERO', 'CUARTO', 'QUINTO',
    'SEXTO', 'SÉPTIMO', 'SEPTIMO', 'OCTAVO', 'NOVENO', 'DÉCIMO', 'DECIMO'
  ]);

  const plenoRegex = /\b(?:([I|V|X]+|[0-9]{1,2}[°º]?|primer|segundo|tercer|tercero|cuarto|quinto|sexto|s[ée]ptimo|septimo|octavo|noveno|d[ée]cimo|decimo|und[ée]cimo|duod[ée]cimo)\s+Pleno\s+Casatorio(?:\s+(Civil|Penal|Laboral|Mercantil|Comercial))?|Pleno\s+Casatorio\s+(?:(Civil|Penal|Laboral|Mercantil|Comercial)\s*)?(?:N[°º.]?|Nro\.?)?\s*([0-9]{1,2}|[I|V|X]+)?)\b/gi;
  while ((match = plenoRegex.exec(text)) !== null) {
    const rawMatch = match[0];
    const numPart = (match[1] || match[3] || '').toUpperCase();
    const specialty = (match[2] || '').trim().toLowerCase();

    if (specialty === 'mercantil' || specialty === 'comercial' || rawMatch.toLowerCase().includes('mercantil') || rawMatch.toLowerCase().includes('comercial')) {
      citations.push({
        raw: rawMatch,
        type: 'pleno',
        normalized: rawMatch,
        status: 'UNVERIFIED_CLAIM',
        detail: 'Inexistente en el ordenamiento peruano. No existen Plenos Casatorios Mercantiles o Comerciales; los conflictos patrimoniales y mercantiles se rigen por los Plenos Casatorios Civiles (I al X).',
      });
      warnings.push(`❌ Precedente inexistente: ${rawMatch}. En el Perú no existen Plenos Casatorios Mercantiles.`);
      processedText = processedText.replace(
        rawMatch,
        '[criterio jurisprudencial pendiente de verificación documental: en el Perú no existen Plenos Casatorios Mercantiles/Comerciales]'
      );
    } else if (VALID_CIVIL_PLENOS.has(numPart)) {
      citations.push({
        raw: rawMatch,
        type: 'pleno',
        normalized: `${numPart} Pleno Casatorio Civil`,
        status: 'VERIFIED',
        officialSource: 'Corte Suprema de Justicia de la República',
        detail: 'Precedente Vinculante de la Corte Suprema de Justicia del Perú (I al X Pleno Casatorio Civil)',
      });
    } else {
      // Pleno inexistente (XI, XII, o número fuera del rango oficial I-X)
      citations.push({
        raw: rawMatch,
        type: 'pleno',
        normalized: rawMatch,
        status: 'UNVERIFIED_CLAIM',
        detail: 'Precedente inexistente. La Corte Suprema de Justicia del Perú únicamente ha emitido diez (X) Plenos Casatorios Civiles vinculantes.',
      });
      warnings.push(`⚠️ Precedente no verificado: ${rawMatch}. La Corte Suprema solo ha emitido X Plenos Casatorios Civiles.`);
      processedText = processedText.replace(
        rawMatch,
        '[criterio jurisprudencial pendiente de verificación documental: la Corte Suprema solo cuenta con X Plenos Casatorios Civiles]'
      );
    }
  }

  // 5.1. Detectar Plenos Jurisdiccionales (Distritales, Regionales, Nacionales)
  const plenoJurisdiccionalRegex = /\b(?:Pleno\s+Jurisdiccional\s+(?:Nacional|Distrital|Regional|Laboral|Civil|Penal|Comercial|de\s+Familia)?(?:\s+(?:de|del)?\s*([0-9]{4}))?)\b/gi;
  while ((match = plenoJurisdiccionalRegex.exec(text)) !== null) {
    const rawMatch = match[0];
    const yearPart = match[1] || '';
    const lookupKey = `PJ-${yearPart}`;
    const knownDoc = LegalSourceRegistry.getByShortKey(lookupKey);

    if (knownDoc) {
      citations.push({
        raw: rawMatch,
        type: 'pleno',
        normalized: rawMatch,
        status: 'VERIFIED',
        officialSource: 'Poder Judicial del Perú',
        detail: knownDoc.subject,
      });
    } else {
      citations.push({
        raw: rawMatch,
        type: 'pleno',
        normalized: rawMatch,
        status: 'UNVERIFIED_CLAIM',
        detail: 'Pleno Jurisdiccional no contrastado en el registro oficial del Poder Judicial.',
      });
      warnings.push(`⚠️ Pleno Jurisdiccional ${rawMatch} no verificado oficialmente.`);
      processedText = processedText.replace(
        rawMatch,
        '[criterio jurisprudencial pendiente de verificación documental]'
      );
    }
  }

  // 5.2. Detectar Resoluciones Administrativas, Directivas y del Tribunal Fiscal (RTF, OEFA, Directivas OECE/OSCE)
  const adminRegex = /\b(?:RTF\s*(?:N[°º.]?|Nro\.?)?\s*([0-9]{1,6}(?:[-–][0-9]{1,2})?[-–][0-9]{4})|Resoluci[óo]n\s+(?:del\s+Tribunal\s+Fiscal|de\s+OEFA|del\s+TFA|de\s+INDECOPI)\s*N[°º.]?\s*([0-9A-Za-z\/\-]+)|Directiva\s*(?:OECE|OSCE)\s*N[°º.]?\s*([0-9]{1,4}[-–/][0-9]{4}(?:[-–][A-Za-z0-9]+)?))\b/gi;
  while ((match = adminRegex.exec(text)) !== null) {
    const rawMatch = match[0];
    const key = match[1] || match[2] || match[3] || '';
    const knownDoc = LegalSourceRegistry.getByShortKey(key);

    if (knownDoc) {
      citations.push({
        raw: rawMatch,
        type: 'resolucion_administrativa',
        normalized: knownDoc.officialNumber,
        status: 'VERIFIED',
        officialSource: knownDoc.issuingEntity,
        detail: knownDoc.subject,
      });
    } else {
      citations.push({
        raw: rawMatch,
        type: 'resolucion_administrativa',
        normalized: rawMatch,
        status: 'UNVERIFIED_CLAIM',
        detail: 'Resolución o directiva administrativa no contrastada en el registro oficial.',
      });
      warnings.push(`⚠️ Acto administrativo ${rawMatch} no contrastado documentalmente.`);
      processedText = processedText.replace(
        rawMatch,
        '[criterio jurisprudencial pendiente de verificación documental]'
      );
    }
  }

  // 6. Si hay citas de casación catalogadas como UNVERIFIED_CLAIM, anexar la nota de advertencia al final si no existe
  const unverifiedCitations = citations.filter((c) => c.status === 'UNVERIFIED_CLAIM');
  if (unverifiedCitations.length > 0 && !processedText.includes('NOTA DE RIGOR Y AUDITORÍA PROCESAL')) {
    const disclaimer = `\n\n> ⚖️ **NOTA DE RIGOR Y AUDITORÍA PROCESAL (ESTÁNDAR HARDMAN):**\n` +
      unverifiedCitations.map(u => `> • **${u.raw}:** Esta referencia no cuenta con verificación documental en el registro oficial de precedentes vinculantes de la Corte Suprema. Al no existir fuente comprobable del expediente citado, se ha desclasificado y retirado el número judicial para evitar temeridad procesal, debiendo sustentarse la pretensión directamente en las normas legales aplicables.\n`).join('');
    processedText = processedText + disclaimer;
  }

  const verifiedCount = citations.filter((c) => c.status === 'VERIFIED').length;
  const unverifiedCount = citations.filter((c) => c.status === 'UNVERIFIED_CLAIM').length;
  const repealedCount = citations.filter((c) => c.status === 'REPEALED_NORM').length;

  return {
    summary: {
      totalCitations: citations.length,
      verifiedCitations: verifiedCount,
      unverifiedCitations: unverifiedCount,
      repealedWarnings: repealedCount,
      citations,
    },
    processedText,
    hasBlockingErrors: citations.some((c) => c.status === 'CONTRADICTED'),
    warnings,
  };
}
