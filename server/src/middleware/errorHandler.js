import { ZodError } from 'zod';

const CODE_TO_STATUS = {
  VALIDATION_ERROR: 422,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INVALID_TRANSITION: 409,
  RULE_VIOLATION: 409
};

export function errorHandler(err, req, res, next) {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details = {};
    for (const issue of err.issues) {
      const path = issue.path.join('.') || 'root';
      details[path] = issue.message;
    }
    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details
      }
    });
  }

  // Handle explicit application errors
  const code = err.code || 'INTERNAL_ERROR';
  const status = err.status || CODE_TO_STATUS[code] || 500;
  const message = err.message || 'An unexpected error occurred';
  const details = err.details || undefined;

  if (status >= 500) {
    console.error(`[ERROR] 500 on ${req.method} ${req.originalUrl}:`, err);
  }

  const responseBody = {
    error: {
      code,
      message,
      ...(details ? { details } : {})
    }
  };

  return res.status(status).json(responseBody);
}
