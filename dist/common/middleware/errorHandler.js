"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const zod_1 = require("zod");
const AppError_1 = require("../errors/AppError");
const client_1 = require("@prisma/client");
/** Turn a Zod issue path into a frontend form path, dropping request roots. */
const toFieldName = (path) => path
    .filter((segment) => !["body", "params", "query"].includes(String(segment)))
    .map(String)
    .join(".") || "root";
/** Stable codes let the frontend react without parsing human-readable text. */
const zodIssueCode = (issue) => {
    if (issue.code === "invalid_type" &&
        issue.message.toLowerCase().includes("received undefined")) {
        return "REQUIRED";
    }
    switch (issue.code) {
        case "invalid_type":
            return "INVALID_TYPE";
        case "too_small":
            return "origin" in issue && issue.origin === "string" && issue.minimum === 1
                ? "REQUIRED"
                : "TOO_SMALL";
        case "too_big":
            return "origin" in issue && issue.origin === "string"
                ? "TOO_LONG"
                : "TOO_BIG";
        case "invalid_format":
            return "INVALID_FORMAT";
        case "invalid_value":
            return "values" in issue && Array.isArray(issue.values)
                ? "INVALID_ENUM"
                : "INVALID_VALUE";
        case "unrecognized_keys":
            return "UNKNOWN_FIELD";
        case "custom":
            return "INVALID_VALUE";
        default:
            return "VALIDATION_ERROR";
    }
};
const normalizeZodError = (err) => ({
    statusCode: 422,
    errorCode: "VALIDATION_ERROR",
    message: "Validation failed",
    details: err.issues.map((issue) => ({
        field: toFieldName(issue.path),
        message: issue.message,
        code: zodIssueCode(issue),
    })),
});
const normalizePrismaKnownError = (err) => {
    switch (err.code) {
        case "P2002": {
            const target = err.meta?.target;
            const fields = Array.isArray(target)
                ? target.map(String)
                : typeof target === "string"
                    ? [target]
                    : [];
            return {
                statusCode: 409,
                errorCode: "DUPLICATE_ENTRY",
                message: fields.length > 0
                    ? `A record with this ${fields.join(", ")} already exists`
                    : "A record with these details already exists",
                details: fields.length > 0
                    ? fields.map((field) => ({
                        field,
                        message: `${field} must be unique`,
                        code: "DUPLICATE",
                    }))
                    : undefined,
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
            return {
                statusCode: 500,
                errorCode: "DATABASE_ERROR",
                message: "A database error occurred",
            };
    }
};
const normalizeError = (err) => {
    if (err instanceof AppError_1.AppError) {
        return {
            statusCode: err.statusCode,
            errorCode: err.errorCode,
            message: err.message,
            details: err.details,
        };
    }
    if (err instanceof zod_1.ZodError)
        return normalizeZodError(err);
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        return normalizePrismaKnownError(err);
    }
    if (err instanceof client_1.Prisma.PrismaClientValidationError) {
        return {
            statusCode: 400,
            errorCode: "DATABASE_VALIDATION_ERROR",
            message: "Invalid data provided to the database",
        };
    }
    if (err instanceof client_1.Prisma.PrismaClientInitializationError) {
        return {
            statusCode: 503,
            errorCode: "DATABASE_UNAVAILABLE",
            message: "The database is currently unavailable. Please try again later.",
        };
    }
    if (err instanceof jsonwebtoken_1.TokenExpiredError) {
        return {
            statusCode: 401,
            errorCode: "TOKEN_EXPIRED",
            message: "Your session has expired. Please log in again.",
        };
    }
    if (err instanceof jsonwebtoken_1.JsonWebTokenError) {
        return {
            statusCode: 401,
            errorCode: "UNAUTHENTICATED",
            message: "Invalid authentication token",
        };
    }
    if (typeof err === "object" && err !== null && ("statusCode" in err || "status" in err)) {
        const httpError = err;
        const statusCode = httpError.statusCode ?? httpError.status ?? 500;
        if (httpError.type === "entity.too.large") {
            return {
                statusCode: 413,
                errorCode: "PAYLOAD_TOO_LARGE",
                message: "Request payload is too large",
            };
        }
        if (httpError.type === "entity.parse.failed") {
            return {
                statusCode: 400,
                errorCode: "BAD_REQUEST",
                message: "Malformed JSON request body",
            };
        }
        return {
            statusCode,
            errorCode: statusCode >= 500 ? "INTERNAL_SERVER_ERROR" : "BAD_REQUEST",
            message: statusCode >= 500 ? "Something went wrong. Please try again." : "Bad request",
        };
    }
    return {
        statusCode: 500,
        errorCode: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong. Please try again.",
    };
};
const errorHandler = (err, req, res, _next) => {
    const { statusCode, message, errorCode, details } = normalizeError(err);
    const responseDetails = details?.map((detail) => ({
        ...detail,
        code: detail.code ?? errorCode,
    }));
    // Retain the original technical object in server logs, never in JSON.
    if (statusCode >= 500) {
        console.error(`[${req.method}] ${req.originalUrl} ->`, err);
    }
    const error = {
        code: errorCode,
        statusCode,
    };
    if (responseDetails && responseDetails.length > 0) {
        error.details = responseDetails;
    }
    res.status(statusCode).json({
        success: false,
        message,
        ...(responseDetails && responseDetails.length > 0
            ? { errors: responseDetails }
            : {}),
        error,
    });
};
exports.errorHandler = errorHandler;
