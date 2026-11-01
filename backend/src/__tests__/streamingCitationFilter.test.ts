import { describe, it, expect } from 'vitest';
import { StreamingCitationFilter } from '../ai/streamingCitationFilter';

describe('Streaming Citation Filter — Validación en Tiempo Real (SSE)', () => {
  it('permite el paso fluido de texto normal sin latencia', () => {
    let output = '';
    const filter = new StreamingCitationFilter((chunk) => {
      output += chunk;
    });

    filter.processChunk('Estimado doctor, con relación a su consulta procesal, ');
    filter.processChunk('le informo que los plazos procesales corren a partir del día siguiente.');
    filter.flush();

    expect(output).toBe(
      'Estimado doctor, con relación a su consulta procesal, le informo que los plazos procesales corren a partir del día siguiente.'
    );
    expect(filter.getUnverifiedCitations().length).toBe(0);
  });

  it('permite el paso de una Casación Verificada (Casación 4618-2007) sin alteración', () => {
    let output = '';
    const filter = new StreamingCitationFilter((chunk) => {
      output += chunk;
    });

    filter.processChunk('Conforme a la ');
    filter.processChunk('Casación N° 4618-2007/Lima, ');
    filter.processChunk('procede la indemnización al cónyuge más perjudicado.');
    filter.flush();

    expect(output).toContain('Casación N° 4618-2007/Lima');
    expect(output).toContain('procede la indemnización');
    expect(filter.getUnverifiedCitations().length).toBe(0);
  });

  it('intercepta y sanitiza una Casación Inexistente antes de que llegue al usuario', () => {
    let output = '';
    const filter = new StreamingCitationFilter((chunk) => {
      output += chunk;
    });

    filter.processChunk('Se debe invocar la ');
    filter.processChunk('Casación N° 99999-2025/Lima, ');
    filter.processChunk('para sustentar la pretensión.');
    filter.flush();

    // Comprobar que en el cuerpo del escrito el número judicial inventado fue sustituido
    const [bodyText, disclaimerText] = output.split('> ⚖️');
    expect(bodyText).not.toContain('99999-2025');
    expect(bodyText).not.toContain('la doctrina jurisprudencial uniforme');
    expect(bodyText).toContain('[criterio jurisprudencial pendiente de verificación documental]');
    
    // Comprobar que al final se anexa la nota de rigor explicando la limitación
    expect(disclaimerText).toContain('NOTA DE RIGOR Y AUDITORÍA PROCESAL (ESTÁNDAR HARDMAN)');
    expect(disclaimerText).toContain('Casación N° 99999-2025/Lima');
    expect(filter.getUnverifiedCitations()).toContain('Casación N° 99999-2025/Lima');
  });

  it('gestiona correctamente la partición de tokens de citación entre chunks continuos', () => {
    let output = '';
    const filter = new StreamingCitationFilter((chunk) => {
      output += chunk;
    });

    // Simular corte de tokens en streaming LLM: "Cas" | "ación" | " N° 8888" | "-2024/Cusco."
    filter.processChunk('Revisar la Cas');
    filter.processChunk('ación N° 8888');
    filter.processChunk('-2024/Cusco, ');
    filter.processChunk('la cual resuelve la apelación.');
    filter.flush();

    const [bodyText, disclaimerText] = output.split('> ⚖️');
    expect(bodyText).not.toContain('8888-2024');
    expect(bodyText).toContain('[criterio jurisprudencial pendiente de verificación documental]');
    expect(disclaimerText).toContain('NOTA DE RIGOR Y AUDITORÍA PROCESAL');
    expect(filter.getUnverifiedCitations().length).toBe(1);
  });
});
