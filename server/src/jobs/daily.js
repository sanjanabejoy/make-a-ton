import { getToday } from '../lib/clock.js';

export async function runDailyJobs(today = null, options = { runBilling: true }) {
  const effectiveToday = today || (await getToday());
  console.log(`[daily-jobs] Running daily jobs for ${effectiveToday}...`);
  return {
    today: effectiveToday,
    quotationsExpired: 0,
    subscriptionsActivated: 0,
    billingRun: null,
    subscriptionsAutoClosed: 0,
    remindersScheduled: 0
  };
}
