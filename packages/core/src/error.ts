import { z } from "zod";

/**
 * Standard error response schema used for OpenAPI documentation
 */
export const ErrorResponse = z
  .object({
    type: z
      .enum([
        "validation",
        "authentication",
        "forbidden",
        "not_found",
        "conflict",
        "rate_limit",
        "internal",
      ])
      .meta({
        description: "The error type category",
        examples: ["validation", "authentication"],
      }),
    code: z.string().meta({
      description: "Machine-readable error code identifier",
      examples: ["invalid_parameter", "missing_required_field", "unauthorized"],
    }),
    message: z.string().meta({
      description: "Human-readable error message",
      examples: ["The request was invalid", "Authentication required"],
    }),
    param: z
      .string()
      .optional()
      .meta({
        description: "The parameter that caused the error (if applicable)",
        examples: ["email", "user_id"],
      }),
    details: z
      .object({
        issues: z
          .array(
            z.object({
              path: z
                .string()
                .optional()
                .meta({ description: "Dotted path to the field, like `user.email`." }),
              message: z.string().meta({ description: "What was wrong with it." }),
            }),
          )
          .optional()
          .meta({
            description: "Every field that failed. `param` names the first of them.",
          }),
      })
      .optional()
      .meta({ description: "Additional error context information" }),
  })
  .meta({ ref: "ErrorResponse" });

export type ErrorResponseType = z.infer<typeof ErrorResponse>;

/** Only codes something throws: a new one lands with its first `throw`. */
export const ErrorCodes = {
  // Validation errors (400)
  Validation: {
    INVALID_PARAMETER: "invalid_parameter",
    INVALID_STATE: "invalid_state",
  },

  // Authentication errors (401)
  Authentication: {
    UNAUTHORIZED: "unauthorized",
    INVALID_TOKEN: "invalid_token",
    INVALID_CREDENTIALS: "invalid_credentials",
  },

  // Permission errors (403)
  Permission: {
    FORBIDDEN: "forbidden",
    INSUFFICIENT_PERMISSIONS: "insufficient_permissions",
    ACCOUNT_RESTRICTED: "account_restricted",
  },

  // Resource not found errors (404)
  NotFound: {
    RESOURCE_NOT_FOUND: "resource_not_found",
  },

  // Conflict errors (409)
  Conflict: {
    NOT_READY: "not_ready",
    SINGLE_WORKSPACE: "single_workspace",
    LAST_OWNER: "last_owner",
  },

  // Rate limit errors (429)
  RateLimit: {
    EXCEEDED: "rate_limit_exceeded",
  },

  // Server errors (500)
  Server: {
    INTERNAL_ERROR: "internal_error",
  },
};

/**
 * Standard error that will be exposed to clients through API responses
 */
export class VisibleError extends Error {
  constructor(
    public type: ErrorResponseType["type"],
    public code: string,
    public override message: string,
    public param?: string,
    public details?: any,
  ) {
    super(message);
  }

  /**
   * Convert this error to an HTTP status code
   */
  public statusCode(): 400 | 401 | 403 | 404 | 409 | 429 | 500 {
    switch (this.type) {
      case "validation":
        return 400;
      case "authentication":
        return 401;
      case "forbidden":
        return 403;
      case "not_found":
        return 404;
      case "conflict":
        return 409;
      case "rate_limit":
        return 429;
      case "internal":
        return 500;
    }
  }

  /**
   * Convert this error to a standard response object
   */
  public toResponse(): ErrorResponseType {
    const response: ErrorResponseType = {
      type: this.type,
      code: this.code,
      message: this.message,
    };

    if (this.param) response.param = this.param;
    if (this.details) response.details = this.details;

    return response;
  }
}
