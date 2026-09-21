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

export async function sendTelegramMessage(
  chatId: string | number,
  textHtml: string,
  inlineKeyboard?: Array<Array<{ text: string; url: string }>>
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn('[Telegram] TELEGRAM_BOT_TOKEN no configurado');
    return false;
  }

  try {
    const payload: any = {
      chat_id: chatId,
      text: textHtml,
      parse_mode: 'HTML',
    };

    if (inlineKeyboard && inlineKeyboard.length > 0) {
      payload.reply_markup = {
        inline_keyboard: inlineKeyboard,
      };
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as any;
    if (!data?.ok) {
      console.error('[Telegram] Error en sendMessage:', data);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[Telegram] Excepción enviando mensaje:', error);
    return false;
  }
}

function formatClientTitle(rawName?: string | null): string {
  if (!rawName || !rawName.trim()) return 'Dr(a). Colega Abogado(a)';
  const trimmed = rawName.trim();
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('dr.') ||
    lower.startsWith('dra.') ||
    lower.startsWith('dr ') ||
    lower.startsWith('dra ') ||
    lower.startsWith('abog.') ||
    lower.startsWith('abogada') ||
    lower.startsWith('abogado')
  ) {
    return trimmed;
  }
  return `Dr(a). ${trimmed}`;
}

