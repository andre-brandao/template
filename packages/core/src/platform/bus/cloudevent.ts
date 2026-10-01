import { z } from "zod";

/**
 * The slice of cloudevents/sdk-javascript (Apache-2.0) we use, as ESM with no Node built-ins:
 * the SDK requires `util`/`http`, which breaks the Cloudflare bundles. Same names and shapes,
 * so going back to the SDK is an import swap.
 */
const Attrs = z
  .object({
    specversion: z.literal("1.0").default("1.0"),
    id: z
      .string()
      .min(1)
      .default(() => crypto.randomUUID()),
    source: z.string().min(1),
    type: z.string().min(1),
    subject: z.string().min(1).optional(),
    time: z.iso.datetime().default(() => new Date().toISOString()),
    datacontenttype: z.string().default("application/json"),
    data: z.unknown(),
  })
  .loose();

type Input<T> = z.input<typeof Attrs> & { data?: T };

export class CloudEvent<T = unknown> {
  static schema = Attrs;

  declare readonly specversion: "1.0";
  declare readonly id: string;
  declare readonly source: string;
  declare readonly type: string;
  declare readonly subject?: string;
  declare readonly time: string;
  declare readonly datacontenttype: string;
  declare readonly data: T;
  readonly [ext: string]: unknown;

  constructor(attrs: Input<T>) {
    const parsed = Attrs.parse(attrs);
    // Spec rule: extension names are lowercase alphanumeric, max 20 chars, values primitive.
    for (const [key, value] of Object.entries(parsed)) {
      if (key in Attrs.shape) continue;
      if (!/^[a-z0-9]{1,20}$/.test(key)) throw new Error(`Invalid extension name ${key}`);
      if (!["string", "number", "boolean"].includes(typeof value))
        throw new Error(`Invalid extension value for ${key}`);
    }
    Object.assign(this, parsed);
    Object.freeze(this);
  }

  cloneWith<U = T>(attrs: Partial<Input<U>>): CloudEvent<U> {
    return new CloudEvent<U>({ ...this.toJSON(), ...attrs } as Input<U>);
  }

  toJSON() {
    return { ...this } as z.infer<typeof Attrs> & { data: T };
  }
}

/** A transport message, as the SDK's `Message`. */
export type Message = { headers: Record<string, string>; body: string };

export const HTTP = {
  /** Structured mode: the whole envelope is the body. */
  structured(event: CloudEvent): Message {
    return {
      headers: { "content-type": "application/cloudevents+json; charset=utf-8" },
      body: JSON.stringify(event),
    };
  },
};
