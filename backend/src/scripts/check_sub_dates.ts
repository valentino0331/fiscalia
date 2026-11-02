import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function checkSubDates() {
  const rows = await sql`
    SELECT u.email, u.created_at as user_created, s.plan, s.status, s.hotmart_transaction, s.current_period_start, s.current_period_end
    FROM users u
    JOIN subscriptions s ON s.user_id = u.id
    WHERE u.email IN ('german.cornejowong@gmail.com', 'zevallosmantari@gmail.com', 'israeljackson3103@gmail.com', 'jose.albertobazanh@gmail.com')
  `;
  console.log(JSON.stringify(rows, null, 2));
}

checkSubDates().catch(console.error);

