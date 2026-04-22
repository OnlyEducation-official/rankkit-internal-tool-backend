import { NextFunction, Request, Response } from "express";
import { z, ZodError, ZodType } from "zod";

type RequestSchema = ZodType<{
  body?: any;
  params?: any;
  query?: any;
}>;

export const validateRequest =
  (schema: RequestSchema) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      if (parsed.body) req.body = parsed.body;
      if (parsed.params) req.params = parsed.params;
      if (parsed.query) res.locals.validatedQuery = parsed.query;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: error.issues,
        });
      }

      next(error);
    }
  };