import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.error('No DATABASE_URL in environment');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function inspectDb() {
  const usersCount = await sql`SELECT count(*)::int as count FROM users`;
  const subsCount = await sql`SELECT count(*)::int as count FROM subscriptions`;
  console.log('Total users in Neon:', usersCount[0].count);
  console.log('Total subscriptions in Neon:', subsCount[0].count);

  const sample = await sql`
    SELECT u.id, u.email, u.name, u.is_admin, u.created_at, s.status, s.plan, s.hotmart_transaction, s.current_period_end
    FROM users u
    LEFT JOIN subscriptions s ON s.user_id = u.id
    ORDER BY u.created_at DESC
    LIMIT 10
  `;
  console.log('Sample 10 recent users with subscriptions:');
  console.log(JSON.stringify(sample, null, 2));
}

inspectDb().catch(console.error);

