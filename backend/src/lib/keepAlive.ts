/**
 * Keep-Alive Service para evitar que el backend entre en suspensión (sleep mode)
 * en plataformas cloud gratuitas o compartidas como Render / Fly / Railway.
 */

const PING_INTERVAL_MS = 10 * 60 * 1000; // Cada 10 minutos (Render duerme a los 15 min de inactividad)
const RETRY_INTERVAL_MS = 30 * 1000; // 30 segundos si falla

let intervalId: NodeJS.Timeout | null = null;
let lastPingTime: string | null = null;
let lastPingStatus: 'success' | 'failed' | 'idle' = 'idle';
let pingCount = 0;

export function getKeepAliveStatus() {
  return {
    enabled: !!intervalId,
    pingCount,
    lastPingTime,
    lastPingStatus,
    intervalMinutes: PING_INTERVAL_MS / 60000,
  };
}

export function startKeepAlive() {
  if (intervalId) return;

  const targetUrl =
    process.env.RENDER_EXTERNAL_URL ||
    process.env.BACKEND_URL ||
    process.env.SERVER_URL ||
    'https://fiscalia-1.onrender.com';

  const healthUrl = `${targetUrl.replace(/\/$/, '')}/health`;

  console.log(`[KeepAlive] Iniciando servicio de autosostenimiento activo para: ${healthUrl}`);

  const performPing = async () => {
    try {
      pingCount++;
      const res = await fetch(healthUrl, {
        headers: {
          'User-Agent': 'Fiscalia-KeepAlive-Agent/1.0',
          'X-Keep-Alive-Ping': 'true',
        },
      });

      if (res.ok) {
        lastPingTime = new Date().toISOString();
        lastPingStatus = 'success';
        console.log(`[KeepAlive] Ping #${pingCount} exitoso a ${healthUrl} (${res.status} OK)`);
      } else {
        lastPingTime = new Date().toISOString();
        lastPingStatus = 'failed';
        console.warn(`[KeepAlive] Ping #${pingCount} respondió con código ${res.status}`);
      }
    } catch (err: any) {
      lastPingTime = new Date().toISOString();
      lastPingStatus = 'failed';
      console.warn(`[KeepAlive] Error en ping #${pingCount}: ${err?.message || err}`);
      // Reintento corto si falló
      setTimeout(performPing, RETRY_INTERVAL_MS);
    }
  };

  // Primer ping tras 2 minutos de iniciar el servidor
  setTimeout(performPing, 2 * 60 * 1000);

  // Intervalo regular cada 10 minutos
  intervalId = setInterval(performPing, PING_INTERVAL_MS);
}

export function stopKeepAlive() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[KeepAlive] Servicio de autosostenimiento detenido.');
  }
}
