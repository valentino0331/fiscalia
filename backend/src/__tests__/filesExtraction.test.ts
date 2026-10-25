import { describe, it, expect } from 'vitest';
import { extractLegalMetadata } from '../lib/legalMetadata';

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
});
