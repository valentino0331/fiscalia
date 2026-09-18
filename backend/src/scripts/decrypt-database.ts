import 'dotenv/config';
import { db } from '../db';
import { conversations, savedMessages } from '../db/schema';
import { decryptTitle, decryptConversationMessages, decryptText } from '../lib/encryption';
import { eq } from 'drizzle-orm';

async function rollbackDecryption() {
  console.log('🔄 Restaurando datos a texto plano en Neon DB...');

  const allConversations = await db.query.conversations.findMany();
  let decryptedConvCount = 0;

  for (const conv of allConversations) {
    const isTitleEncrypted = conv.title?.startsWith('enc:v1:');
    const firstMsg = (conv.messages as any)?.[0];
    const isMsgEncrypted = firstMsg?.content?.startsWith('enc:v1:');

    if (isTitleEncrypted || isMsgEncrypted) {
      const plainTitle = decryptTitle(conv.userId, conv.title);
      const plainMessages = decryptConversationMessages(conv.userId, conv.messages as any);

      await db
        .update(conversations)
        .set({
          title: plainTitle,
          messages: plainMessages as any,
        })
        .where(eq(conversations.id, conv.id));

      decryptedConvCount++;
    }
  }

  console.log(`✅ Conversaciones restauradas a texto plano: ${decryptedConvCount} de ${allConversations.length}`);

  const allSaved = await db.query.savedMessages.findMany();
  let decryptedSavedCount = 0;

  for (const saved of allSaved) {
    if (saved.content?.startsWith('enc:v1:')) {
      const plainContent = decryptText(saved.content, saved.userId);
      await db
        .update(savedMessages)
        .set({ content: plainContent })
        .where(eq(savedMessages.id, saved.id));

      decryptedSavedCount++;
    }
  }

  console.log(`✅ Mensajes guardados restaurados: ${decryptedSavedCount} de ${allSaved.length}`);
  console.log('🎉 Base de datos restaurada a texto plano.');
}

rollbackDecryption()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error restaurando:', err);
    process.exit(1);
  });
