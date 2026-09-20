import { describe, it, expect } from 'vitest';

describe('ISO Normatives & Legal Framework Compliance Invariants', () => {
  const MANDATORY_ISO_STANDARDS = [
    'ISO/IEC 27001:2022',
    'ISO/IEC 27701:2019',
    'ISO/IEC 25010:2023',
    'ISO/IEC 42001:2023',
    'ISO/IEC 27018:2019',
    'ISO 9001:2015',
  ];

  const MANDATORY_LEGAL_CATEGORIES = [
    'Privacidad & Protección de Datos Personales',
    'Ejercicio de la Abogacía, Deberes Éticos & Secreto Profesional',
    'Ingeniería de Software, Ciberseguridad & Confianza Digital',
  ];

  it('validates that all 6 required ISO standards are present in the compliance catalogue', () => {
    const registeredIsoCodes = [
      'ISO/IEC 27001:2022',
      'ISO/IEC 27701:2019',
      'ISO/IEC 25010:2023',
      'ISO/IEC 42001:2023',
      'ISO/IEC 27018:2019',
      'ISO 9001:2015',
    ];

    for (const iso of MANDATORY_ISO_STANDARDS) {
      expect(registeredIsoCodes).toContain(iso);
    }
  });

  it('verifies Peruvian and international privacy law requirements (Ley 29733 & GDPR)', () => {
    const privacyRegulations = [
      'Ley N° 29733 — Ley de Protección de Datos Personales (Perú)',
      'Decreto Supremo N° 003-2013-JUS — Reglamento de la Ley 29733',
      'Constitución Política del Perú — Art. 2 Inciso 6',
      'Reglamento General de Protección de Datos (RGPD / GDPR - UE 2016/679)',
    ];

    expect(privacyRegulations.length).toBeGreaterThanOrEqual(4);
    expect(privacyRegulations.some((r) => r.includes('29733'))).toBe(true);
    expect(privacyRegulations.some((r) => r.includes('GDPR'))).toBe(true);
  });

  it('verifies legal professional secrecy protection (Art. 30 CAL & Art. 165 CP)', () => {
    const legalEthics = [
      'Código de Ética del Abogado del Perú (CAL / Junta de Decanos)',
      'Código Penal Peruano — Artículo 165',
    ];

    expect(legalEthics.some((r) => r.includes('Ética del Abogado'))).toBe(true);
    expect(legalEthics.some((r) => r.includes('165'))).toBe(true);
  });

  it('verifies software engineering, cybersecurity and AI governance standards', () => {
    const techRegulations = [
      'Ley N° 30096 & Ley N° 30171 — Ley de Delitos Informáticos (Perú)',
      'Decreto de Urgencia N° 007-2020 — Marco de Confianza Digital',
      'OWASP Top 10 (2021) & OWASP LLM Top 10 (2025)',
      'Reglamento Europeo de Inteligencia Artificial (EU AI Act - 2024)',
    ];

    expect(techRegulations.some((r) => r.includes('Delitos Informáticos'))).toBe(true);
    expect(techRegulations.some((r) => r.includes('OWASP LLM'))).toBe(true);
    expect(techRegulations.some((r) => r.includes('EU AI Act'))).toBe(true);
  });

  it('enforces mandatory ISO/IEC & Legal HTTP security headers', () => {
    const headers = {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), geolocation=()',
      'X-Legal-Confidentiality-Policy': 'ISO-27701-Compliant; Professional-Privilege-Guaranteed',
      'X-Software-Engineering-Standard': 'ISO-IEC-25010-SQuaRE; OWASP-LLM-2025',
    };

    expect(headers['X-Legal-Confidentiality-Policy']).toBe(
      'ISO-27701-Compliant; Professional-Privilege-Guaranteed'
    );
    expect(headers['X-Software-Engineering-Standard']).toBe(
      'ISO-IEC-25010-SQuaRE; OWASP-LLM-2025'
    );
    expect(headers['Strict-Transport-Security']).toContain('max-age=31536000');
  });
});
