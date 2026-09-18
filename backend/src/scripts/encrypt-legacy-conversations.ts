import 'dotenv/config';
import { db } from '../db';
import { conversations, savedMessages } from '../db/schema';
import { encryptTitle, encryptConversationMessages, encryptText } from '../lib/encryption';
import { eq } from 'drizzle-orm';

async function migrateLegacyData() {
  console.log('🔒 Iniciando cifrado de datos históricos en Neon PostgreSQL...');

  // 1. Cifrar conversaciones
  const allConversations = await db.query.conversations.findMany();
  let encryptedConvCount = 0;

  for (const conv of allConversations) {
    const isTitleEncrypted = conv.title?.startsWith('enc:v1:');
    const firstMsg = (conv.messages as any)?.[0];
    const isMsgEncrypted = firstMsg?.content?.startsWith('enc:v1:');

    if (!isTitleEncrypted || !isMsgEncrypted) {
      const newTitle = encryptTitle(conv.userId, conv.title);
      const newMessages = encryptConversationMessages(conv.userId, conv.messages as any);

      await db
        .update(conversations)
        .set({
          title: newTitle,
          messages: newMessages as any,
        })
        .where(eq(conversations.id, conv.id));

      encryptedConvCount++;
    }
  }

  console.log(`✅ Conversaciones históricas cifradas: ${encryptedConvCount} de ${allConversations.length}`);

  // 2. Cifrar mensajes guardados (favoritos)
  const allSaved = await db.query.savedMessages.findMany();
  let encryptedSavedCount = 0;

  for (const saved of allSaved) {
    if (!saved.content?.startsWith('enc:v1:')) {
      const newContent = encryptText(saved.content, saved.userId);
      await db
        .update(savedMessages)
        .set({ content: newContent })
        .where(eq(savedMessages.id, saved.id));

      encryptedSavedCount++;
    }
  }

  console.log(`✅ Mensajes guardados cifrados: ${encryptedSavedCount} de ${allSaved.length}`);
  console.log('🎉 Migración de cifrado completada con éxito.');
}

migrateLegacyData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error en la migración de cifrado:', err);
    process.exit(1);
  });
