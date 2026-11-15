/** An error's message, for a toast, an issue or a tool's result. */
export const failure = (err: unknown) => (err instanceof Error ? err.message : String(err));
