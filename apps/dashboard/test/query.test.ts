import { describe, expect, it } from "bun:test";
import { MutationObserver, QueryObserver, matchQuery, type QueryKey } from "@tanstack/svelte-query";
import { getProjectByIdQueryKey, getProjectQueryKey } from "@template/sdk/query";
import { list } from "../src/lib/features/projects/api/projects.query";
import { queryClient } from "../src/lib/query";

const hits = (key: QueryKey, target: QueryKey) => {
  const client = queryClient();
  client.setQueryData(target, 1);
  return matchQuery(
    { queryKey: key },
    client.getQueryCache().find({ queryKey: target, exact: true })!,
  );
};

describe("query keys", () => {
  it("getProjectQueryKey() matches every list", () => {
    expect(hits(getProjectQueryKey(), list("acme").queryKey)).toBe(true);
    expect(hits(getProjectQueryKey(), list().queryKey)).toBe(true);
    expect(hits(getProjectQueryKey(), getProjectByIdQueryKey({ path: { id: "p" } }))).toBe(false);
  });

  it("the Project tag matches lists and rows", () => {
    expect(hits([{ tags: ["Project"] }], list("acme").queryKey)).toBe(true);
    expect(hits([{ tags: ["Project"] }], getProjectByIdQueryKey({ path: { id: "p" } }))).toBe(true);
  });
});

describe("mutation cache", () => {
  it("refetches before the factory and call-site onSuccess run", async () => {
    const client = queryClient();
    const log: string[] = [];
    const fetches = { list: 0, row: 0 };
    const watch = (key: QueryKey, name: keyof typeof fetches) =>
      new QueryObserver(client, {
        queryKey: key,
        enabled: true,
        queryFn: async () => {
          fetches[name]++;
          if (fetches[name] > 1) log.push(`refetch ${name}`);
          return fetches[name];
        },
      }).subscribe(() => {});
    watch(list("acme").queryKey, "list");
    watch(getProjectByIdQueryKey({ path: { id: "p" } }), "row");
    await Bun.sleep(10);

    // Subscribed like createMutation, else the call-site callback never fires.
    const save = new MutationObserver(client, {
      mutationFn: async () => "ok",
      meta: { invalidates: [getProjectQueryKey()] },
      onSuccess: () => log.push("factory"),
    });
    save.subscribe(() => {});
    await save.mutate(undefined, { onSuccess: () => log.push("call") });
    // That callback is batched through notifyManager, a tick after mutate resolves.
    await Bun.sleep(0);

    expect(log).toEqual(["refetch list", "factory", "call"]);
  });

  it("invalidates everything without meta", async () => {
    const client = queryClient();
    const keys = [list().queryKey, getProjectByIdQueryKey({ path: { id: "p" } })];
    keys.forEach((key) => client.setQueryData(key, 1));
    await client
      .getMutationCache()
      .build(client, { mutationFn: async () => "ok" })
      .execute(undefined);
    expect(keys.map((key) => client.getQueryState(key)?.isInvalidated)).toEqual([true, true]);
  });
});
