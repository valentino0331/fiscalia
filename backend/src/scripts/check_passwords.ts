import 'dotenv/config';
import bcrypt from 'bcrypt';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function checkPasswords() {
  const users = await sql`
    SELECT email, password_hash FROM users WHERE email IN ('german.cornejowong@gmail.com', 'zevallosmantari@gmail.com')
  `;
  for (const u of users) {
    const match = await bcrypt.compare(
      u.email === 'german.cornejowong@gmail.com' ? 'Hardman-418270!' : 'Hardman-714210!',
      u.password_hash
    );
    console.log(`Password match for ${u.email}:`, match);
  }
}

checkPasswords().catch(console.error);
