/**
 * Every `Bus.subscribe` in one list, so a worker importing `jobs` binds them all. A
 * subscriber lives with its slice and exports its handle for this list.
 */
export const subscribers: { type: string }[] = [];
