const DEFAULT_TIMEOUT_MS = 10_000;
const RETRY_DELAY_MS = 2_000;

/**
 * Creates a fetch function with timeout and single retry on network errors.
 * Does not retry on HTTP 4xx/5xx responses — only on thrown errors
 * (network failures, DNS errors, timeouts).
 */
export function createFetchWithRetry(timeoutMs = DEFAULT_TIMEOUT_MS): typeof fetch {
  return async (input, init) => {
    const applyTimeout = (req: RequestInfo | URL, reqInit?: RequestInit) => {
      const timeout = AbortSignal.timeout(timeoutMs);
      const merge = (sig?: AbortSignal | null) =>
        sig ? AbortSignal.any([sig, timeout]) : timeout;
      if (req instanceof Request)
        return [new Request(req, { signal: merge(req.signal) }), undefined] as const;
      return [req, { ...reqInit, signal: merge(reqInit?.signal) }] as const;
    };

    const backup = input instanceof Request ? input.clone() : undefined;

    try {
      const [req, opts] = applyTimeout(input, init);
      return await fetch(req, opts);
    } catch {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      const [req, opts] = applyTimeout(backup ?? input, init);
      return fetch(req, opts);
    }
  };
}
