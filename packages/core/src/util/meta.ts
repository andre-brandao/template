import { z } from "zod";
import { sql, type SQLWrapper } from "drizzle-orm";
import { Actor } from "../actor";
import { ErrorCodes, VisibleError } from "../error";

/**
 * Backstage-style metadata. Annotations are namespaced keys an integration owns
 * (`github.com/issue`); links are plain references with no behaviour.
 */
const Key = z
  .string()
  .max(128)
  .regex(/^[a-z0-9.-]+\/[a-z0-9.-]+$/, "Annotation keys are namespaced, like `example.com/key`");

export const Annotations = z.record(Key, z.string().max(2000)).meta({
  description: "Namespaced keys an integration owns, like `github.com/issue`. String values.",
  example: { "github.com/issue": "acme/api#12" },
});
export type Annotations = z.infer<typeof Annotations>;

export const Link = z
  .object({
    url: z.url().meta({ description: "Where it points." }),
    title: z.string().max(200).optional().meta({ description: "Label shown in place of the url." }),
    type: z
      .string()
      .max(64)
      .optional()
      .meta({ description: "Free kind hint, like `doc` or `design`." }),
  })
  .meta({ ref: "Link", description: "A plain reference to an outside resource." });

export type Link = z.infer<typeof Link>;

export const Links = Link.array().max(50);

export const Metadata = z
  .object({ annotations: Annotations, links: Links.meta({ description: "Outside references." }) })
  .meta({ ref: "Metadata", description: "Backstage-style annotations and links." });
export type Metadata = z.infer<typeof Metadata>;

export const Annotate = z.object({
  set: Annotations.optional().meta({ description: "Keys to add or overwrite." }),
  unset: Key.array().optional().meta({ description: "Keys to drop." }),
});

/** Namespaces only a sync engine (the system actor) writes, so people can't fake a link. */
const RESERVED = ["github.com/"];

/** The merge as one SQL expression on the `metadata` column, so writers to other keys don't clobber each other. */
export function annotate(column: SQLWrapper, input: z.infer<typeof Annotate>) {
  const keys = [...Object.keys(input.set ?? {}), ...(input.unset ?? [])];
  if (
    Actor.use().type !== "system" &&
    keys.some((key) => RESERVED.some((ns) => key.startsWith(ns)))
  )
    throw new VisibleError(
      "forbidden",
      ErrorCodes.Permission.INSUFFICIENT_PERMISSIONS,
      `Annotations under ${RESERVED.join(", ")} are written by their integration`,
    );
  const unset = sql.join(
    (input.unset ?? []).map((key) => sql`${key}`),
    sql`, `,
  );
  return sql`jsonb_set(${column}, '{annotations}', ((${column} -> 'annotations') || ${JSON.stringify(input.set ?? {})}::jsonb) - array[${unset}]::text[])`;
}

/** Swaps the link list without touching annotations. */
export function relink(column: SQLWrapper, links: Link[]) {
  return sql`jsonb_set(${column}, '{links}', ${JSON.stringify(links)}::jsonb)`;
}
