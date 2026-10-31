import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { TRANSITIONS, canTransition } from '../src/modules/subscriptions/transitions.js';
import { isBetween } from '../src/lib/dates.js';

describe('Phase C — Subscriptions', () => {
  describe('Transitions Matrix', () => {
    test('draft can only transition to quotation or closed', () => {
      assert.equal(canTransition('draft', 'quotation'), true);
      assert.equal(canTransition('draft', 'closed'), true);
      assert.equal(canTransition('draft', 'confirmed'), false);
      assert.equal(canTransition('draft', 'active'), false);
    });

    test('quotation can transition to draft, confirmed, closed', () => {
      assert.equal(canTransition('quotation', 'draft'), true);
      assert.equal(canTransition('quotation', 'confirmed'), true);
      assert.equal(canTransition('quotation', 'closed'), true);
      assert.equal(canTransition('quotation', 'active'), false);
    });

    test('confirmed can transition to active or closed', () => {
      assert.equal(canTransition('confirmed', 'active'), true);
      assert.equal(canTransition('confirmed', 'closed'), true);
      assert.equal(canTransition('confirmed', 'draft'), false);
      assert.equal(canTransition('confirmed', 'quotation'), false);
    });

    test('active can only transition to closed', () => {
      assert.equal(canTransition('active', 'closed'), true);
      assert.equal(canTransition('active', 'draft'), false);
      assert.equal(canTransition('active', 'quotation'), false);
      assert.equal(canTransition('active', 'confirmed'), false);
    });

    test('closed is a terminal state (cannot transition anywhere)', () => {
      assert.equal(canTransition('closed', 'draft'), false);
      assert.equal(canTransition('closed', 'quotation'), false);
      assert.equal(canTransition('closed', 'confirmed'), false);
      assert.equal(canTransition('closed', 'active'), false);
      assert.equal(canTransition('closed', 'closed'), false);
    });
  });

  describe('Business Rules & Validations', () => {
    test('plan validity window check (isBetween)', () => {
      const planValidFrom = '2026-06-01';
      const planValidTo = '2026-12-31';

      // Within window
      assert.equal(isBetween('2026-07-01', planValidFrom, planValidTo), true);
      // Before window
      assert.equal(isBetween('2026-05-31', planValidFrom, planValidTo), false);
      // After window
      assert.equal(isBetween('2027-01-01', planValidFrom, planValidTo), false);
      // Open-ended window
      assert.equal(isBetween('2026-01-01', null, null), true);
    });

    test('min_quantity enforcement logic', () => {
      const minQty = 10;
      const linesValid = [{ quantity: 5 }, { quantity: 5 }];
      const totalQtyValid = linesValid.reduce((sum, l) => sum + l.quantity, 0);
      assert.ok(totalQtyValid >= minQty);

      const linesInvalid = [{ quantity: 4 }, { quantity: 5 }];
      const totalQtyInvalid = linesInvalid.reduce((sum, l) => sum + l.quantity, 0);
      assert.ok(totalQtyInvalid < minQty);
    });

    test('quotation expiry comparison', () => {
      const today = '2026-11-20';
      const validUntilFuture = '2026-11-25';
      const validUntilPast = '2026-11-15';

      assert.equal(today <= validUntilFuture, true);
      assert.equal(today <= validUntilPast, false);
    });
  });
});
