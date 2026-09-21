interface TelegramPurchaseNotificationParams {
  email: string;
  name?: string | null;
  plan: 'junior' | 'senior';
  password?: string | null;
  isNewUser: boolean;
  price?: number | null;
  currency?: string | null;
  transaction?: string | null;
  phone?: string | null;
  loginUrl: string;
  event?: string;
}

interface TelegramCancellationParams {
  email: string;
  name?: string | null;
  event: string;
  transaction?: string | null;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function cleanPhoneNumber(rawPhone?: string | null): string | null {
  if (!rawPhone || typeof rawPhone !== 'string') return null;
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits || digits.length < 8) return null;
  // Si ya tiene código de país (ej. 51 para Perú) o 9 dígitos peruanos
  if (digits.length === 9 && digits.startsWith('9')) {
    return `51${digits}`;
  }
  return digits;
}

export async function sendTelegramPurchaseNotification(
  params: TelegramPurchaseNotificationParams
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('[Telegram] TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID no configurados. Omitiendo notificación.');
    return false;
  }

  try {
    const planLabel = params.plan === 'senior' ? '⭐ Plan Senior Ilimitado' : '⚡ Plan Junior (50 Consultas)';
    const clientName = params.name ? escapeHtml(params.name) : 'Colega Abogado(a)';
    const safeEmail = escapeHtml(params.email);
    const safeTx = params.transaction ? escapeHtml(params.transaction) : 'N/A';
    
    let priceLabel = 'Confirmado en Hotmart';
    if (params.price && params.price > 0) {
      const curr = params.currency || 'S/';
      priceLabel = `${curr} ${params.price.toFixed(2)}`;
    }

    const cleanPhone = cleanPhoneNumber(params.phone);
    const phoneLine = cleanPhone
      ? `📱 <b>WhatsApp:</b> +${cleanPhone}\n`
      : '';

    const credsBlock = params.password
      ? `• <b>Usuario:</b> <code>${safeEmail}</code>\n• <b>Clave Temporal:</b> <code>${escapeHtml(params.password)}</code> <i>(toca para copiar)</i>`
      : `• <b>Usuario:</b> <code>${safeEmail}</code>\n• <b>Clave:</b> <i>Cuenta preexistente (mantiene su clave actual)</i>`;

    const statusNote = params.isNewUser
      ? '✨ <b>Cuenta NUEVA creada automáticamente en Neon.</b>'
      : '🔄 <b>Cuenta EXISTENTE actualizada (renovación / upgrade).</b>';

    const messageHtml = [
      `🚀 <b>¡NUEVA VENTA CONFIRMADA EN HOTMART!</b>`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `👤 <b>Cliente:</b> Dr(a). ${clientName}`,
      `📧 <b>Email:</b> <code>${safeEmail}</code> <i>(toca para copiar)</i>`,
      phoneLine ? phoneLine.trim() : null,
      `💼 <b>Plan:</b> ${planLabel}`,
      `💰 <b>Monto:</b> ${priceLabel}`,
      `🧾 <b>Transacción:</b> <code>${safeTx}</code>`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `🔑 <b>CREDENCIALES DE ACCESO:</b>`,
      credsBlock,
      `🌐 <b>Portal de Acceso:</b> ${params.loginUrl}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      statusNote,
    ]
      .filter(Boolean)
      .join('\n');

    // Botones interactivos bajo el mensaje
    const inlineKeyboard: Array<Array<{ text: string; url: string }>> = [
      [{ text: '🌐 Abrir Portal Hardman', url: params.loginUrl }],
    ];

    if (cleanPhone) {
      inlineKeyboard[0].push({
        text: '💬 Abrir WhatsApp del Cliente',
        url: `https://wa.me/${cleanPhone}`,
      });
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageHtml,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: inlineKeyboard,
        },
      }),
    });

    const data = (await response.json()) as any;
    if (!data || !data.ok) {
      console.error('[Telegram] Error enviando notificación de compra:', data);
      return false;
    }

    console.log(`[Telegram] Notificación de compra enviada con éxito para: ${params.email}`);
    return true;
  } catch (error) {
    console.error('[Telegram] Error al conectar con API de Telegram:', error);
    return false;
  }
}

export async function sendTelegramCancellationNotification(
  params: TelegramCancellationParams
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) return false;

  try {
    const isRefund = params.event === 'PURCHASE_REFUNDED';
    const actionLabel = isRefund ? '⚠️ REEMBOLSO SOLICITADO' : '❌ SUSCRIPCIÓN CANCELADA';
    const safeEmail = escapeHtml(params.email);
    const clientName = params.name ? escapeHtml(params.name) : 'Usuario';
    const safeTx = params.transaction ? escapeHtml(params.transaction) : 'N/A';

    const messageHtml = [
      `🔔 <b>${actionLabel} EN HOTMART</b>`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `👤 <b>Cliente:</b> ${clientName}`,
      `📧 <b>Email:</b> <code>${safeEmail}</code>`,
      `🧾 <b>Transacción:</b> <code>${safeTx}</code>`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `<i>La cuenta fue actualizada a estado inactivo en la base de datos.</i>`,
    ].join('\n');

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageHtml,
        parse_mode: 'HTML',
      }),
    });

    return true;
  } catch (error) {
    console.error('[Telegram] Error notificando cancelación:', error);
    return false;
  }
}
