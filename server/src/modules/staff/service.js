import bcrypt from 'bcryptjs';
import { pool } from '../../db/pool.js';
import { parsePagination } from '../../lib/pagination.js';

export async function listStaff(query) {
  const { limit, offset, orderBy, q } = parsePagination(
    query,
    ['id', 'name', 'email', 'created_at', 'is_active'],
    'created_at:desc'
  );

  let whereClauses = ["role = 'staff'"];
  const params = [];

  if (q) {
    params.push(`%${q}%`);
    whereClauses.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length})`);
  }

  const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

  const countRes = await pool.query(`SELECT COUNT(*) FROM users ${whereSql}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const sql = `
    SELECT id, name, email, role, is_active AS "isActive", created_at AS "createdAt"
    FROM users
    ${whereSql}
    ORDER BY ${orderBy}
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;

  const rowsRes = await pool.query(sql, [...params, limit, offset]);

  return {
    data: rowsRes.rows,
    meta: {
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      total
    }
  };
}

export async function createStaff({ name, email, password }, adminId) {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await pool.query('SELECT id FROM users WHERE lower(email) = $1', [normalizedEmail]);
  if (existing.rows.length > 0) {
    const err = new Error('Email already registered');
    err.code = 'CONFLICT';
    err.status = 409;
    err.details = { email: 'Email already exists' };
    throw err;
  }

  const hash = bcrypt.hashSync(password, 10);

  const res = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, is_active, created_by)
     VALUES ($1, $2, $3, 'staff', true, $4)
     RETURNING id, name, email, role, is_active AS "isActive", created_at AS "createdAt"`,
    [name.trim(), normalizedEmail, hash, adminId]
  );

  return res.rows[0];
}

export async function updateStaff(id, { name, isActive }) {
  const updates = [];
  const params = [id];

  if (name !== undefined) {
    params.push(name.trim());
    updates.push(`name = $${params.length}`);
  }

  if (isActive !== undefined) {
    params.push(isActive);
    updates.push(`is_active = $${params.length}`);
  }

  if (updates.length === 0) {
    const getRes = await pool.query(
      `SELECT id, name, email, role, is_active AS "isActive", created_at AS "createdAt"
       FROM users WHERE id = $1 AND role = 'staff'`,
      [id]
    );
    if (getRes.rows.length === 0) {
      const err = new Error('Staff member not found');
      err.code = 'NOT_FOUND';
      err.status = 404;
      throw err;
    }
    return getRes.rows[0];
  }

  const res = await pool.query(
    `UPDATE users
     SET ${updates.join(', ')}
     WHERE id = $1 AND role = 'staff'
     RETURNING id, name, email, role, is_active AS "isActive", created_at AS "createdAt"`,
    params
  );

  if (res.rows.length === 0) {
    const err = new Error('Staff member not found');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }

  return res.rows[0];
}
