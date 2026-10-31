import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { toPaise, fromPaise, pct, format } from '../src/lib/money.js';
import { addDays, diffDays, isBetween, addPeriod, periodEnd } from '../src/lib/dates.js';

describe('money.js', () => {
  test('toPaise conversions', () => {
    assert.equal(toPaise(10), 1000);
    assert.equal(toPaise(10.50), 1050);
    assert.equal(toPaise('10.55'), 1055);
    assert.equal(toPaise(0), 0);
    assert.equal(toPaise(null), 0);
  });

  test('fromPaise conversions', () => {
    assert.equal(fromPaise(1000), 10);
    assert.equal(fromPaise(1050), 10.5);
    assert.equal(fromPaise(1055), 10.55);
    assert.equal(fromPaise(0), 0);
  });

  test('pct with half-up rounding', () => {
    assert.equal(pct(10000, 18), 1800); // 18% of 10000
    assert.equal(pct(1000, 12.5), 125);
    assert.equal(pct(333, 10), 33); // 33.3 -> 33
    assert.equal(pct(335, 10), 34); // 33.5 -> 34 (half-up)
  });

  test('format currency INR', () => {
    const formatted = format(100000); // 1000.00 in paise
    assert.match(formatted, /1,000/);
  });
});

describe('dates.js', () => {
  test('addDays and diffDays', () => {
    assert.equal(addDays('2026-01-01', 5), '2026-01-06');
    assert.equal(addDays('2026-01-01', -1), '2025-12-31');
    assert.equal(diffDays('2026-01-06', '2026-01-01'), 5);
    assert.equal(diffDays('2026-01-01', '2026-01-06'), -5);
  });

  test('isBetween with open and closed bounds', () => {
    assert.equal(isBetween('2026-06-15', '2026-06-01', '2026-06-30'), true);
    assert.equal(isBetween('2026-05-31', '2026-06-01', '2026-06-30'), false);
    assert.equal(isBetween('2026-06-15', null, '2026-06-30'), true);
    assert.equal(isBetween('2026-06-15', '2026-06-01', null), true);
    assert.equal(isBetween('2026-06-15', null, null), true);
  });

  test('daily and weekly periods', () => {
    assert.equal(addPeriod('2026-01-01', 'daily'), '2026-01-02');
    assert.equal(addPeriod('2026-01-01', 'weekly'), '2026-01-08');
    assert.equal(periodEnd('2026-01-01', 'daily'), '2026-01-01');
    assert.equal(periodEnd('2026-01-01', 'weekly'), '2026-01-07');
  });

  test('monthly anchor day clamp: Jan 31 -> Feb 28 -> Mar 31 (no drift)', () => {
    const anchorDay = 31;
    const jan31 = '2026-01-31';
    const feb = addPeriod(jan31, 'monthly', anchorDay);
    assert.equal(feb, '2026-02-28');

    const mar = addPeriod(feb, 'monthly', anchorDay);
    assert.equal(mar, '2026-03-31');

    const apr = addPeriod(mar, 'monthly', anchorDay);
    assert.equal(apr, '2026-04-30');

    const may = addPeriod(apr, 'monthly', anchorDay);
    assert.equal(may, '2026-05-31');
  });

  test('yearly period with leap year (Feb 29)', () => {
    const leapAnchor = 29;
    const feb29 = '2024-02-29';
    const nextYear = addPeriod(feb29, 'yearly', leapAnchor);
    assert.equal(nextYear, '2025-02-28');

    const yearAfter = addPeriod(nextYear, 'yearly', leapAnchor);
    assert.equal(yearAfter, '2026-02-28');

    const nextLeap = addPeriod('2027-02-28', 'yearly', leapAnchor);
    assert.equal(nextLeap, '2028-02-29');
  });
});
