import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not defined in environment');
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);
  const [usersCount] = await sql`SELECT count(*)::int as count FROM users`;
  const [subsCount] = await sql`SELECT count(*)::int as count FROM subscriptions`;
  const [convsCount] = await sql`SELECT count(*)::int as count FROM conversations`;
  const [chunksCount] = await sql`SELECT count(*)::int as count FROM legal_chunks`;
  const chunksBySpec = await sql`SELECT specialist_id, count(*)::int as cnt FROM legal_chunks GROUP BY specialist_id ORDER BY cnt DESC`;
  const recentLogs = await sql`SELECT count(*)::int as cnt FROM question_usage_logs`;
  
  console.log('--- NEON DATABASE STATUS ---');
  console.log('Total Users:', usersCount.count);
  console.log('Total Subscriptions:', subsCount.count);
  console.log('Total Conversations:', convsCount.count);
  console.log('Question Usage Logs:', recentLogs[0].cnt);
  console.log('Total Legal Chunks:', chunksCount.count);
  console.log('Legal Chunks by Specialist:', JSON.stringify(chunksBySpec, null, 2));
}

main().catch(err => {
  console.error('DB Error:', err.message);
  process.exit(1);
});
