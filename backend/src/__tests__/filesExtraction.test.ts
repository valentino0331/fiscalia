import { describe, it, expect } from 'vitest';
import { extractLegalMetadata, extractDatesFromText, detectContradictionsAcrossFiles } from '../lib/legalMetadata';

describe('Legal Metadata and Expediente Extraction', () => {
  it('extracts penal expediente, fiscal authority and routes to Sebastian', () => {
    const text = `
SEÑOR FISCAL DE LA CUARTA FISCALÍA PROVINCIAL PENAL CORPORATIVA DE AREQUIPA
CARPETA FISCAL N° 506014502-2026-112-0
IMPUTADO: JUAN PÉREZ
DELITO: ESTAFA AGRAVADA

DISPOSICIÓN N° 01-2026:
Se dispone la formalización y continuación de la investigación preparatoria bajo apercibimiento de ley.
Se cita al imputado para su declaración indagatoria bajo apercibimiento de conducción compulsiva.
`;

    const meta = extractLegalMetadata(text);
    expect(meta.detectedExpediente).toContain('506014502-2026-112-0');
    expect(meta.materia).toContain('Penal');
    expect(meta.recommendedAgentId).toBe('sebastian');
    expect(meta.alertLevel).toBe('red');
    expect(meta.actionSteps.length).toBeGreaterThan(0);
  });

  it('extracts laboral preaviso de despido and routes to Valentina', () => {
    const text = `
EXPEDIENTE N° 02450-2026-0-1801-JR-LA-02
SEÑOR: CARLOS HUAMÁN
CARTA DE PREAVISO DE DESPIDO POR FALTA GRAVE
Le comunicamos que al amparo del Art. 31 del D.S. 003-97-TR se le otorga el plazo legal de 6 días naturales para formular sus descargos por escrito ante Sunafil y la gerencia.
`;

    const meta = extractLegalMetadata(text);
    expect(meta.detectedExpediente).toBe('02450-2026-0-1801-JR-LA-02');
    expect(meta.materia).toBe('Derecho Laboral');
    expect(meta.recommendedAgentId).toBe('valentina');
    expect(meta.alertLevel).toBe('red');
    expect(meta.deadlineText).toContain('6 días naturales');
  });

  it('extracts coactivo tributario and routes to Fernanda', () => {
    const text = `
SUPERINTENDENCIA NACIONAL DE ADUANAS Y DE ADMINISTRACIÓN TRIBUTARIA - SUNAT
EXPEDIENTE COACTIVO N° 0110060012345-2026
RESOLUCIÓN DE EJECUCIÓN COACTIVA N° 01
Se trabará embargo en forma de retención sobre las cuentas bancarias si no cancela en 7 días hábiles.
`;

    const meta = extractLegalMetadata(text);
    expect(meta.materia).toContain('Tributario');
    expect(meta.recommendedAgentId).toBe('fernanda');
    expect(meta.alertLevel).toBe('red');
    expect(meta.deadlineText).toContain('7 días hábiles');
  });

  it('extracts alimentos and routes to Camila', () => {
    const text = `
PRIMER JUZGADO DE PAZ LETRADO DE SURCO
EXP. N° 00412-2026-0-1801-JP-FC-01
MATERIA: ALIMENTOS Y TENENCIA
Se corre traslado de la demanda de pensión de alimentos por el plazo de 5 días hábiles.
`;

    const meta = extractLegalMetadata(text);
    expect(meta.materia).toBe('Derecho de Familia');
    expect(meta.recommendedAgentId).toBe('camila');
    expect(meta.deadlineText).toContain('5 días hábiles');
  });

  it('extractDatesFromText extrae fechas en formatos jurídicos peruanos numéricos y textuales', () => {
    const text = `
    Notificado el 12/03/2026 mediante Cédula Judicial N° 849.
    Audiencia programada para el 24 de mayo de 2026 ante la Sala Penal.
    Se interpuso recurso el 05-04-2026.
    `;
    const dates = extractDatesFromText(text);
    expect(dates).toContain('12/03/2026');
    expect(dates).toContain('24 de mayo de 2026');
    expect(dates).toContain('05-04-2026');
  });

  it('detectContradictionsAcrossFiles identifica discrepancias de expedientes y sedes en lotes de archivos', () => {
    const filesMeta = [
      {
        fileName: 'demanda_principal.pdf',
        meta: {
          detectedExpediente: '01234-2026-0-1801-JR-CI-01',
          detectedAuthority: '1° Juzgado Civil de Lima',
          materia: 'Derecho Civil',
        },
        dates: ['10/01/2026'],
      },
      {
        fileName: 'medida_cautelar.pdf',
        meta: {
          detectedExpediente: '09876-2026-0-1801-JR-CI-02',
          detectedAuthority: '2° Sala Civil de Lima',
          materia: 'Derecho Civil',
        },
        dates: ['15/02/2026'],
      },
    ];

    const contradictions = detectContradictionsAcrossFiles(filesMeta);
    expect(contradictions.length).toBe(2);
    expect(contradictions[0]).toContain('DISCREPANCIA DE EXPEDIENTE');
    expect(contradictions[0]).toContain('01234-2026-0-1801-JR-CI-01');
    expect(contradictions[0]).toContain('09876-2026-0-1801-JR-CI-02');
    expect(contradictions[1]).toContain('MÚLTIPLES SEDES JUDICIALES/FISCALES');
  });
});
