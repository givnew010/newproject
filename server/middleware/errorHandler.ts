import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('[ERROR]', err);
  const status = err.status || 500;
  const message = err.message || 'خطأ داخلي في السيرفر';
  const payload: any = { success: false, message };
  if (process.env.NODE_ENV === 'development') payload.details = err.stack ?? err.message;
  res.status(status).json(payload);
}
