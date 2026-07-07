// src/common/errors/AppError.ts

/**
 * A single field-level error, used to point the frontend at the exact form
 * field that failed (e.g. { field: "description", message: "Too long" }).
 */
export type TErrorDetail = {
  field: string;
  message: string;
};

/**
 * Application-level error carrying an HTTP status code, a stable machine
 * readable `errorCode`, and optional field-level `details`.
 *
 * Throw this anywhere in controllers/services/repositories and the global
 * error handler will turn it into the standard error response. Use the static
 * factories for the common cases so status codes and codes stay consistent.
 */
export class AppError extends Error {
  public statusCode: number;
  public errorCode: string;
  public details?: TErrorDetail[];

  constructor(
    message: string,
    statusCode = 500,
    errorCode = "APP_ERROR",
    details?: TErrorDetail[]
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  /** 400 — malformed request / invalid input that isn't a form-field error. */
  static badRequest(message = "Bad request", details?: TErrorDetail[]) {
    return new AppError(message, 400, "BAD_REQUEST", details);
  }

  /** 401 — request is not authenticated (missing/invalid token). */
  static unauthorized(message = "Authentication required") {
    return new AppError(message, 401, "UNAUTHENTICATED");
  }

  /** 403 — authenticated but not allowed to perform this action. */
  static forbidden(message = "You do not have permission to do this") {
    return new AppError(message, 403, "FORBIDDEN");
  }

  /** 404 — the requested resource does not exist. */
  static notFound(message = "Resource not found") {
    return new AppError(message, 404, "NOT_FOUND");
  }

  /** 409 — conflict, e.g. a duplicate/unique-constraint violation. */
  static conflict(message = "Resource already exists") {
    return new AppError(message, 409, "CONFLICT");
  }

  /** 422 — form/field validation failed; pass field-level `details`. */
  static validation(message = "Validation failed", details?: TErrorDetail[]) {
    return new AppError(message, 422, "VALIDATION_ERROR", details);
  }

  /** 500 — unexpected server error. */
  static internal(message = "Something went wrong. Please try again.") {
    return new AppError(message, 500, "INTERNAL_SERVER_ERROR");
  }
}
