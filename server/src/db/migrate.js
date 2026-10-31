import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import pg from 'pg';
import { config } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigration(options = {}) {
  const isFresh = options.fresh || process.argv.includes('--fresh');
  const isTest = options.test || process.argv.includes('--test') || config.nodeEnv === 'test';
  const connectionString = isTest ? config.databaseUrlTest : config.databaseUrl;

  console.log(`[migrate] Connecting to ${connectionString}... (fresh: ${isFresh})`);
  const pool = new pg.Pool({ connectionString });

  const client = await pool.connect();
  try {
    if (isFresh) {
      console.log('[migrate] Dropping all tables and sequences (--fresh)...');
      await client.query(`
        DROP TABLE IF EXISTS reconcile_lines CASCADE;
        DROP TABLE IF EXISTS reconcile_batches CASCADE;
        DROP TABLE IF EXISTS migration_rows CASCADE;
        DROP TABLE IF EXISTS migration_jobs CASCADE;
        DROP TABLE IF EXISTS mrr_snapshots CASCADE;
        DROP TABLE IF EXISTS email_log CASCADE;
        DROP TABLE IF EXISTS app_settings CASCADE;
        DROP TABLE IF EXISTS reminders CASCADE;
        DROP TABLE IF EXISTS events CASCADE;
        DROP TABLE IF EXISTS payments CASCADE;
        DROP TABLE IF EXISTS invoice_lines CASCADE;
        DROP TABLE IF EXISTS invoices CASCADE;
        DROP TABLE IF EXISTS billing_runs CASCADE;
        DROP TABLE IF EXISTS subscription_lines CASCADE;
        DROP TABLE IF EXISTS subscriptions CASCADE;
        DROP TABLE IF EXISTS quote_template_lines CASCADE;
        DROP TABLE IF EXISTS quote_templates CASCADE;
        DROP TABLE IF EXISTS payment_terms CASCADE;
        DROP TABLE IF EXISTS discounts CASCADE;
        DROP TABLE IF EXISTS tax_rules CASCADE;
        DROP TABLE IF EXISTS plans CASCADE;
        DROP TABLE IF EXISTS product_variants CASCADE;
        DROP TABLE IF EXISTS products CASCADE;
        DROP TABLE IF EXISTS customers CASCADE;
        DROP TABLE IF EXISTS password_resets CASCADE;
        DROP TABLE IF EXISTS users CASCADE;
        DROP SEQUENCE IF EXISTS invoice_seq CASCADE;
        DROP SEQUENCE IF EXISTS subscription_seq CASCADE;
      `);
    }

    console.log('[migrate] Applying schema.sql...');
    const schemaSql = fs.readFileSync(path.resolve(__dirname, 'schema.sql'), 'utf-8');
    await client.query(schemaSql);

    console.log('[migrate] Seeding default app_settings...');
    const defaultSettings = [
      ['virtual_date', null],
      ['currency', 'INR'],
      ['reminder_offsets', [-3, 0, 3, 7, 14]],
      ['auto_confirm_invoices', false],
      ['auto_send_reminders', false],
      ['company', { name: 'Brightloop Software', address: '123 Tech Park, Bangalore', gstin: '29AAAAA0000A1Z5' }]
    ];

    for (const [key, value] of defaultSettings) {
      await client.query(
        `INSERT INTO app_settings (key, value)
         VALUES ($1, $2::jsonb)
         ON CONFLICT (key) DO NOTHING`,
        [key, JSON.stringify(value)]
      );
    }

    console.log('[migrate] Seeding default payment_terms...');
    const defaultTerms = [
      ['Immediate', 0],
      ['Net 15', 15],
      ['Net 30', 30]
    ];
    for (const [name, days] of defaultTerms) {
      await client.query(
        `INSERT INTO payment_terms (name, days)
         SELECT $1, $2
         WHERE NOT EXISTS (SELECT 1 FROM payment_terms WHERE name = $1)`,
        [name, days]
      );
    }

    if (config.demoMode) {
      console.log('[migrate] DEMO_MODE active: seeding test accounts (Contract §9)...');
      const accounts = [
        { email: 'admin@brightloop.test', pass: 'Admin@12345', name: 'Admin User', role: 'admin' },
        { email: 'staff@brightloop.test', pass: 'Staff@12345', name: 'Staff User', role: 'staff' },
        { email: 'customer@brightloop.test', pass: 'Customer@12345', name: 'Customer User', role: 'customer' }
      ];

      for (const acc of accounts) {
        const hash = bcrypt.hashSync(acc.pass, 10);
        const userRes = await client.query(
          `INSERT INTO users (email, password_hash, name, role, is_active)
           VALUES ($1, $2, $3, $4, true)
           ON CONFLICT (lower(email)) DO UPDATE
           SET password_hash = EXCLUDED.password_hash,
               name = EXCLUDED.name,
               role = EXCLUDED.role,
               is_active = true
           RETURNING id`,
          [acc.email, hash, acc.name, acc.role]
        );
        const userId = userRes.rows[0].id;

        if (acc.role === 'customer') {
          // Ensure linked customer row
          await client.query(
            `INSERT INTO customers (user_id, name, email, company)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (lower(email)) DO UPDATE
             SET user_id = EXCLUDED.user_id,
                 name = EXCLUDED.name`,
            [userId, acc.name, acc.email, 'Brightloop Customer Co']
          );
        }
      }
    }

    console.log('[migrate] Migration completed successfully.');
  } finally {
    client.release();
    await pool.end();
  }
}

// Run directly from CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[migrate] Error:', err);
      process.exit(1);
    });
}
