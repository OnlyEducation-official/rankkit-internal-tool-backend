// src/common/utils/catchAsync.ts
import type { NextFunction, Request, Response } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import type { ParsedQs } from "qs";

/**
 * Wrap an async route handler so any rejected promise is forwarded to the
 * global error handler via `next(err)` instead of crashing the process or
 * hanging the request. Generic over the Express `Request` type params so
 * handlers that type their `req` (e.g. `Request<{ id: string }>`) stay typed.
 */
export const catchAsync =
  <
    P = ParamsDictionary,
    ResBody = any,
    ReqBody = any,
    ReqQuery = ParsedQs
  >(
    fn: (
      req: Request<P, ResBody, ReqBody, ReqQuery>,
      res: Response<ResBody>,
      next: NextFunction
    ) => Promise<unknown>
  ) =>
  (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction
  ) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
