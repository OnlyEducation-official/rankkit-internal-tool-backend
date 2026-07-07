// src/common/middleware/errorHandler.ts
//
// Centralized/global error handler. Every error that flows through the app —
// thrown in a controller/service/repository, produced by validation, Prisma,
// JWT, or the body parser — is normalized here into ONE consistent JSON shape:
//
//   {
//     "success": false,
//     "message": "<human readable message for the user>",
//     "error": {
//       "code": "VALIDATION_ERROR",
//       "statusCode": 422,
//       "details": [{ "field": "description", "message": "..." }] // optional
//       "stack": "..."                                            // dev only
//     }
//   }
//
import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError, ZodIssue } from "zod";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { AppError, TErrorDetail } from "../errors/AppError";

const isProduction = process.env.NODE_ENV === "production";

type TNormalizedError = {
  statusCode: number;
  message: string;
  errorCode: string;
  details?: TErrorDetail[];
};

/** Turn a Zod issue path into a flat field name, dropping the "body" root. */
const toFieldName = (path: ZodIssue["path"]): string =>
  path
    .filter((segment) => segment !== "body")
    .map((segment) => String(segment))
    .join(".") || "root";

const normalizeZodError = (err: ZodError): TNormalizedError => {
  const details = err.issues.map((issue) => ({
    field: toFieldName(issue.path),
    message: issue.message,
  }));

  const first = details[0];
  return {
    statusCode: 422,
    errorCode: "VALIDATION_ERROR",
    // Surface the specific reason at the top level so a frontend that shows
    // `message` gets something meaningful, not a generic "Validation failed".
    message: first ? `${first.field}: ${first.message}` : "Validation failed",
    details,
  };
};

const normalizePrismaKnownError = (
  err: Prisma.PrismaClientKnownRequestError
): TNormalizedError => {
  switch (err.code) {
    case "P2002": {
      // Unique constraint violation → duplicate entry.
      const target = err.meta?.target;
      const fields = Array.isArray(target) ? target.join(", ") : String(target ?? "");
      return {
        statusCode: 409,
        errorCode: "DUPLICATE_ENTRY",
        message: fields
          ? `A record with this ${fields} already exists`
          : "A record with these details already exists",
      };
    }
    case "P2025":
      return {
        statusCode: 404,
        errorCode: "NOT_FOUND",
        message: "The requested record was not found",
      };
    case "P2003":
      return {
        statusCode: 400,
        errorCode: "FOREIGN_KEY_VIOLATION",
        message: "Related record does not exist",
      };
    case "P2000":
      return {
        statusCode: 400,
        errorCode: "VALUE_TOO_LONG",
        message: "A provided value is too long for its column",
      };
    case "P2011":
      return {
        statusCode: 400,
        errorCode: "NULL_CONSTRAINT",
        message: "A required value is missing",
      };
    default:
      // Connection/auth/unknown DB codes (e.g. P1000) are server-side.
      return {
        statusCode: 500,
        errorCode: `DATABASE_ERROR`,
        message: "A database error occurred",
      };
  }
};

const normalizeError = (err: unknown): TNormalizedError => {
  // 1) Our own, fully-described application errors.
  if (err instanceof AppError) {
    return {
      statusCode: err.statusCode,
      errorCode: err.errorCode,
      message: err.message,
      details: err.details,
    };
  }

  // 2) Validation (Zod) → 422 with field-level details.
  if (err instanceof ZodError) {
    return normalizeZodError(err);
  }

  // 3) Prisma database errors.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return normalizePrismaKnownError(err);
  }
  if (err instanceof Prisma.PrismaClientValidationError) {
    return {
      statusCode: 400,
      errorCode: "DATABASE_VALIDATION_ERROR",
      message: "Invalid data provided to the database",
    };
  }
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return {
      statusCode: 503,
      errorCode: "DATABASE_UNAVAILABLE",
      message: "The database is currently unavailable. Please try again later.",
    };
  }

  // 4) Authentication (JWT) errors.
  if (err instanceof TokenExpiredError) {
    return {
      statusCode: 401,
      errorCode: "TOKEN_EXPIRED",
      message: "Your session has expired. Please log in again.",
    };
  }
  if (err instanceof JsonWebTokenError) {
    return {
      statusCode: 401,
      errorCode: "UNAUTHENTICATED",
      message: "Invalid authentication token",
    };
  }

  // 5) body-parser / http errors carry a numeric statusCode/status.
  if (typeof err === "object" && err !== null && ("statusCode" in err || "status" in err)) {
    const httpError = err as {
      statusCode?: number;
      status?: number;
      message?: string;
      type?: string;
    };
    const statusCode = httpError.statusCode ?? httpError.status ?? 500;
    if (httpError.type === "entity.too.large") {
      return {
        statusCode: 413,
        errorCode: "PAYLOAD_TOO_LARGE",
        message: "Request payload is too large",
      };
    }
    return {
      statusCode,
      errorCode: statusCode >= 500 ? "INTERNAL_SERVER_ERROR" : "BAD_REQUEST",
      message: httpError.message ?? "Bad request",
    };
  }

  // 6) Fallback — unknown/unhandled error.
  return {
    statusCode: 500,
    errorCode: "INTERNAL_SERVER_ERROR",
    message: "Something went wrong. Please try again.",
  };
};

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // Required so Express recognises this as a 4-arg error handler.
  _next: NextFunction
) => {
  const { statusCode, message, errorCode, details } = normalizeError(err);

  // Log server-side faults (5xx) with full context; 4xx are client mistakes.
  if (statusCode >= 500) {
    console.error(`[${req.method}] ${req.originalUrl} →`, err);
  }

  const error: Record<string, unknown> = {
    code: errorCode,
    statusCode,
  };

  if (details && details.length > 0) {
    error.details = details;
  }

  // Never leak stack traces in production; helpful in development.
  if (!isProduction && err instanceof Error) {
    error.stack = err.stack;
  }

  res.status(statusCode).json({
    success: false,
    message,
    error,
  });
};
