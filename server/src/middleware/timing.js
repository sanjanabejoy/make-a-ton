/**
 * Timing middleware: sets X-Response-Time header and logs requests taking > 1500ms
 */

export function timing(req, res, next) {
  const start = process.hrtime();

  const origWriteHead = res.writeHead;
  res.writeHead = function (...args) {
    const diff = process.hrtime(start);
    const durationMs = Math.round((diff[0] * 1e3) + (diff[1] * 1e-6));
    try {
      if (!res.headersSent) {
        res.setHeader('X-Response-Time', `${durationMs}ms`);
      }
    } catch (e) {
      // ignore
    }
    return origWriteHead.apply(this, args);
  };

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationMs = Math.round((diff[0] * 1e3) + (diff[1] * 1e-6));
    if (durationMs > 1500) {
      console.warn(`[SLOW REQUEST] ${req.method} ${req.originalUrl} - ${durationMs}ms`);
    }
  });

  next();
}
