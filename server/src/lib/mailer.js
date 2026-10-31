import nodemailer from 'nodemailer';
import { query } from '../db/pool.js';
import { config } from '../config.js';
export async function sendMail({ to, subject, text, kind = 'notification' }) {
  await query('INSERT INTO email_log(to_email,subject,body,kind,delivered) VALUES($1,$2,$3,$4,false)', [to, subject, text, kind]);
  if (!process.env.SMTP_HOST) return { logged: true };
  const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined });
  await transporter.sendMail({ from: process.env.MAIL_FROM || 'SubscriptIQ <no-reply@example.com>', to, subject, text });
  return { logged: true };
}
