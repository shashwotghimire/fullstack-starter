import type { NextFunction, Request, Response } from "express";

export function notFound(req: Request, res: Response, next: NextFunction): void {
  res.status(404);
  next(new Error(`Route not found: ${req.method} ${req.originalUrl}`));
}
