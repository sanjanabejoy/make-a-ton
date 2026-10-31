import process from 'node:process';

export const config = {
  port: Number(process.env.PORT || 4000),
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/subscriptiq',
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  timezone: process.env.TZ || 'Asia/Kolkata',
  currency: process.env.CURRENCY || 'INR',
  demoMode: process.env.DEMO_MODE !== 'false',
  devAuthBypass: process.env.DEV_AUTH_BYPASS === 'true',
};
