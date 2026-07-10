"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catchAsync = void 0;
/**
 * Wrap an async route handler so any rejected promise is forwarded to the
 * global error handler via `next(err)` instead of crashing the process or
 * hanging the request. Generic over the Express `Request` type params so
 * handlers that type their `req` (e.g. `Request<{ id: string }>`) stay typed.
 */
const catchAsync = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
exports.catchAsync = catchAsync;
