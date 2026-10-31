import cron from 'node-cron';
import { app } from './app.js';
import { config } from './config.js';
import { runDailyJobs } from './jobs/daily.js';

// Schedule daily jobs at 02:00 server time
cron.schedule('0 2 * * *', async () => {
  try {
    console.log('[cron] Running scheduled daily job (02:00)...');
    await runDailyJobs();
  } catch (err) {
    console.error('[cron] Daily job failed:', err);
  }
});

const server = app.listen(config.port, () => {
  console.log(`[server] SubscriptIQ server listening on port ${config.port} (${config.nodeEnv})`);
});

process.on('SIGTERM', () => {
  console.log('[server] SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('[server] HTTP server closed');
  });
});

