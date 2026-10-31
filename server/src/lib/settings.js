import { query } from '../db/pool.js';

const defaults = {
  company: { name: 'SubscriptIQ', address: '', gstin: '' },
  currency: 'INR',
  reminderOffsets: [-3, 0, 3, 7, 14],
  autoConfirmInvoices: false,
  autoSendReminders: false,
};

export async function getSettings() {
  const { rows } = await query('SELECT key, value FROM app_settings');
  const values = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return {
    company: values.company || defaults.company,
    currency: values.currency || defaults.currency,
    reminderOffsets: values.reminder_offsets || defaults.reminderOffsets,
    autoConfirmInvoices: values.auto_confirm_invoices ?? defaults.autoConfirmInvoices,
    autoSendReminders: values.auto_send_reminders ?? defaults.autoSendReminders,
  };
}

export async function saveSettings(settings) {
  const entries = {
    company: settings.company,
    currency: settings.currency,
    reminder_offsets: settings.reminderOffsets,
    auto_confirm_invoices: settings.autoConfirmInvoices,
    auto_send_reminders: settings.autoSendReminders,
  };
  for (const [key, value] of Object.entries(entries)) {
    await query(`INSERT INTO app_settings(key,value) VALUES($1,$2::jsonb)
      ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value`, [key, JSON.stringify(value)]);
  }
  return getSettings();
}
