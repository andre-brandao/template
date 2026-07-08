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
      if (req instanceof Request) {
        const signal = req.signal ? AbortSignal.any([req.signal, timeout]) : timeout;
        return [new Request(req, { signal }), undefined] as const;
      }
      const existing = reqInit?.signal;
      const signal = existing ? AbortSignal.any([existing, timeout]) : timeout;
      return [req, { ...reqInit, signal }] as const;
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
