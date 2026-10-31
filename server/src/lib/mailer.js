import nodemailer from 'nodemailer';
import { config } from '../config.js';
import { pool } from '../db/pool.js';

let transporter = null;
if (config.smtp.host && config.smtp.user) {
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass
    }
  });
}

export async function sendMail({ to, subject, body, kind = 'notification' }, client = pool) {
  let delivered = false;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: config.smtp.from,
        to,
        subject,
        html: body
      });
      delivered = true;
    } catch (err) {
      console.error('[mailer] Failed to send via SMTP, falling back to email_log:', err.message);
    }
  }

  // Always log to email_log for dev/audit
  try {
    await client.query(
      `INSERT INTO email_log (to_email, subject, body, kind, delivered)
       VALUES ($1, $2, $3, $4, $5)`,
      [to, subject, body, kind, delivered]
    );
  } catch (err) {
    console.error('[mailer] Failed to log email:', err.message);
  }

  return { delivered };
}

export const send = sendMail;
