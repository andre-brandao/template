import { goto } from "$app/navigation";
import { page } from "$app/state";
import type { z } from "zod";

// Repeated keys parse as an array first, then as the first value; anything invalid takes the default.
function read(field: z.ZodType, url: URL, key: string) {
  const all = url.searchParams.getAll(key);
  for (const raw of [all, all[0]]) {
    const parsed = field.safeParse(raw);
    if (parsed.success) return parsed.data;
  }
  return field.parse(undefined);
}

/** What `query` reads, from a plain URL: a load warms the same keys its page asks for. */
export const parse = <S extends z.ZodObject>(schema: S, url: URL) =>
  Object.fromEntries(
    Object.entries(schema.shape as Record<string, z.ZodType>).map((entry) => [
      entry[0],
      read(entry[1], url, entry[0]),
    ]),
  ) as z.infer<S>;

/**
 * Zod-declared search params, read reactively through `page.url`. Arrays, scalars and
 * `.default()` all work; invalid values collapse to the default. `update` merges into
 * the query string; empty strings/arrays delete the key.
 */
export function query<S extends z.ZodObject>(schema: S) {
  const fields = schema.shape as Record<string, z.ZodType>;
  const values = {} as z.infer<S>;
  for (const key of Object.keys(fields)) {
    Object.defineProperty(values, key, {
      get: () => read(fields[key], page.url, key),
      enumerable: true,
    });
  }
  function update(next: Partial<z.infer<S>>) {
    const url = new URL(page.url);
    for (const [key, value] of Object.entries(next)) {
      url.searchParams.delete(key);
      [value ?? []]
        .flat()
        .filter((v) => v || v === 0)
        .forEach((v) => url.searchParams.append(key, String(v)));
    }
    goto(url, { replaceState: true, noScroll: true, keepFocus: true });
  }
  // Non-enumerable so params stays pure data when spread or serialized —
  // remote function args go through devalue, which throws on functions.
  Object.defineProperty(values, "update", { value: update });
  return values as z.infer<S> & { update: typeof update };
}
