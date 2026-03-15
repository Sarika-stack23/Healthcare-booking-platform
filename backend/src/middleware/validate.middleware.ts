import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';

type ValidateTarget = 'body' | 'query' | 'params';

// ─── Generic Zod Validator ────────────────────────────────────────────────────

export const validate = (schema: ZodSchema, target: ValidateTarget = 'body') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[target]);

      // Replace with sanitized/coerced values
      req[target] = parsed;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));

        return next(
          new ApiError(422, 'Validation failed', errors)
        );
      }
      next(error);
    }
  };
};

// ─── Multi-target Validator ───────────────────────────────────────────────────

export const validateMultiple = (schemas: Partial<Record<ValidateTarget, ZodSchema>>) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const allErrors: Record<string, string>[] = [];

    for (const [target, schema] of Object.entries(schemas) as [ValidateTarget, ZodSchema][]) {
      try {
        const parsed = schema.parse(req[target]);
        req[target] = parsed;
      } catch (error) {
        if (error instanceof ZodError) {
          const errors = error.errors.map((e) => ({
            field: `${target}.${e.path.join('.')}`,
            message: e.message,
          }));
          allErrors.push(...errors);
        }
      }
    }

    if (allErrors.length > 0) {
      return next(new ApiError(422, 'Validation failed', allErrors));
    }

    next();
  };
};