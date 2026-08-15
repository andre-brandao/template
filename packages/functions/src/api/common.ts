import { z } from "zod";
import { ErrorResponse, ErrorCodes, VisibleError } from "@template/core/error";
import { Common } from "@template/core/common";
import { validator as zodValidator, resolver } from "hono-openapi";
import type { MiddlewareHandler, ValidationTargets } from "hono";
import { Actor } from "@template/core/actor";

export function Result<T extends z.ZodType>(schema: T) {
  return resolver(schema);
}

const num = (v: unknown) => (typeof v === "string" ? Number(v) : v);

const arr = (v: unknown) => (typeof v === "string" ? [v] : v);

/**
 * A core list schema as the query string hands it over: numbers arrive as text, and a
 * single `?sort=` arrives unwrapped rather than as a one-element array. Only the encoding
 * is patched here — the constraints, defaults and docs stay core's.
 */
export function PaginatedQuery<T extends z.ZodObject<any>>(schema: T) {
  return schema.extend({
    page: z.preprocess(num, schema.shape.page),
    pageSize: z.preprocess(num, schema.shape.pageSize),
    sort: z.preprocess(arr, schema.shape.sort),
  });
}

/** OpenAPI 200 response for a paginated list route — wraps `Common.Page(item)` so handlers don't repeat it. */
export function PaginatedResponse<T extends z.ZodType>(
  item: T,
  description: string,
  example: z.infer<T>,
) {
  return {
    content: {
      "application/json": {
        schema: Result(Common.Page(item)),
        example: { data: [example], page: 1, pageSize: 20, total: 1 },
      },
    },
    description,
  };
}

export const noop: MiddlewareHandler = (_c, next) => next();

export const authRequired: MiddlewareHandler = async (_c, next) => {
  const actor = Actor.use();
  if (actor.type === "public")
    throw new VisibleError(
      "authentication",
      ErrorCodes.Authentication.UNAUTHORIZED,
      "Authentication required",
    );
  return next();
};

/**
 * Custom validator wrapper around hono-openapi/zod validator that formats errors
 * according to our standard API error format
 */
export const validator = function <S extends z.ZodType, Target extends keyof ValidationTargets>(
  target: Target,
  schema: S,
) {
  const onInvalid: Parameters<typeof zodValidator>[2] = (result, c) => {
    if (result.success) return;

    const issues = result.error;
    if (issues.length === 0) {
      return c.json(
        {
          type: "validation",
          code: ErrorCodes.Validation.INVALID_PARAMETER,
          message: "Invalid request data",
        },
        400,
      );
    }

    const firstIssue = issues[0]!;
    const fieldPath = firstIssue.path?.map(String).join(".");

    return c.json(
      {
        type: "validation",
        code: ErrorCodes.Validation.INVALID_PARAMETER,
        message: firstIssue.message,
        param: fieldPath,
        details: {
          issues: issues.map((issue) => ({
            path: issue.path?.map(String).join("."),
            message: issue.message,
          })),
        },
      },
      400,
    );
  };

  return zodValidator(target, schema, onInvalid);
};

/**
 * Standard error responses for OpenAPI documentation
 */
export const ErrorResponses = {
  400: {
    content: {
      "application/json": {
        schema: resolver(ErrorResponse.meta({ description: "Validation error" })),
        example: {
          type: "validation",
          code: "invalid_parameter",
          message: "The request was invalid",
        },
      },
    },
    description: "Bad Request",
  },
  401: {
    content: {
      "application/json": {
        schema: resolver(ErrorResponse.meta({ description: "Authentication error" })),
        example: {
          type: "authentication",
          code: "unauthorized",
          message: "Authentication required",
        },
      },
    },
    description: "Unauthorized",
  },
  403: {
    content: {
      "application/json": {
        schema: resolver(ErrorResponse.meta({ description: "Permission error" })),
        example: {
          type: "forbidden",
          code: "permission_denied",
          message: "You do not have permission",
        },
      },
    },
    description: "Forbidden",
  },
  404: {
    content: {
      "application/json": {
        schema: resolver(ErrorResponse.meta({ description: "Not found error" })),
        example: {
          type: "not_found",
          code: "resource_not_found",
          message: "The requested resource could not be found",
        },
      },
    },
    description: "Not Found",
  },
  500: {
    content: {
      "application/json": {
        schema: resolver(ErrorResponse.meta({ description: "Server error" })),
        example: { type: "internal", code: "internal_error", message: "Internal server error" },
      },
    },
    description: "Internal Server Error",
  },
};
