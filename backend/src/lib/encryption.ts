import crypto from 'crypto';

const PREFIX = 'enc:v1:';

/**
 * Obtiene la clave maestra del servidor.
 * En producción debe ser provista por la variable de entorno ENCRYPTION_SECRET (mínimo 32 chars).
 * Si no está configurada, se deriva a partir de JWT_SECRET para evitar interrupciones en dev.
 */
function getMasterKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    console.warn('[Security/Encryption] ¡ADVERTENCIA! ENCRYPTION_SECRET no está definido. Usando clave de respaldo temporal.');
    return crypto.createHash('sha256').update('fiscalia-temp-fallback-secret-2026').digest();
  }
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Deriva una clave simétrica única de 256 bits para el usuario mediante HKDF-SHA256.
 * Esto aísla criptográficamente a cada usuario/abogado.
 */
function getUserKey(userId: string): Buffer {
  const masterKey = getMasterKey();
  const salt = Buffer.from(userId || 'default-salt', 'utf8');
  const info = Buffer.from('fiscalia-legal-chat-encryption', 'utf8');
  return Buffer.from(crypto.hkdfSync('sha256', masterKey, salt, info, 32));
}

/**
 * Cifra un texto en texto claro usando AES-256-GCM.
 * Retorna formato: enc:v1:<iv_base64>:<tag_base64>:<ciphertext_base64>
 */
export function encryptText(plaintext: string, userId: string): string {
  if (!plaintext || typeof plaintext !== 'string') return plaintext;
  if (plaintext.startsWith(PREFIX)) return plaintext; // Ya está cifrado

  try {
    const key = getUserKey(userId);
    const iv = crypto.randomBytes(12); // 96 bits recomendado para GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
    ciphertext += cipher.final('base64');

    const tag = cipher.getAuthTag();

    return `${PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${ciphertext}`;
  } catch (error) {
    console.error('[Security/Encryption] Error al cifrar texto:', error);
    return plaintext; // Fallback seguro para no perder la operación
  }
}

/**
 * Descifra un texto cifrado en formato enc:v1:...
 * Si el texto no está cifrado (datos legacy), lo retorna intacto de forma transparente.
 */
export function decryptText(encryptedText: string, userId: string): string {
  if (!encryptedText || typeof encryptedText !== 'string') return encryptedText;
  if (!encryptedText.startsWith(PREFIX)) return encryptedText; // Datos legacy en texto plano

  try {
    const payload = encryptedText.slice(PREFIX.length);
    const parts = payload.split(':');
    if (parts.length !== 3) {
      console.warn('[Security/Encryption] Formato de payload cifrado inválido');
      return encryptedText;
    }

    const [ivB64, tagB64, ciphertextB64] = parts;
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const key = getUserKey(userId);

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(ciphertextB64, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('[Security/Encryption] Error al descifrar texto (posible alteración o clave incorrecta):', error);
    return encryptedText;
  }
}

/**
 * Cifra el array de mensajes de una conversación antes de guardarla en Neon DB.
 * Mantiene la estructura de array jsonb y los roles/timestamps intactos para analíticas,
 * pero cifra el contenido confidencial de cada mensaje.
 */
export function encryptConversationMessages<T extends { role: string; content: string; timestamp?: string }>(
  userId: string,
  messages: T[]
): T[] {
  if (!Array.isArray(messages)) return messages;
  return messages.map((msg) => {
    if (!msg || typeof msg !== 'object') return msg;
    return {
      ...msg,
      content: encryptText(msg.content, userId),
    };
  });
}

/**
 * Descifra el array de mensajes al ser consultado por el usuario dueño de la conversación.
 */
export function decryptConversationMessages<T extends { role: string; content: string; timestamp?: string }>(
  userId: string,
  messages: T[]
): T[] {
  if (!Array.isArray(messages)) return messages;
  return messages.map((msg) => {
    if (!msg || typeof msg !== 'object') return msg;
    return {
      ...msg,
      content: decryptText(msg.content, userId),
    };
  });
}

/**
 * Cifra el título de la conversación.
 */
export function encryptTitle(userId: string, title: string | null | undefined): string | null {
  if (!title) return title ?? null;
  return encryptText(title, userId);
}

/**
 * Descifra el título de la conversación.
 */
export function decryptTitle(userId: string, title: string | null | undefined): string | null {
  if (!title) return title ?? null;
  return decryptText(title, userId);
}
