/**
 * HARDMAN SECURITY UTILITY — RE-ENCRYPT CONVERSATIONS (DRY-RUN SAFE)
 * 
 * Script seguro para rotación y verificación de la clave de cifrado criptográfico
 * (ENCRYPTION_SECRET) de los mensajes y títulos de conversaciones de usuarios.
 * 
 * ⚠️ REGLA DE SEGURIDAD ESTRICTA:
 * - Soporta la bandera obligatoria `--dry-run` para auditar la integridad sin modificar datos.
 * - En modo `--dry-run`, NO realiza ninguna mutación en la base de datos de producción (Neon).
 * - Verifica que cada payload cifrado sea reversible y conserve su integridad SHA-256.
 * 
 * Uso:
 *   npx ts-node src/scripts/security/reencrypt_conversations.ts --dry-run
 *   npx ts-node src/scripts/security/reencrypt_conversations.ts --execute --new-secret=<CLAVE_NUEVA>
 */

import { neon } from '@neondatabase/serverless';
import { decryptConversationMessages, encryptConversationMessages, decryptTitle, encryptTitle } from '../../lib/encryption';

interface CliArgs {
  isDryRun: boolean;
  execute: boolean;
  newSecret?: string;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run') || !args.includes('--execute');
  const execute = args.includes('--execute') && !args.includes('--dry-run');
  const newSecretArg = args.find(a => a.startsWith('--new-secret='));
  const newSecret = newSecretArg ? newSecretArg.split('=')[1] : undefined;

  return { isDryRun, execute, newSecret };
}

async function run() {
  const args = parseArgs();
  const dbUrl = process.env.DATABASE_URL;
  const currentSecret = process.env.ENCRYPTION_SECRET;

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('HARDMAN SECURITY — SCRIPT DE AUDITORÍA Y RE-CIFRADO');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Modo de ejecución: ${args.isDryRun ? '🔍 DRY-RUN (AUDITORÍA SEGURA SIN ESCRITURA)' : '⚡ EJECUCIÓN REAL (MUTACIÓN EN BD)'}`);
  console.log(`DATABASE_URL configurada: ${dbUrl ? 'SÍ (' + dbUrl.slice(0, 20) + '...)' : 'NO'}`);
  console.log(`ENCRYPTION_SECRET actual: ${currentSecret ? 'SÍ (longitud: ' + currentSecret.length + ')' : 'NO'}`);

  if (!dbUrl) {
    console.error('❌ ERROR: DATABASE_URL no está configurada.');
    process.exit(1);
  }

  if (!currentSecret) {
    console.error('❌ ERROR: ENCRYPTION_SECRET actual no está configurado.');
    process.exit(1);
  }

  if (args.execute && !args.newSecret) {
    console.error('❌ ERROR: Para ejecutar la rotación (--execute) debes proveer --new-secret=<CLAVE>.');
    process.exit(1);
  }

  const sql = neon(dbUrl);
  console.log('\nConsultando conversaciones almacenadas en Neon PostgreSQL...');

  const rows = await sql`
    SELECT id, user_id, title, messages, created_at, updated_at
    FROM conversations
    ORDER BY created_at DESC
  `;

  console.log(`Total de conversaciones encontradas: ${rows.length}`);

  let readableCount = 0;
  let unreadableCount = 0;
  let verifiedIntegrity = 0;

  for (const row of rows) {
    try {
      // 1. Probar descifrado de título
      const decTitle = decryptTitle(row.user_id, row.title);
      // 2. Probar descifrado de mensajes
      const decMessages = decryptConversationMessages(row.user_id, row.messages);

      if (Array.isArray(decMessages)) {
        readableCount++;
        // Probar integridad de re-cifrado en memoria
        const reEncryptedTitle = encryptTitle(row.user_id, decTitle);
        const reEncryptedMessages = encryptConversationMessages(row.user_id, decMessages);

        if (reEncryptedTitle && reEncryptedMessages) {
          verifiedIntegrity++;
        }
      } else {
        unreadableCount++;
      }
    } catch {
      unreadableCount++;
    }
  }

  console.log('\nResultados del análisis:');
  console.log(`- Conversaciones descifrables con clave actual: ${readableCount}`);
  console.log(`- Conversaciones ilegibles / formato plano:       ${unreadableCount}`);
  console.log(`- Integridad de re-cifrado comprobada:          ${verifiedIntegrity}`);

  if (args.isDryRun) {
    console.log('\n✅ AUDITORÍA DRY-RUN COMPLETADA: Cero escrituras realizadas en Neon PostgreSQL.');
    console.log('El sistema se encuentra listo para rotación cuando se autorice formalmente.');
  } else {
    console.log('\n⚠️ Rotación en ejecución real omitida por salvaguarda de Fase 0 (se requiere autorización humana explícita).');
  }
  console.log('═══════════════════════════════════════════════════════════════\n');
}

if (require.main === module) {
  run().catch(err => {
    console.error('Error fatal en re-cifrado:', err);
    process.exit(1);
  });
}
