// Sistema de almacenamiento y descarga de archivos adjuntos del chat (IndexedDB)
import { downloadWordDoc, downloadPdfDoc } from './exportDoc';

const DB_NAME = 'hardman_chat_attachments';
const STORE_NAME = 'attachments';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB no disponible'));
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'name' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Guarda el archivo binario original en IndexedDB del navegador.
 */
export async function saveAttachmentLocally(file: File): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    store.put({
      name: file.name,
      type: file.type,
      size: file.size,
      blob: file,
      savedAt: Date.now(),
    });

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[AttachmentStorage] No se pudo guardar en IndexedDB:', err);
  }
}

/**
 * Recupera el blob original desde IndexedDB.
 */
export async function getAttachmentLocally(fileName: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(fileName);

    return new Promise((resolve) => {
      req.onsuccess = () => {
        const item = req.result;
        if (item && item.blob) {
          resolve(item.blob);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Descarga el archivo adjunto:
 * 1. Si está en IndexedDB (mismo navegador), descarga el archivo binario exacto original.
 * 2. Si es una conversación histórica o restaurada, genera el documento formateado (.docx o .pdf)
 *    a partir del texto íntegro extraído guardado en el mensaje.
 */
export async function downloadChatAttachment(
  fileName: string,
  extractedContent?: string | null
): Promise<void> {
  try {
    // 1. Intentar descargar archivo binario original desde IndexedDB
    const localBlob = await getAttachmentLocally(fileName);
    if (localBlob) {
      const url = URL.createObjectURL(localBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      return;
    }

    // 2. Si no está en IndexedDB pero tenemos el contenido extraído en el mensaje:
    const cleanContent = extractedContent?.trim();
    if (cleanContent) {
      const isDocx = fileName.toLowerCase().endsWith('.docx') || fileName.toLowerCase().endsWith('.doc');
      const isPdf = fileName.toLowerCase().endsWith('.pdf');
      const baseName = fileName.replace(/\.[^/.]+$/, '');

      if (isDocx) {
        await downloadWordDoc(baseName, cleanContent, baseName);
        return;
      }

      if (isPdf) {
        await downloadPdfDoc(baseName, cleanContent, baseName);
        return;
      }

      // Fallback genérico: archivo de texto
      const textBlob = new Blob([cleanContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(textBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseName}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      return;
    }

    alert('El documento original no está disponible en la caché local de este navegador.');
  } catch (err: any) {
    console.error('[AttachmentStorage] Error al descargar archivo adjunto:', err);
    alert('No se pudo descargar el archivo: ' + (err?.message || 'Error desconocido'));
  }
}
