import { describe, expect, it } from "bun:test";
import type { Todo } from "@template/core/todo";
import { group } from "../src/lib/features/todos/group";
import { STATUSES } from "../src/lib/features/todos/status";

const BASE: Todo.Info = {
  id: "t0",
  createdBy: "u0",
  assignee: null,
  source: null,
  sourceID: null,
  stage: null,
  title: "",
  body: null,
  status: "backlog",
  reason: null,
  tags: [],
  startDate: null,
  dueDate: null,
  timeStarted: null,
  timeDone: null,
};

const make = (over: Partial<Todo.Info>) => ({ ...BASE, ...over });

describe("group by status", () => {
  it("returns every status column in canonical order, even when empty", () => {
    const out = group([make({ id: "a", status: "active" })], "status");
    expect(out.map((g) => g.key)).toEqual([...STATUSES]);
    expect(out.map((g) => g.items.length)).toEqual([0, 0, 1, 0, 0]);
  });

  it("carries the status label and color", () => {
    const done = group([], "status").find((g) => g.key === "done");
    expect(done?.label).toBe("Done");
    expect(done?.color).toBeDefined();
  });
});

describe("group by stage", () => {
  it("buckets by stage and folds stageless todos into one group", () => {
    const out = group(
      [
        make({ id: "a", stage: "build" }),
        make({ id: "b", stage: "build" }),
        make({ id: "c" }),
      ],
      "stage",
    );
    expect(out.find((g) => g.key === "build")?.items.map((t) => t.id)).toEqual(["a", "b"]);
    expect(out.find((g) => g.key === "none")?.label).toBe("No stage");
  });

  it("orders groups by their earliest planned start", () => {
    const out = group(
      [
        make({ id: "a", stage: "later", startDate: "2026-03-01T00:00:00.000Z" }),
        make({ id: "b", stage: "sooner", startDate: "2026-01-01T00:00:00.000Z" }),
        make({ id: "c", stage: "sooner", startDate: "2026-12-01T00:00:00.000Z" }),
      ],
      "stage",
    );
    expect(out.map((g) => g.key)).toEqual(["sooner", "later"]);
  });

  it("sends fully undated groups to the end, tied groups alphabetical", () => {
    const out = group(
      [
        make({ id: "a", stage: "zeta" }),
        make({ id: "b", stage: "alpha" }),
        make({ id: "c", stage: "dated", startDate: "2026-06-01T00:00:00.000Z" }),
      ],
      "stage",
    );
    expect(out.map((g) => g.key)).toEqual(["dated", "alpha", "zeta"]);
  });

  it("ignores null dates when finding the earliest start", () => {
    const out = group(
      [
        make({ id: "a", stage: "mixed" }),
        make({ id: "b", stage: "mixed", startDate: "2026-01-01T00:00:00.000Z" }),
        make({ id: "c", stage: "dated", startDate: "2026-02-01T00:00:00.000Z" }),
      ],
      "stage",
    );
    expect(out.map((g) => g.key)).toEqual(["mixed", "dated"]);
  });
});

describe("group by assignee", () => {
  const ana: Todo.Assignee = { id: "u1", name: "Ana", image: null };
  const bea: Todo.Assignee = { id: "u2", name: "Bea", image: null };

  it("keys by user id and labels with the name", () => {
    const out = group([make({ id: "a", assignee: ana }), make({ id: "b" })], "assignee");
    expect(out.find((g) => g.key === "u1")?.label).toBe("Ana");
    expect(out.find((g) => g.key === "none")?.label).toBe("Unassigned");
  });

  it("keeps same-named buckets apart when ids differ", () => {
    const out = group(
      [
        make({ id: "a", assignee: ana }),
        make({ id: "b", assignee: { ...bea, name: "Ana" } }),
      ],
      "assignee",
    );
    expect(out.length).toBe(2);
  });
});
