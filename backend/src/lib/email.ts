interface WelcomeEmailParams {
  to: string;
  name?: string | null;
  plan: 'junior' | 'senior';
  password?: string;
  loginUrl: string;
}

interface SubscriptionUpdatedEmailParams {
  to: string;
  name?: string | null;
  plan: 'junior' | 'senior';
  loginUrl: string;
}

const RESEND_API_URL = 'https://api.resend.com/emails';

export async function sendWelcomeCredentialsEmail(params: WelcomeEmailParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[Email] RESEND_API_KEY no está configurado. Omitiendo envío de correo de bienvenida.');
    console.info(`[Email Credenciales Backup] Usuario: ${params.to} | Password: ${params.password} | Plan: ${params.plan}`);
    return false;
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Hardman <notificaciones@hardman.lat>';
  const planLabel = params.plan === 'senior' ? 'Plan Senior Ilimitado' : 'Plan Junior';
  const queriesLabel = params.plan === 'senior' ? 'Consultas Ilimitadas con los 8 Agentes' : '50 Consultas Mensuales';
  const greetingName = params.name ? `Dr(a). ${params.name}` : 'Estimado(a) Colega';

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a Hardman IA</title>
</head>
<body style="margin:0;padding:0;background-color:#08090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f0f0f0;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#08090b;padding:40px 10px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" style="max-width:600px;background-color:#111317;border:1px solid rgba(201,168,76,0.35);border-radius:16px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.6);">
          
          <!-- Header Dorado -->
          <tr>
            <td style="padding:32px 30px 24px;text-align:center;background:linear-gradient(180deg, rgba(201,168,76,0.15) 0%, rgba(17,19,23,0) 100%);border-bottom:1px solid rgba(201,168,76,0.2);">
              <h1 style="margin:0;font-size:24px;letter-spacing:3px;text-transform:uppercase;color:#c9a84c;font-weight:700;">
                HARDMAN
              </h1>
              <p style="margin:6px 0 0;font-size:12px;letter-spacing:1.5px;color:#a0a5b1;text-transform:uppercase;">
                Plataforma Jurídica con Inteligencia Artificial
              </p>
            </td>
          </tr>

          <!-- Contenido Principal -->
          <tr>
            <td style="padding:32px 30px;">
              <h2 style="margin:0 0 16px;font-size:20px;color:#ffffff;font-weight:600;">
                ¡Bienvenido(a) a su nuevo despacho virtual, ${greetingName}!
              </h2>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#c4c8d3;">
                Su pago a través de Hotmart ha sido confirmado con éxito. A partir de este momento, su suscripción al <strong style="color:#c9a84c;">${planLabel}</strong> se encuentra completamente activa (${queriesLabel}).
              </p>

              <!-- Tarjeta de Credenciales -->
              <table width="100%" style="background-color:#181b22;border:1px solid rgba(201,168,76,0.25);border-radius:12px;margin:24px 0;padding:20px;">
                <tr>
                  <td>
                    <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#c9a84c;text-transform:uppercase;letter-spacing:1.5px;">
                      Credenciales Oficiales de Acceso
                    </p>
                    <p style="margin:6px 0;font-size:14px;color:#ffffff;">
                      <span style="color:#8e95a5;">Usuario / Correo:</span> <strong>${params.to}</strong>
                    </p>
                    ${params.password ? `
                    <p style="margin:6px 0;font-size:14px;color:#ffffff;">
                      <span style="color:#8e95a5;">Contraseña de ingreso:</span> <code style="background-color:#0b0d11;padding:4px 8px;border-radius:6px;color:#c9a84c;font-weight:700;border:1px solid rgba(201,168,76,0.3);">${params.password}</code>
                    </p>
                    ` : ''}
                    <p style="margin:12px 0 0;font-size:11px;color:#8e95a5;line-height:1.4;">
                      * Le recomendamos cambiar su contraseña desde su perfil en cualquier momento.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Botón de Ingreso Blindado para Outlook -->
              <table border="0" cellspacing="0" cellpadding="0" style="margin:28px auto 24px;">
                <tr>
                  <td align="center" bgcolor="#d4af37" style="border-radius:10px;background-color:#d4af37;padding:0;">
                    <a href="${params.loginUrl}" target="_blank" style="display:inline-block;padding:16px 38px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;font-weight:800;color:#000000 !important;text-decoration:none;border-radius:10px;text-transform:uppercase;letter-spacing:1px;background-color:#d4af37;border:1px solid #d4af37;">
                      <span style="color:#000000 !important;font-weight:800;">INGRESAR A HARDMAN &rarr;</span>
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Qué incluye -->
              <div style="margin-top:24px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.08);">
                <p style="margin:0 0 10px;font-size:12px;font-weight:600;color:#c9a84c;text-transform:uppercase;letter-spacing:1px;">
                  Su despacho incluye:
                </p>
                <ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.6;color:#a0a5b1;">
                  <li>8 Agentes litigantes especializados en legislación peruana</li>
                  <li>Buscador de jurisprudencia y normativa del SPIJ</li>
                  <li>Redacción y análisis de escritos, demandas y recursos</li>
                  <li>Soporte técnico preferencial vía WhatsApp</li>
                </ul>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 30px;background-color:#0b0d11;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="margin:0;font-size:12px;color:#6b7280;">
                Hardman IA &bull; Lima, Perú &bull; Soporte: <a href="https://wa.me/51929725274" style="color:#c9a84c;text-decoration:none;">WhatsApp Oficial</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [params.to],
        subject: `¡Bienvenido a Hardman IA! Su acceso al ${planLabel} está listo`,
        html,
      }),
    });

    const data = (await res.json()) as any;
    if (!res.ok) {
      console.error('[Email] Error al enviar email vía Resend:', data);
      console.info(`[Email Credenciales Backup] Usuario: ${params.to} | Password: ${params.password} | Plan: ${params.plan}`);
      return false;
    }

    console.log(`[Email] Correo de bienvenida enviado con éxito a ${params.to} (ID: ${data?.id})`);
    return true;
  } catch (err) {
    console.error('[Email] Excepción al enviar correo con Resend:', err);
    console.info(`[Email Credenciales Backup] Usuario: ${params.to} | Password: ${params.password} | Plan: ${params.plan}`);
    return false;
  }
}

