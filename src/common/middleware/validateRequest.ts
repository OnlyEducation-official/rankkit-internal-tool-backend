import { NextFunction, Request, Response } from "express";
import { ZodError, ZodType } from "zod";

type RequestSchema = ZodType<{
  body?: any;
  params?: any;
  query?: any;
}>;

const logValidationDiagnostics = (req: Request, error: unknown) => {
  if (process.env.LOG_VALIDATION_DIAGNOSTICS !== "true") return;

  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  const descriptions = items.map((item: unknown, itemIndex: number) => {
    const description =
      typeof item === "object" && item !== null && "description" in item
        ? (item as { description?: unknown }).description
        : undefined;

    return {
      itemIndex,
      type: typeof description,
      characters: typeof description === "string" ? description.length : null,
      bytes:
        typeof description === "string"
          ? Buffer.byteLength(description, "utf8")
          : null,
    };
  });

  const issues =
    error instanceof ZodError
      ? error.issues.map((issue) => ({
          path: issue.path.map(String).join("."),
          code: issue.code,
          message: issue.message,
        }))
      : [{ path: "root", code: "unknown", message: String(error) }];

  console.warn(
    "VALIDATION_DIAGNOSTIC",
    JSON.stringify({
      method: req.method,
      path: req.originalUrl,
      contentLength: req.get("content-length") ?? null,
      parsedBodyBytes: Buffer.byteLength(JSON.stringify(req.body ?? {}), "utf8"),
      descriptions,
      issues,
    })
  );
};

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
      logValidationDiagnostics(req, error);

      // Delegate to the global error handler so validation errors get the
      // same consistent shape (422 + field-level details) as everything else.
      next(error);
    }
  };
