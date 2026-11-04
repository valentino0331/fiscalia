import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface DownloadResult {
  localPath: string;
  fileSha256: string;
  sourceUrl: string;
  fetchedAt: Date;
  byteLength: number;
  contentType: string;
}

export class OfficialDownloader {
  private cacheDir: string;

  constructor(cacheDir?: string) {
    this.cacheDir = cacheDir || path.resolve(process.cwd(), '.cache', 'raw');
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Calcula el hash SHA-256 de un Buffer en memoria
   */
  public static computeSha256(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Descarga un archivo de fuente oficial, guarda en caché y calcula su SHA-256
   */
  public async download(url: string, filenameOverride?: string): Promise<DownloadResult> {
    const fetchedAt = new Date();
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 HardmanGrounding/1.0',
      'Accept': 'application/pdf,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    };

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status} al descargar de fuente oficial: ${url}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileSha256 = OfficialDownloader.computeSha256(buffer);
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Determinar nombre de archivo destino
    let filename = filenameOverride;
    if (!filename) {
      const urlPath = new URL(url).pathname;
      const base = path.basename(urlPath);
      filename = base && base.includes('.') ? base : `${fileSha256.slice(0, 16)}.bin`;
    }

    const localPath = path.join(this.cacheDir, filename);
    fs.writeFileSync(localPath, buffer);

    return {
      localPath,
      fileSha256,
      sourceUrl: url,
      fetchedAt,
      byteLength: buffer.length,
      contentType,
    };
  }
}

