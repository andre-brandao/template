import { Context } from "../context";

export namespace Log {
  const ctx = Context.create<{
    tags: Record<string, any>;
  }>();

  export function create(tags?: Record<string, any>) {
    tags = tags || {};

    const prefix = (extra?: Record<string, any>) =>
      Object.entries({
        ...use().tags,
        ...tags,
        ...extra,
      })
        .map(([key, value]) => `${key}=${value}`)
        .join(" ");

    const result = {
      info(msg: string, extra?: Record<string, any>) {
        console.log(prefix(extra), msg);
        return result;
      },
      warn(msg: string, extra?: Record<string, any>) {
        console.warn(prefix(extra), msg);
        return result;
      },
      error(error: Error) {
        console.error(prefix(), error);
        return result;
      },
      tag(key: string, value: string) {
        if (tags) tags[key] = value;
        return result;
      },
      clone() {
        return Log.create({ ...tags });
      },
    };

    return result;
  }

  export function provide<R>(tags: Record<string, any>, cb: () => R) {
    const existing = use();
    return ctx.provide(
      {
        tags: {
          ...existing.tags,
          ...tags,
        },
      },
      cb,
    );
  }

  function use() {
    try {
      return ctx.use();
    } catch {
      return { tags: {} };
    }
  }
}
