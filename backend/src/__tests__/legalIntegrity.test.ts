import { describe, it, expect } from 'vitest';
import { SYSTEM_PROMPTS } from '../prompts/agents.js';
import { JURISPRUDENCE_COMPENDIUM, NORMATIVE_REFORMS_COMPENDIUM } from '../lib/spijLegalEngine.js';

describe('Audit 2026: Integridad Normativa y Anti-Alucinación de los 8 Abogados', () => {
  const agentKeys = ['sebastian', 'valentina', 'diego', 'camila', 'marco', 'fernanda', 'adriana', 'rodrigo'];

  it('debe contener los prompts activos para exactamente los 8 especialistas de Hardman', () => {
    agentKeys.forEach((key) => {
      expect(SYSTEM_PROMPTS[key], `Falta el prompt para el especialista: ${key}`).toBeDefined();
      expect(SYSTEM_PROMPTS[key].length).toBeGreaterThan(1000);
    });
  });

  it('todos los 8 especialistas deben incluir reglas estrictas de anti-alucinación', () => {
    agentKeys.forEach((key) => {
      const prompt = SYSTEM_PROMPTS[key];
      const hasAntiH =
        prompt.includes('ANTI-ALUCINACIÓN') ||
        prompt.includes('CERO INVENTOS') ||
        prompt.includes('REGLAS DOGMÁTICAS INQUEBRANTABLES');
      expect(hasAntiH, `El especialista ${key} no cuenta con sección explícita anti-alucinación`).toBe(true);
      expect(prompt).toContain('NUNCA:');
      expect(prompt).toContain('SIEMPRE:');
    });
  });

  describe('Sebastián — Derecho Penal y Procesal Penal (Cero Alucinación)', () => {
    const sebastianPrompt = SYSTEM_PROMPTS['sebastian'];

    it('debe contener con exactitud los Acuerdos Plenarios de la Corte Suprema', () => {
      // Control de acusación intermedia: AP 06-2009/CJ-116
      expect(sebastianPrompt).toContain('AP 06-2009/CJ-116');
      expect(sebastianPrompt).toContain('control formal y sustancial de la acusación en etapa intermedia');

      // Tutela de derechos e imputación suficiente: AP Ext. 02-2012/CJ-116
      expect(sebastianPrompt).toContain('AP Ext. 02-2012/CJ-116');
      expect(sebastianPrompt).toContain('tutela de derechos e imputación suficiente en formalización');

      // Prisión preventiva y sospecha fuerte: AP 01-2019/CIJ-116
      expect(sebastianPrompt).toContain('AP 01-2019/CIJ-116');

      // Tutela de derechos residual: AP 04-2010/CJ-116
      expect(sebastianPrompt).toContain('AP 04-2010/CJ-116');

      // Inaplicabilidad de Ley Soto: AP 05-2023/CIJ-112
      expect(sebastianPrompt).toContain('AP 05-2023/CIJ-112');

      // Lavado de activos y autonomía: AP 03-2010/CJ-116
      expect(sebastianPrompt).toContain('AP 03-2010/CJ-116');

      // Proceso inmediato y flagrancia: AP Ext. 02-2016/CIJ-116
      expect(sebastianPrompt).toContain('AP Ext. 02-2016/CIJ-116');

      // Control de plazos diligencias preliminares: Casación Vinculante 02-2008/La Libertad
      expect(sebastianPrompt).toContain('Casación Vinculante 02-2008/La Libertad');
    });

    it('está terminantemente prohibido atribuir el derecho de defensa técnica al Art. 62° del NCPP', () => {
      // Art. 62 NCPP es exclusión del fiscal. Defensa técnica son Arts. IX T.P., 71.2.c y 80-85 NCPP.
      expect(sebastianPrompt).toContain('PROHIBIDO RADICALMENTE citar el Artículo 62° como "derecho a la defensa técnica"');
      expect(sebastianPrompt).toContain('ARTÍCULO 62° ES LA EXCLUSIÓN DEL FISCAL');
      expect(sebastianPrompt).toContain('ARTÍCULO IX DEL TÍTULO PRELIMINAR');
      expect(sebastianPrompt).toContain('ARTÍCULO 71° NUMERAL 2 LITERAL C)');
      expect(sebastianPrompt).toContain('ARTÍCULOS 80° AL 85° DEL NCPP');
    });

    it('debe registrar el umbral penal del D. Leg. 1585 para prisión preventiva (> 5 años)', () => {
      expect(sebastianPrompt).toContain('D.Leg. 1585');
      expect(sebastianPrompt).toContain('5 años');
    });
  });

  describe('Valentina — Derecho Laboral (Normas 2026 y Ley 32155)', () => {
    const valentinaPrompt = SYSTEM_PROMPTS['valentina'];

    it('debe exigir la Remuneración Mínima Vital de S/ 1,230.00 y Asignación de S/ 123.00 (D.S. 015-2026-TR)', () => {
      expect(valentinaPrompt).toContain('D.S. N° 015-2026-TR');
      expect(valentinaPrompt).toContain('S/ 1,230.00');
      expect(valentinaPrompt).toContain('S/ 123.00');
      expect(valentinaPrompt).toContain('Usar la RMV antigua de S/ 1,130');
    });

    it('debe aplicar la competencia de Paz Letrado Laboral reformada por Ley 32155 (hasta 70 URP)', () => {
      expect(valentinaPrompt).toContain('Ley N° 32155');
      expect(valentinaPrompt).toContain('70 URP');
      expect(valentinaPrompt).toContain('S/ 38,500.00');
      expect(valentinaPrompt).toContain('60 URP');
      expect(valentinaPrompt).toContain('S/ 33,000.00');
    });

    it('debe alertar que la vía inspectiva ante SUNAFIL no suspende la caducidad judicial de 30 días hábiles', () => {
      expect(valentinaPrompt).toContain('SUNAFIL NO interrumpe ni suspende el plazo');
      expect(valentinaPrompt).toContain('30 días hábiles');
      expect(valentinaPrompt).toContain('Art. 36° del D.S. N° 003-97-TR');
    });

    it('no debe contener texto penal arrastrado por error en su prompt', () => {
      expect(valentinaPrompt).not.toContain('INCIDENCIA PREVIA DE INEFICACIA PROCESAL Y NULIDAD ABSOLUTA (Art. 150.d)');
    });
  });

  describe('Diego — Derecho Civil y Procesal Civil (Cuantías y Artículos Exactos)', () => {
    const diegoPrompt = SYSTEM_PROMPTS['diego'];

    it('debe operar con la URP 2026 de S/ 550.00 (10% de la UIT 2026 S/ 5,500)', () => {
      expect(diegoPrompt).toContain('URP 2026 = S/ 550.00');
      expect(diegoPrompt).not.toContain('URP 2026 = S/ 535.00');
    });

    it('debe calcular las cuantías exactas de vías procedimentales', () => {
      expect(diegoPrompt).toContain('Monto > 1,000 URP (> S/ 550,000)');
      expect(diegoPrompt).toContain('S/ 55,000 a S/ 550,000');
      expect(diegoPrompt).toContain('Monto ≤ 100 URP (≤ S/ 55,000)');
      expect(diegoPrompt).toContain('monto ≤ 50 URP (≤ S/ 27,500)');
    });

    it('debe distinguir taxativamente el Art. 721° CPC para mandato de 3 días en ejecución de garantías', () => {
      expect(diegoPrompt).toContain('el mandato de ejecución con plazo de 3 días bajo apercibimiento de remate es el Art. 721° CPC');
      expect(diegoPrompt).toContain('PROHIBIDO atribuir los 3 días al Art. 720°');
    });

    it('debe distinguir taxativamente la indignidad (Art. 667° CC) de la libre disposición (Art. 725° CC)', () => {
      expect(diegoPrompt).toContain('EXCLUSIÓN DE LA SUCESIÓN POR INDIGNIDAD');
      expect(diegoPrompt).toContain('¡ES EL ARTÍCULO 667° DEL CÓDIGO CIVIL (modificado por Ley N° 31643)!');
      expect(diegoPrompt).toContain('¡ES EL ARTÍCULO 725° DEL CÓDIGO CIVIL!');
      expect(diegoPrompt).toContain('PROHIBICIÓN EXPRESA: NUNCA atribuyas las causales de indignidad al Artículo 725°');
    });
  });

  describe('Camila — Derecho de Familia (Interés Superior y Ley 31590)', () => {
    const camilaPrompt = SYSTEM_PROMPTS['camila'];

    it('debe consagrar la Tenencia Compartida como regla general preferente sin favoritismo maternal automático', () => {
      expect(camilaPrompt).toContain('Ley N° 31590');
      expect(camilaPrompt).toContain('Tenencia Compartida');
      expect(camilaPrompt).toContain('NUNCA:');
      expect(camilaPrompt).toContain('preferencia o favoritismo maternal automático');
    });

    it('debe validar la gratuidad y demanda de alimentos sin firma obligatoria de abogado (Ley 31464 / Art. 562 CPC)', () => {
      expect(camilaPrompt).toContain('Ley 31464');
      expect(camilaPrompt).toContain('Art. 562° CPC');
      expect(camilaPrompt).toContain('asignación anticipada');
    });

    it('debe contemplar el apercibimiento judicial de declaración de paternidad en filiación (Ley 28457 / Ley 30628)', () => {
      expect(camilaPrompt).toContain('Ley 28457');
      expect(camilaPrompt).toContain('declaración judicial de paternidad en filiación extramatrimonial');
    });
  });

  describe('Adriana — Derecho Corporativo y M&A (LGS y SIGM)', () => {
    const adrianaPrompt = SYSTEM_PROMPTS['adriana'];

    it('debe confirmar que el directorio en SAC es facultativo bajo el Art. 247° LGS', () => {
      expect(adrianaPrompt).toContain('Art. 247° LGS');
      expect(adrianaPrompt).toContain('directorio es facultativo');
    });

    it('debe exigir el D.L. 1400 y el SIGM para garantías mobiliarias, prohibiendo la Ley 28677', () => {
      expect(adrianaPrompt).toContain('D.L. N° 1400');
      expect(adrianaPrompt).toContain('SIGM');
      expect(adrianaPrompt).toContain('Citar la derogada Ley 28677 para garantías mobiliarias');
    });

    it('debe aplicar los umbrales de control de concentraciones de la Ley 31112 ante INDECOPI', () => {
      expect(adrianaPrompt).toContain('Ley 31112');
      expect(adrianaPrompt).toContain('118,000');
      expect(adrianaPrompt).toContain('18,000');
    });
  });

  describe('Fernanda — Derecho Tributario (Código Tributario y Precedente Maxco)', () => {
    const fernandaPrompt = SYSTEM_PROMPTS['fernanda'];

    it('debe prohibir exigir pago previo para reclamar en 20 días hábiles o apelar en 15 días hábiles', () => {
      expect(fernandaPrompt).toContain('Art. 137° Código Tributario');
      expect(fernandaPrompt).toContain('Art. 146° Código Tributario');
      expect(fernandaPrompt).toContain('Exigir pago previo ni afianzamiento');
    });

    it('debe acatar el Precedente Vinculante Maxco (STC 03525-2021-PA/TC) sobre intereses moratorios', () => {
      expect(fernandaPrompt).toContain('STC Exp. N° 03525-2021-PA/TC');
      expect(fernandaPrompt).toContain('Maxco');
      expect(fernandaPrompt).toContain('prohibido que SUNAT liquide o cobre intereses moratorios');
    });

    it('debe aplicar el TUO LPAG D.S. 006-2026-JUS y bancarización D.L. 1529', () => {
      expect(fernandaPrompt).toContain('D.S. N° 006-2026-JUS');
      expect(fernandaPrompt).toContain('D.L. 1529');
    });
  });

  describe('Marco — Derecho Administrativo y Contrataciones Públicas (Ley 32069)', () => {
    const marcoPrompt = SYSTEM_PROMPTS['marco'];

    it('debe aplicar la Ley 32069 y prohibir la derogada Ley 30225 y al OSCE', () => {
      expect(marcoPrompt).toContain('Ley N° 32069');
      expect(marcoPrompt).toContain('OECE');
      expect(marcoPrompt).toContain('Citar la Ley 30225 ni al OSCE: formalmente derogados');
    });

    it('debe aplicar el TUO LPAG D.S. 006-2026-JUS y respetar los plazos del PAS', () => {
      expect(marcoPrompt).toContain('D.S. N° 006-2026-JUS');
      expect(marcoPrompt).toContain('caducidad perentorio de 9 meses');
      expect(marcoPrompt).toContain('prescripción de 4 años');
    });

    it('debe exigir la JPRD obligatoria en obras públicas antes de arbitraje', () => {
      expect(marcoPrompt).toContain('JPRD');
      expect(marcoPrompt).toContain('Directiva 002-2025-OECE/CD');
    });

    it('debe emplear la plataforma oficial PLADICOP y no la denominación preliminar PlaciEx', () => {
      expect(marcoPrompt).toContain('PLADICOP');
      expect(marcoPrompt).not.toContain('PlaciEx');
    });
  });

  describe('Rodrigo — Derecho Minero y Ambiental', () => {
    const rodrigoPrompt = SYSTEM_PROMPTS['rodrigo'];

    it('debe exigir acuerdo de tierras o servidumbre minera (Art. 7° Ley 26505)', () => {
      expect(rodrigoPrompt).toContain('servidumbre legal');
      expect(rodrigoPrompt).toContain('Ley 26505');
    });

    it('debe contemplar el marco REINFO y la graduación de multas del OEFA', () => {
      expect(rodrigoPrompt).toContain('REINFO');
      expect(rodrigoPrompt).toContain('OEFA');
    });

    it('debe consagrar el TUO LPAG D.S. 006-2026-JUS en sus modelos oficiales y prohibir el derogado D.S. 004-2019-JUS', () => {
      expect(rodrigoPrompt).toContain('D.S. 006-2026-JUS');
      expect(rodrigoPrompt).toContain('NUNCA cites el D.S. 004-2019-JUS');
    });
  });

  describe('Compendio SPIJ y Precedentes Vinculantes (spijLegalEngine.ts)', () => {
    it('debe registrar la reforma de RMV a S/ 1,230.00 en el compendio SPIJ', () => {
      const rmvEntry = NORMATIVE_REFORMS_COMPENDIUM.find((r) => r.lawCode.includes('015-2026-TR'));
      expect(rmvEntry).toBeDefined();
      expect(rmvEntry?.articles).toContain('RMV S/ 1,230');
      expect(rmvEntry?.articles).toContain('Asignación Familiar S/ 123');
    });

    it('debe registrar todos los Acuerdos Plenarios penales vinculantes', () => {
      const codes = JURISPRUDENCE_COMPENDIUM.map((j) => j.code);
      expect(codes).toContain('Acuerdo Plenario N° 01-2019/CIJ-116');
      expect(codes).toContain('Acuerdo Plenario N° 02-2005/CJ-116');
      expect(codes).toContain('Acuerdo Plenario N° 04-2005/CJ-116');
      expect(codes).toContain('Acuerdo Plenario N° 05-2023/CIJ-112');
      expect(codes).toContain('Acuerdo Plenario Extraordinario N° 02-2016/CIJ-116');
      expect(codes).toContain('Acuerdo Plenario N° 04-2010/CJ-116');
      expect(codes).toContain('Casación Vinculante N° 02-2008/La Libertad');
      expect(codes).toContain('Acuerdo Plenario N° 06-2009/CJ-116');
      expect(codes).toContain('Acuerdo Plenario Extraordinario N° 02-2012/CJ-116');
      expect(codes).toContain('Acuerdo Plenario N° 03-2010/CJ-116');
      expect(codes).toContain('Acuerdo Plenario N° 05-2009/CJ-116');
    });
  });
});
