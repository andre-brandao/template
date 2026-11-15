import { ErrorCodes, VisibleError } from "../../error";
import type { Result } from "./port";

export class Exceeded extends VisibleError {
  readonly limit: number;
  readonly remaining: number;
  readonly retryAfter: number;

  constructor(result: Result) {
    super("rate_limit", ErrorCodes.RateLimit.EXCEEDED, "Rate limit exceeded", undefined, {
      issues: [{ message: "Rate limit exceeded" }],
    });
    this.limit = result.limit;
    this.remaining = result.remaining;
    this.retryAfter = result.retryAfter ?? result.resetAfter;
  }
}
