// src/middlewares/globalErrorHandler.ts
import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError";

const isProduction = process.env.NODE_ENV === "production";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // Required so Express recognises this as a 4-arg error handler.
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = "Something went wrong";
  let errorCode = "INTERNAL_SERVER_ERROR";
  let details: unknown = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorCode = err.errorCode || "APP_ERROR";
  } else if (err instanceof ZodError) {
    // In case a Zod error reaches the global handler (e.g. thrown outside
    // validateRequest), still return a clear 400 with the specific reason.
    statusCode = 400;
    errorCode = "VALIDATION_ERROR";
    message = err.issues[0]?.message ?? "Validation failed";
    details = err.issues;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Map common client-caused Prisma failures to meaningful 4xx responses.
    // Anything unmapped (e.g. connection/auth codes like P1000) is a
    // server-side problem and stays a 500.
    errorCode = `PRISMA_${err.code}`;
    switch (err.code) {
      case "P2002":
        statusCode = 409;
        message = "A record with these details already exists";
        break;
      case "P2025":
        statusCode = 404;
        message = "The requested record was not found";
        break;
      case "P2000":
        statusCode = 400;
        message = "A provided value is too long for its column";
        break;
      default:
        statusCode = 500;
        message = "A database error occurred";
    }
  } else if (
    typeof err === "object" &&
    err !== null &&
    // body-parser errors (e.g. PayloadTooLargeError -> 413, malformed JSON -> 400)
    // carry a numeric statusCode/status. Honor it instead of defaulting to 500.
    ("statusCode" in err || "status" in err)
  ) {
    const httpError = err as {
      statusCode?: number;
      status?: number;
      message?: string;
      type?: string;
    };
    statusCode = httpError.statusCode ?? httpError.status ?? 500;
    message = httpError.message ?? message;
    errorCode =
      httpError.type === "entity.too.large"
        ? "PAYLOAD_TOO_LARGE"
        : "REQUEST_ERROR";
    if (httpError.type === "entity.too.large") {
      message = "Request payload is too large";
    }
  } else if (err instanceof Error) {
    message = err.message;
  }

  // Only leak stack traces outside production, and never for expected 4xx errors.
  if (!isProduction && statusCode >= 500 && err instanceof Error) {
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