async function handleClientesCommand(chatId: string | number): Promise<void> {
  try {
    const { db } = await import('../db');
    const { users, subscriptions } = await import('../db/schema');
    const { desc } = await import('drizzle-orm');

    const allUsers = await db.query.users.findMany({
      orderBy: [desc(users.createdAt)],
      limit: 35,
    });

    if (!allUsers || allUsers.length === 0) {
      await sendTelegramMessage(
        chatId,
        `📋 <b>TUS CLIENTES REGISTRADOS EN HARDMAN:</b>\n━━━━━━━━━━━━━━━━━━━━\n<i>No hay clientes registrados en la base de datos todavía.</i>`
      );
      return;
    }

    const allSubs = await db.query.subscriptions.findMany();
    const subMap = new Map<string, typeof allSubs[0]>();
    for (const sub of allSubs) {
      subMap.set(sub.userId, sub);
    }

    const now = new Date();
    const lines: string[] = [
      `📋 <b>TUS CLIENTES REGISTRADOS EN HARDMAN:</b>`,
      `━━━━━━━━━━━━━━━━━━━━`,
    ];

    allUsers.forEach((u, index) => {
      const sub = subMap.get(u.id);
      const titleName = formatClientTitle(u.name);

      let planBadge = '📘 Junior';
      if (sub) {
        if (sub.plan === 'senior') {
          planBadge = '⭐ Senior';
        } else if (sub.plan === 'pro') {
          planBadge = '⚡ Pro';
        } else if (sub.plan === 'pro-trial') {
          planBadge = '⏳ Prueba';
        } else if (sub.plan === 'junior') {
          planBadge = '📘 Junior';
        } else {
          planBadge = `📘 ${sub.plan}`;
        }
      }

      let statusBadge = 'Activo';
      if (sub) {
        if (sub.status === 'active') {
          if (sub.currentPeriodEnd && new Date(sub.currentPeriodEnd) < now) {
            statusBadge = 'Vencido';
          } else {
            statusBadge = 'Activo';
          }
        } else if (sub.status === 'refunded') {
          statusBadge = 'Reembolsado';
        } else if (sub.status === 'cancelled') {
          statusBadge = 'Cancelado';
        } else if (sub.status === 'inactive') {
          statusBadge = 'Inactivo';
        } else {
          statusBadge = sub.status;
        }
      }

      lines.push(`${index + 1}. ${escapeHtml(titleName)}`);
      lines.push(`   📧 <code>${escapeHtml(u.email)}</code> | ${planBadge} | ${statusBadge}`);
    });

    lines.push(`━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`💡 Para enviar acceso a un cliente escribe:\n<code>/clave correo@gmail.com</code>`);

    await sendTelegramMessage(chatId, lines.join('\n'));
  } catch (err) {
    console.error('[Telegram] Error consultando clientes:', err);
    await sendTelegramMessage(chatId, '❌ Ocurrió un error al consultar los clientes en la base de datos.');
  }
}

async function handleClaveCommand(chatId: string | number, text: string): Promise<void> {
  const parts = text.trim().split(/\s+/);
  const targetEmail = parts[1];

  if (!targetEmail || !targetEmail.includes('@')) {
    await sendTelegramMessage(
      chatId,
      `⚠️ <b>Uso correcto:</b>\n<code>/clave correo@gmail.com</code>\n\n<i>Escribe el comando seguido del correo del cliente para generarle un nuevo acceso temporal.</i>`
    );
    return;
  }

  const cleanEmail = targetEmail.toLowerCase().trim();

  try {
    const { db } = await import('../db');
    const { users } = await import('../db/schema');
    const { eq } = await import('drizzle-orm');
    const crypto = await import('crypto');
    const bcrypt = await import('bcrypt');

    const user = await db.query.users.findFirst({
      where: eq(users.email, cleanEmail),
    });

    if (!user) {
      await sendTelegramMessage(
        chatId,
        `❌ <b>Cliente no encontrado</b>\n━━━━━━━━━━━━━━━━━━━━\nNo existe ningún usuario registrado con el correo:\n<code>${escapeHtml(cleanEmail)}</code>\n\n💡 Escribe <code>/clientes</code> para ver la lista completa.`
      );
      return;
    }

    const uniquePin = crypto.randomInt(100000, 999999);
    const newPassword = `Hardman-${uniquePin}!`;
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));

    const clientName = formatClientTitle(user.name);
    const baseUrl = (process.env.FRONTEND_URL || 'https://hardman.lat').replace(/\/$/, '');
    const loginUrl = `${baseUrl}/login?email=${encodeURIComponent(user.email)}`;

    const waText = `¡Hola ${clientName}! 👋\n\nAquí tiene sus credenciales de acceso a Hardman Bufete IA:\n\n🌐 Portal de Acceso: ${loginUrl}\n📧 Usuario: ${user.email}\n🔑 Contraseña: ${newPassword}\n\n¡Bienvenido a su bufete legal con Inteligencia Artificial!`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(waText)}`;

    const messageHtml = [
      `🔑 <b>NUEVO ACCESO GENERADO:</b>`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `👤 ${escapeHtml(clientName)}`,
      `📧 <code>${escapeHtml(user.email)}</code>`,
      `🔑 Contraseña: <code>${escapeHtml(newPassword)}</code>`,
      `🌐 <b>Portal:</b> ${loginUrl}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `📲 Envíaselo por WhatsApp con este botón directo:`,
    ].join('\n');

    await sendTelegramMessage(chatId, messageHtml, [
      [
        { text: '💬 Enviar por WhatsApp al Cliente', url: waUrl },
        { text: '🌐 Abrir Portal Hardman', url: loginUrl },
      ],
    ]);
  } catch (err) {
    console.error('[Telegram] Error generando clave:', err);
    await sendTelegramMessage(chatId, '❌ Ocurrió un error al actualizar la contraseña del usuario.');
  }
}

async function handleAyudaCommand(chatId: string | number): Promise<void> {
  const messageHtml = [
    `⚖️ <b>BOT DE CONTROL - HARDMAN BUFETE IA</b>`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `Hola Valentino, este bot gestiona las ventas y accesos de tus clientes:`,
    ``,
    `📋 <b>Comandos disponibles:</b>`,
    `• <code>/clientes</code> - Lista de clientes registrados, planes y estados.`,
    `• <code>/clave correo@gmail.com</code> - Genera nueva clave y botón de WhatsApp directo.`,
    `• <code>/ayuda</code> - Ver este menú de ayuda.`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🔔 <i>Las notificaciones de compras en Hotmart llegarán automáticamente aquí en tiempo real.</i>`,
  ].join('\n');

  await sendTelegramMessage(chatId, messageHtml);
}

export async function handleTelegramWebhookUpdate(body: any): Promise<void> {
  const message = body?.message || body?.edited_message;
  if (!message || !message.text) return;

  const text = String(message.text).trim();
  const chatId = message.chat?.id;
  const authorizedChatId = process.env.TELEGRAM_CHAT_ID;

  if (!authorizedChatId || String(chatId) !== String(authorizedChatId)) {
    console.warn(`[Telegram Bot] Acceso no autorizado denegado para chat_id: ${chatId}`);
    if (chatId) {
      await sendTelegramMessage(
        chatId,
        '⛔ <b>Acceso Denegado:</b> Este bot es privado y exclusivo para el administrador de Hardman.'
      );
    }
    return;
  }

  const firstWord = text.split(/\s+/)[0].toLowerCase();

  if (firstWord === '/clientes' || firstWord.startsWith('/clientes@') || firstWord === '/usuarios') {
    await handleClientesCommand(chatId);
  } else if (firstWord === '/clave' || firstWord.startsWith('/clave@') || firstWord === '/password') {
    await handleClaveCommand(chatId, text);
  } else if (
    firstWord === '/start' ||
    firstWord.startsWith('/start@') ||
    firstWord === '/ayuda' ||
    firstWord.startsWith('/ayuda@') ||
    firstWord === '/help'
  ) {
    await handleAyudaCommand(chatId);
  } else {
    await sendTelegramMessage(
      chatId,
      `❓ Comando no reconocido: <code>${escapeHtml(firstWord)}</code>\n\nEscribe <code>/clientes</code> para ver tus usuarios o <code>/ayuda</code> para ver los comandos.`
    );
  }
}
