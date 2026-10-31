import fs from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import { pool, query } from './pool.js';
const fresh = process.argv.includes('--fresh');
try {
  if (fresh) await query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await query(await fs.readFile(new URL('./schema.sql', import.meta.url), 'utf8'));
  await query("INSERT INTO app_settings(key,value) VALUES ('virtual_date','null'),('currency','\"INR\"'),('reminder_offsets','[-3,0,3,7,14]') ON CONFLICT(key) DO NOTHING");
  await query("INSERT INTO payment_terms(name,days) VALUES ('Immediate',0),('Net 15',15),('Net 30',30) ON CONFLICT(name) DO NOTHING");
  if (process.env.DEMO_MODE !== 'false') {
    const accounts = [
      ['admin@brightloop.test', 'Admin@12345', 'Admin User', 'admin'],
      ['staff@brightloop.test', 'Staff@12345', 'Staff Member', 'staff'],
      ['customer@brightloop.test', 'Customer@12345', 'Customer User', 'customer'],
    ];
    for (const [email, password, name, role] of accounts) {
      const { rows } = await query('SELECT id FROM users WHERE lower(email)=lower($1)', [email]);
      if (rows[0]) continue;
      const user = await query('INSERT INTO users(email,password_hash,name,role) VALUES($1,$2,$3,$4) RETURNING id', [email, await bcrypt.hash(password, 10), name, role]);
      if (role === 'customer') await query('INSERT INTO customers(user_id,name,email) VALUES($1,$2,$3)', [user.rows[0].id, name, email]);
    }
  }
  console.log('Database migrated');
} catch (error) {
  console.error(`Database migration failed for ${process.env.DATABASE_URL || 'configured database'}: ${error.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
