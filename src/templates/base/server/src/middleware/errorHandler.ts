import type { NextFunction, Request, Response } from "express";
import { sendError } from "../utils/response";

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  sendError(res, error.message, statusCode);
}
