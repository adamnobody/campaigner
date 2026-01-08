import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorMiddleware(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: err.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')
    });
  }

  const status = typeof err?.status === 'number' ? err.status : 500;
  const code = typeof err?.code === 'string' ? err.code : 'INTERNAL_ERROR';
  const message = typeof err?.message === 'string' ? err.message : 'Unknown error';

  res.status(status).json({ code, message });
}
