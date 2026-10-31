import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { Socket } from 'net';
import { app } from '../src/app.js';

function callApp(options = {}) {
  return new Promise((resolve, reject) => {
    const socket = new Socket();
    const req = new http.IncomingMessage(socket);
    req.method = options.method || 'GET';
    req.url = options.url || '/api/health';
    req.headers = options.headers || {};
    req.query = options.query || {};
    req.body = options.body || {};

    const res = new http.ServerResponse(req);
    let chunks = [];

    // Capture response writes
    const origWrite = res.write;
    const origEnd = res.end;

    res.write = function (chunk, ...args) {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      return origWrite.call(this, chunk, ...args);
    };

    res.end = function (chunk, ...args) {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      origEnd.call(this, chunk, ...args);
      const raw = Buffer.concat(chunks).toString('utf-8');
      let body = raw;
      try {
        body = JSON.parse(raw);
      } catch (e) {
        // keep as text
      }
      resolve({
        status: res.statusCode,
        headers: res.getHeaders(),
        body,
        raw
      });
    };

    app.handle(req, res, (err) => {
      if (err) reject(err);
    });
  });
}

describe('Scaffold & App in-memory tests', () => {
  test('GET /api/health returns 200 with ok status and today date', async () => {
    const res = await callApp({ method: 'GET', url: '/api/health' });
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
    assert.match(res.body.today, /^\d{4}-\d{2}-\d{2}$/);
  });

  test('GET /api/nonexistent returns 404 with standard envelope', async () => {
    const res = await callApp({ method: 'GET', url: '/api/nonexistent' });
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, 'NOT_FOUND');
  });

  test('Response includes X-Response-Time header', async () => {
    const res = await callApp({ method: 'GET', url: '/api/health' });
    assert.ok(res.headers['x-response-time']);
  });
});
