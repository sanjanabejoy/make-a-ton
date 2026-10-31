import { config } from '../config.js';
import { getSetting, setSetting } from './settings.js';

let cachedDate = null;
let cacheExpiry = 0;

export function getRealToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: config.tz }).format(new Date());
}

export function invalidateClockCache() {
  cachedDate = null;
  cacheExpiry = 0;
}

export async function getToday() {
  const now = Date.now();
  if (cachedDate && now < cacheExpiry) {
    return cachedDate;
  }

  const virtualDate = await getSetting('virtual_date', null);
  const effectiveToday = virtualDate || getRealToday();

  cachedDate = effectiveToday;
  cacheExpiry = now + 2000; // 2s cache

  return effectiveToday;
}

export async function setVirtualDate(dateStr) {
  await setSetting('virtual_date', dateStr);
  invalidateClockCache();
  return dateStr;
}

export async function clearVirtualDate() {
  await setSetting('virtual_date', null);
  invalidateClockCache();
  return null;
}

export async function getClockInfo() {
  const virtualDate = await getSetting('virtual_date', null);
  const today = await getToday();
  return {
    virtualDate: virtualDate || null,
    today,
    isSimulated: Boolean(virtualDate)
  };
}
