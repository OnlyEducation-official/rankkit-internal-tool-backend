// src/middlewares/globalErrorHandler.ts
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = "Something went wrong";
  let errorCode = "INTERNAL_SERVER_ERROR";
  let details: unknown = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorCode = err.errorCode || "APP_ERROR";
  } else if (err instanceof Error) {
    message = err.message;
    details = err.stack;
  }

  res.status(statusCode).json({
    success: false,
    message,
    error: {
      code: errorCode,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method,
    },
  });
};