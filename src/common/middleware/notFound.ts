import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";

/**
 * Fallback handler for any route that didn't match. Delegates to the global
 * error handler so 404s use the same consistent error response shape.
 */
export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};
