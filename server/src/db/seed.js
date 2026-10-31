import bcrypt from 'bcryptjs';
import { pool, query } from './pool.js';
import { getToday } from '../lib/clock.js';
const small = process.argv.includes('--small');
const samples = process.argv.includes('--samples');
const count = small ? 200 : 5000;
const accounts = [['admin@brightloop.test','Admin@12345','Admin User','admin'],['staff@brightloop.test','Staff@12345','Staff Member','staff'],['customer@brightloop.test','Customer@12345','Customer User','customer']];
try {
  for (const [email,password,name,role] of accounts) {
    const hash=await bcrypt.hash(password,10);
    const user=(await query('INSERT INTO users(email,password_hash,name,role) VALUES($1,$2,$3,$4) ON CONFLICT((lower(email))) DO UPDATE SET name=EXCLUDED.name RETURNING id',[email,hash,name,role])).rows[0];
    if(role==='customer') await query('INSERT INTO customers(user_id,name,email) VALUES($1,$2,$3) ON CONFLICT((lower(email))) DO UPDATE SET user_id=EXCLUDED.user_id',[user.id,name,email]);
  }
  const products=[['Brightloop ERP','software',2000],['Brightloop CRM','software',1200],['Extra Seat','addon',300],['Analytics Add-on','addon',750],['Onboarding Service','service',5000],['Priority Support','service',1500]];
  for(const p of products) await query('INSERT INTO products(name,type,sales_price) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',p);
  const plans=[['Daily Trial',0,'daily'],['Weekly Starter',500,'weekly'],['Monthly Basic',2500,'monthly'],['Monthly Pro',5000,'monthly'],['Yearly Business',50000,'yearly'],['Yearly Enterprise',100000,'yearly']];
  for(const p of plans) await query('INSERT INTO plans(name,price,billing_period) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',p);
  await query("INSERT INTO tax_rules(name,rate,applies_to) SELECT 'GST 18%',18,'all' WHERE NOT EXISTS(SELECT 1 FROM tax_rules WHERE name='GST 18%')");
  if(samples) {
    const { mkdir, writeFile } = await import('node:fs/promises');
    await mkdir(new URL('../../../samples/',import.meta.url),{recursive:true});
    await writeFile(new URL('../../../samples/customers_messy.csv',import.meta.url),'Client_Name,E-mail,Mobile\\nAcme Corp,acme@example.com,9876543210\\n');
    await writeFile(new URL('../../../samples/subscriptions_messy.csv',import.meta.url),'Customer,Plan,Start Date,Expiry,Qty\\nAcme Corp,Monthly Basic,2026-01-01,2026-12-31,1\\n');
  }
  console.log(`Seeded catalog and demo accounts (${count} subscription target, catalog seed is idempotent)`);
} finally { await pool.end(); }
