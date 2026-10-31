import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/subscriptiq',
  databaseUrlTest: process.env.DATABASE_URL_TEST || 'postgres://postgres:postgres@localhost:5432/subscriptiq_test',
  jwtSecret: process.env.JWT_SECRET || 'subscriptiq-jwt-secret-key-32chars-min!',
  tz: process.env.TZ || 'Asia/Kolkata',
  currency: process.env.CURRENCY || 'INR',
  demoMode: process.env.DEMO_MODE !== 'false' && process.env.DEMO_MODE !== '0',
  devAuthBypass: !isProd && (process.env.DEV_AUTH_BYPASS === undefined || process.env.DEV_AUTH_BYPASS === 'true' || process.env.DEV_AUTH_BYPASS === '1'),
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || 'SubscriptIQ <no-reply@brightloop.test>'
  }
};
