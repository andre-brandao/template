import { goto } from "$app/navigation";
import { page } from "$app/state";
import type { z } from "zod";

/**
 * Zod-declared search params. Reads go through `page.url`, which is reactive on
 * both server and client, so one path covers SSR and browser. Each field tries
 * `getAll` → `get` → `undefined`, so arrays, scalars, and `.default()` all work
 * without schema introspection; invalid values collapse to the default.
 * `update` merges into the query string; empty strings/arrays delete the key.
 */
export function query<S extends z.ZodObject>(schema: S) {
  const fields = schema.shape as Record<string, z.ZodType>;
  const values = {} as z.infer<S>;
  for (const key of Object.keys(fields)) {
    Object.defineProperty(values, key, {
      get: () => {
        const all = page.url.searchParams.getAll(key);
        for (const raw of [all, all[0]]) {
          const parsed = fields[key].safeParse(raw);
          if (parsed.success) return parsed.data;
        }
        return fields[key].parse(undefined);
      },
      enumerable: true,
    });
  }
  function update(next: Partial<z.infer<S>>) {
    const url = new URL(page.url);
    for (const [key, value] of Object.entries(next)) {
      url.searchParams.delete(key);
      for (const v of [value ?? []].flat())
        if (v || v === 0) url.searchParams.append(key, String(v));
    }
    goto(url, { replaceState: true, noScroll: true, keepFocus: true });
  }
  // Non-enumerable so params stays pure data when spread or serialized —
  // remote function args go through devalue, which throws on functions.
  Object.defineProperty(values, "update", { value: update });
  return values as z.infer<S> & { update: typeof update };
}
