import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

/** Validates request body, query, and route params with Zod schemas. */
export function validate(schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (schema.body) req.body = schema.body.parse(req.body);
    if (schema.query)
      req.query = schema.query.parse(req.query) as Request["query"];
    if (schema.params) req.params = schema.params.parse(req.params);
    next();
  };
}
