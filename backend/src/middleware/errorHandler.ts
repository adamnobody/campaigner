import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(404, `${resource} not found`);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, message, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('❌ Error:', err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      details: err.details,
    });
    return;
  }

  // Ошибки SQLite
  if (err.message?.includes('SQLITE_CONSTRAINT')) {
    res.status(409).json({
      success: false,
      error: 'Database constraint violation',
      details: err.message,
    });
    return;
  }

  // Ошибки Multer
  if (err.message?.includes('File too large')) {
    res.status(413).json({
      success: false,
      error: 'File too large',
    });
    return;
  }

  // Дефолтная ошибка
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
}