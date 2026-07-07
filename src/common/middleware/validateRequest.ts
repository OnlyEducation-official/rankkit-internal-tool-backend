import { NextFunction, Request, Response } from "express";
import { ZodError, ZodType } from "zod";

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
        // Surface the first issue's message at the top level so a frontend
        // that renders `message` shows the specific reason (e.g. a field limit)
        // instead of a generic "Validation failed".
        const firstIssue = error.issues[0];
        const fieldPath = firstIssue?.path
          .filter((segment) => segment !== "body")
          .join(".");
        const message = firstIssue
          ? `${fieldPath ? `${fieldPath}: ` : ""}${firstIssue.message}`
          : "Validation failed";

        return res.status(400).json({
          success: false,
          message,
          error: {
            code: "VALIDATION_ERROR",
          },
          errors: error.issues,
        });
      }

      next(error);
    }
  };