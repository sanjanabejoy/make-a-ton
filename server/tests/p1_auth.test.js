import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { passwordRegex, registerSchema, loginSchema, resetPasswordSchema } from '../src/modules/auth/schema.js';
import { authenticate } from '../src/middleware/auth.js';
import { requireRole } from '../src/middleware/requireRole.js';
import * as authService from '../src/modules/auth/service.js';
import { pool } from '../src/db/pool.js';

describe('Phase B — Auth & Roles', () => {
  describe('Password Validation Rules', () => {
    test('rejects passwords shorter than 9 chars', () => {
      assert.equal(passwordRegex.test('Pass1!'), false);
      const res = registerSchema.safeParse({ name: 'User', email: 'u@test.com', password: 'Aa1!' });
      assert.equal(res.success, false);
    });

    test('rejects passwords without uppercase', () => {
      assert.equal(passwordRegex.test('password123!'), false);
    });

    test('rejects passwords without lowercase', () => {
      assert.equal(passwordRegex.test('PASSWORD123!'), false);
    });

    test('rejects passwords without special character', () => {
      assert.equal(passwordRegex.test('Password123'), false);
    });

    test('accepts valid password with length > 8, upper, lower, special', () => {
      assert.equal(passwordRegex.test('Admin@12345'), true);
      assert.equal(passwordRegex.test('Bright#2026'), true);
      const res = registerSchema.safeParse({ name: 'User', email: 'u@test.com', password: 'Admin@12345' });
      assert.equal(res.success, true);
    });
  });

  describe('Middleware & Roles', () => {
    test('Dev auth bypass sets req.user for admin, staff, customer', (t, done) => {
      const req = { headers: { 'x-dev-role': 'staff' } };
      const res = {};
      authenticate(req, res, () => {
        assert.equal(req.user.role, 'staff');
        assert.equal(req.user.id, 2);
        done();
      });
    });

    test('Missing token returns 401 UNAUTHENTICATED', (t, done) => {
      const req = { headers: {} };
      const res = {
        statusCode: 200,
        status(code) { this.statusCode = code; return this; },
        json(body) {
          assert.equal(this.statusCode, 401);
          assert.equal(body.error.code, 'UNAUTHENTICATED');
          done();
        }
      };
      authenticate(req, res, () => {
        assert.fail('Should not call next()');
      });
    });

    test('requireRole(admin) rejects staff with 403 FORBIDDEN', (t, done) => {
      const req = { user: { id: 2, role: 'staff' } };
      const res = {
        statusCode: 200,
        status(code) { this.statusCode = code; return this; },
        json(body) {
          assert.equal(this.statusCode, 403);
          assert.equal(body.error.code, 'FORBIDDEN');
          done();
        }
      };
      const guard = requireRole('admin');
      guard(req, res, () => {
        assert.fail('Should not call next()');
      });
    });

    test('requireRole(admin) allows admin', (t, done) => {
      const req = { user: { id: 1, role: 'admin' } };
      const res = {};
      const guard = requireRole('admin');
      guard(req, res, () => {
        assert.ok(true);
        done();
      });
    });
  });

  describe('Auth Service Business Logic', () => {
    test('duplicate email registration throws 409 CONFLICT', async () => {
      // Mock pool.query to simulate existing user
      const origQuery = pool.query;
      pool.query = async (sql, params) => {
        if (typeof sql === 'string' && sql.includes('FROM users WHERE lower(email)')) {
          return { rows: [{ id: 10, email: 'dup@brightloop.test' }] };
        }
        return { rows: [] };
      };

      try {
        await assert.rejects(
          async () => {
            await authService.registerCustomer({
              name: 'Duplicate',
              email: 'dup@brightloop.test',
              password: 'Password@123'
            });
          },
          (err) => {
            assert.equal(err.code, 'CONFLICT');
            assert.equal(err.status, 409);
            assert.equal(err.details?.email, 'Already registered');
            return true;
          }
        );
      } finally {
        pool.query = origQuery;
      }
    });

    test('password reset token cannot be reused', async () => {
      const origQuery = pool.query;
      // Mock pool.query to return token already marked as used (used_at is not null)
      pool.query = async (sql, params) => {
        if (typeof sql === 'string' && sql.includes('FROM password_resets')) {
          return {
            rows: [{
              id: 1,
              user_id: 5,
              expires_at: new Date(Date.now() + 100000),
              used_at: new Date() // already used!
            }]
          };
        }
        return { rows: [] };
      };

      try {
        await assert.rejects(
          async () => {
            await authService.resetPassword({
              token: 'validtoken123456789012345678901234',
              password: 'NewPassword@123'
            });
          },
          (err) => {
            assert.equal(err.code, 'VALIDATION_ERROR');
            assert.equal(err.status, 422);
            assert.match(err.message, /Invalid or expired/);
            return true;
          }
        );
      } finally {
        pool.query = origQuery;
      }
    });
  });
});
