import { z } from "zod";

/**
 * Standard error response schema used for OpenAPI documentation
 */
export const ErrorResponse = z
  .object({
    type: z
      .enum(["validation", "authentication", "forbidden", "not_found", "rate_limit", "internal"])
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
    details: z.any().optional().meta({
      description: "Additional error context information",
    }),
  })
  .meta({ ref: "ErrorResponse" });

export type ErrorResponseType = z.infer<typeof ErrorResponse>;

/**
 * Standardized error codes for the API
 */
export const ErrorCodes = {
  // Validation errors (400)
  Validation: {
    INVALID_PARAMETER: "invalid_parameter",
    MISSING_REQUIRED_FIELD: "missing_required_field",
    INVALID_FORMAT: "invalid_format",
    ALREADY_EXISTS: "already_exists",
    IN_USE: "resource_in_use",
    INVALID_STATE: "invalid_state",
  },

  // Authentication errors (401)
  Authentication: {
    UNAUTHORIZED: "unauthorized",
    INVALID_TOKEN: "invalid_token",
    EXPIRED_TOKEN: "expired_token",
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

  // Rate limit errors (429)
  RateLimit: {
    TOO_MANY_REQUESTS: "too_many_requests",
    QUOTA_EXCEEDED: "quota_exceeded",
  },

  // Server errors (500)
  Server: {
    INTERNAL_ERROR: "internal_error",
    SERVICE_UNAVAILABLE: "service_unavailable",
    DEPENDENCY_FAILURE: "dependency_failure",
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
  public statusCode(): 400 | 401 | 403 | 404 | 429 | 500 {
    switch (this.type) {
      case "validation":
        return 400;
      case "authentication":
        return 401;
      case "forbidden":
        return 403;
      case "not_found":
        return 404;
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

/**
 * Assert a lookup returned a value, else throw a not-found VisibleError.
 */
export function found<T>(resource: string, value: T | null | undefined): T {
  if (value == null)
    throw new VisibleError(
      "not_found",
      ErrorCodes.NotFound.RESOURCE_NOT_FOUND,
      `${resource} not found`,
    );
  return value;
}
