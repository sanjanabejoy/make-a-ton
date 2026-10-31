import test from 'node:test';
import assert from 'node:assert/strict';
import { addPeriod, periodEnd } from '../src/lib/dates.js';
import { pct, toPaise, fromPaise } from '../src/lib/money.js';

test('monthly periods preserve the anchor day', () => {
  assert.equal(addPeriod('2026-01-31', 'monthly', 31), '2026-02-28');
  assert.equal(addPeriod('2026-02-28', 'monthly', 31), '2026-03-31');
  assert.equal(periodEnd('2026-01-31', 'monthly', 31), '2026-02-27');
});
test('daily, weekly and leap-year periods work', () => {
  assert.equal(addPeriod('2024-02-29', 'yearly', 29), '2025-02-28');
  assert.equal(addPeriod('2026-01-01', 'weekly', 1), '2026-01-08');
  assert.equal(addPeriod('2026-01-01', 'daily', 1), '2026-01-02');
});
test('money uses paise and half-up percentage rounding', () => {
  assert.equal(toPaise('12.34'), 1234);
  assert.equal(fromPaise(1234), '12.34');
  assert.equal(pct(101, 5), 5);
});
