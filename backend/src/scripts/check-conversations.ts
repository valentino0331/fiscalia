import 'dotenv/config';
import { db } from '../db';
import { conversations } from '../db/schema';
import { desc } from 'drizzle-orm';

async function main() {
  const rows = await db.query.conversations.findMany({
    orderBy: [desc(conversations.createdAt)],
    limit: 5,
  });

  console.log(`Total recientes encontradas: ${rows.length}`);
  for (const r of rows) {
    console.log({
      id: r.id,
      userId: r.userId,
      createdAt: r.createdAt,
      title: r.title,
      isTitleEncrypted: r.title?.startsWith('enc:v1:'),
      firstMessageRole: (r.messages as any)?.[0]?.role,
      firstMessageContentSample: (r.messages as any)?.[0]?.content?.slice(0, 35),
      isMessageEncrypted: (r.messages as any)?.[0]?.content?.startsWith('enc:v1:'),
    });
  }
}

main().catch(console.error);
