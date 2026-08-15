/** Trimmed, or null when blank — how an optional text column is stored. */
export const trim = (value?: string | null) => value?.trim() || null;

/** Parsed, or null when absent — ISO string in, column value out. */
export const date = (value?: string | null) => (value ? new Date(value) : null);

/** ISO string, or null when absent — column value in, wire value out. */
export const iso = (value?: Date | string | null) => (value ? new Date(value).toISOString() : null);
