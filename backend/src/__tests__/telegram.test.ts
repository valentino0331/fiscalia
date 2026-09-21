import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendTelegramPurchaseNotification, sendTelegramCancellationNotification } from '../lib/telegram';

describe('Telegram Notifications Module', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('skips sending if TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID are missing', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;

    const result = await sendTelegramPurchaseNotification({
      email: 'test@example.com',
      name: 'Test Buyer',
      plan: 'senior',
      password: 'password123',
      isNewUser: true,
      loginUrl: 'https://hardman.lat/login',
    });

    expect(result).toBe(false);
  });

  it('formats HTML and sends request to Telegram API when configured', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'mock-bot-token';
    process.env.TELEGRAM_CHAT_ID = '123456789';

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      json: async () => ({ ok: true, result: { message_id: 101 } }),
    } as any);

    const result = await sendTelegramPurchaseNotification({
      email: 'juan.perez@gmail.com',
      name: 'Juan Pérez',
      plan: 'senior',
      password: 'Hardman-123456!',
      isNewUser: true,
      price: 69,
      currency: 'S/',
      transaction: 'HP987654321',
      phone: '987654321',
      loginUrl: 'https://hardman.lat/login',
    });

    expect(result).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const [url, options] = fetchSpy.mock.calls[0] as [string, any];
    expect(url).toBe('https://api.telegram.org/botmock-bot-token/sendMessage');
    expect(options.method).toBe('POST');

    const payload = JSON.parse(options.body);
    expect(payload.chat_id).toBe('123456789');
    expect(payload.parse_mode).toBe('HTML');
    expect(payload.text).toContain('juan.perez@gmail.com');
    expect(payload.text).toContain('Hardman-123456!');
    expect(payload.text).toContain('Plan Senior Ilimitado');
    expect(payload.reply_markup.inline_keyboard[0][1].url).toBe('https://wa.me/51987654321');
  });

  it('sends cancellation notification cleanly', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'mock-bot-token';
    process.env.TELEGRAM_CHAT_ID = '123456789';

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      json: async () => ({ ok: true }),
    } as any);

    const result = await sendTelegramCancellationNotification({
      email: 'cancel@example.com',
      name: 'Dr. Cancel',
      event: 'PURCHASE_REFUNDED',
      transaction: 'HP111222',
    });

    expect(result).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, options] = fetchSpy.mock.calls[0] as [string, any];
    const payload = JSON.parse(options.body);
    expect(payload.text).toContain('REEMBOLSO SOLICITADO');
    expect(payload.text).toContain('cancel@example.com');
  });

  it('sends direct Telegram message using sendTelegramMessage', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'mock-bot-token';
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      json: async () => ({ ok: true, result: { message_id: 200 } }),
    } as any);

    const { sendTelegramMessage } = await import('../lib/telegram');
    const result = await sendTelegramMessage('123456', '<b>Test Message</b>', [
      [{ text: 'Click Here', url: 'https://example.com' }],
    ]);

    expect(result).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, options] = fetchSpy.mock.calls[0] as [string, any];
    const payload = JSON.parse(options.body);
    expect(payload.chat_id).toBe('123456');
    expect(payload.text).toBe('<b>Test Message</b>');
    expect(payload.reply_markup.inline_keyboard[0][0].text).toBe('Click Here');
  });

  it('rejects unauthorized chat_id in handleTelegramWebhookUpdate', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'mock-bot-token';
    process.env.TELEGRAM_CHAT_ID = '999999999';

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      json: async () => ({ ok: true }),
    } as any);

    const { handleTelegramWebhookUpdate } = await import('../lib/telegram');
    await handleTelegramWebhookUpdate({
      message: {
        chat: { id: 111111111 },
        text: '/clientes',
      },
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, options] = fetchSpy.mock.calls[0] as [string, any];
    const payload = JSON.parse(options.body);
    expect(payload.chat_id).toBe(111111111);
    expect(payload.text).toContain('Acceso Denegado');
  });

  it('responds with help message when /ayuda is requested by authorized user', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'mock-bot-token';
    process.env.TELEGRAM_CHAT_ID = '999999999';

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      json: async () => ({ ok: true }),
    } as any);

    const { handleTelegramWebhookUpdate } = await import('../lib/telegram');
    await handleTelegramWebhookUpdate({
      message: {
        chat: { id: 999999999 },
        text: '/ayuda',
      },
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, options] = fetchSpy.mock.calls[0] as [string, any];
    const payload = JSON.parse(options.body);
    expect(payload.chat_id).toBe(999999999);
    expect(payload.text).toContain('BOT DE CONTROL - HARDMAN BUFETE IA');
    expect(payload.text).toContain('/clientes');
    expect(payload.text).toContain('/clave');
  });
});

