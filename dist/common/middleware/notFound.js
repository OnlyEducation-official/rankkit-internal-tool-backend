"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = void 0;
const AppError_1 = require("../errors/AppError");
/**
 * Fallback handler for any route that didn't match. Delegates to the global
 * error handler so 404s use the same consistent error response shape.
 */
const notFound = (req, _res, next) => {
    next(AppError_1.AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};
exports.notFound = notFound;