export async function sendSubscriptionUpdatedEmail(params: SubscriptionUpdatedEmailParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Hardman <notificaciones@hardman.lat>';
  const planLabel = params.plan === 'senior' ? 'Plan Senior Ilimitado' : 'Plan Junior';
  const greetingName = params.name ? `Dr(a). ${params.name}` : 'Estimado(a) Colega';

  const html = `
<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background-color:#08090b;font-family:sans-serif;color:#f0f0f0;">
  <table width="100%" style="background-color:#08090b;padding:30px 10px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background-color:#111317;border:1px solid rgba(201,168,76,0.3);border-radius:12px;padding:28px;">
          <tr>
            <td>
              <h1 style="color:#c9a84c;font-size:20px;margin:0 0 10px;">HARDMAN IA &bull; Suscripción Actualizada</h1>
              <p style="color:#c4c8d3;font-size:14px;line-height:1.5;">
                Hola ${greetingName}, confirmamos que su cuenta ha sido actualizada con éxito al <strong style="color:#c9a84c;">${planLabel}</strong>.
              </p>
              <p style="color:#8a90a0;font-size:13px;line-height:1.5;margin:12px 0;">
                ✓ Sus <strong>250 consultas mensuales</strong> han sido acreditadas de inmediato.<br>
                ✓ Sus credenciales de ingreso (correo y contraseña) <strong>se mantienen exactamente iguales</strong>.<br>
                ✓ Su nuevo periodo mensual corre a partir de hoy.
              </p>
              <p style="margin:20px 0;">
                <a href="${params.loginUrl}" style="display:inline-block;padding:12px 24px;background:#c9a84c;color:#000000 !important;text-decoration:none;font-weight:700;border-radius:8px;">
                  Ingresar a mi Despacho Hardman &rarr;
                </a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [params.to],
        subject: `Suscripción Actualizada a ${planLabel} - Hardman IA`,
        html,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('[Email] Error enviando actualización de suscripción:', err);
    return false;
  }
}
