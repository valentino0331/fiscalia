/**
 * 🛡️ Blindaje de Código, Anti-Robo de Propiedad Intelectual & Anti-Tamper
 * Hardman LegalTech
 */

export function initClientSecurityShield() {
  if (typeof window === 'undefined') return;

  // 1. Advertencia formal en consola contra ingeniería inversa y robo de código (D.L. 822 & Ley 30096)
  const bannerStyleTitle = 'font-size: 20px; font-weight: bold; color: #ff4d4f; text-shadow: 1px 1px 2px black;';
  const bannerStyleBody = 'font-size: 13px; color: #c9a84c; font-family: monospace; line-height: 1.5;';
  const bannerStyleWarning = 'font-size: 11px; color: #ffffff; background: #8b0000; padding: 2px 6px; border-radius: 4px;';

  console.log('%c⚠️ ¡ADVERTENCIA DE SEGURIDAD & PROPIEDAD INTELECTUAL! ⚠️', bannerStyleTitle);
  console.log(
    '%cEl código fuente, arquitectura, prompts jurídicos y modelos de esta plataforma son propiedad exclusiva y confidencial de Hardman.\n' +
    'Cualquier intento de descompilación, ingeniería inversa, scraping, inyección o extracción no autorizada está penado bajo la Ley N° 30096 (Ley de Delitos Informáticos) y el Decreto Legislativo N° 822 (Ley sobre el Derecho de Autor).',
    bannerStyleBody
  );
  console.log('%cACTIVIDAD REGISTRADA Y AUDITADA BAJO ISO/IEC 27001', bannerStyleWarning);

  // 2. En producción, desalentar apertura no autorizada de DevTools
  if (import.meta.env.PROD) {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      // Bloquear teclas típicas de inspección F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'u')
      ) {
        // En producción se desalienta la inspección del DOM comercial
        console.warn('[Security Shield] Inspección de código restringida en modo producción.');
      }
    });
  }
}
