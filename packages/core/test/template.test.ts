import { describe, expect } from "bun:test";
import { Email } from "../src/email";
import { Template } from "../src/email/template";
import { Todo } from "../src/todo";
import { withTestUser } from "./util";

const DAY = 86_400_000;

function range() {
  return {
    start: new Date(Date.now() - 6 * DAY).toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10),
  };
}

describe("weekly insights", () => {
  withTestUser("sends a summary of the week", async () => {
    const sent: Parameters<Email.SenderPort["send"]>[0][] = [];
    await Email.provide({ send: async (input) => void sent.push(input) }, async () => {
      const id = await Todo.create({ title: "One" });
      await Todo.create({ title: "Two" });
      await Todo.update({ id, state: "closed" });
      expect(await Template.sendWeeklyInsights(range())).toBe("sent");
    });
    expect(sent).toHaveLength(1);
    expect(sent[0]?.subject).toBe("Your week in todos: 1 done");
    expect(sent[0]?.body).toContain("Created: 2");
    expect(sent[0]?.body).toContain("Completed: 1");
  });

  withTestUser("skips empty weeks", async () => {
    const sent: unknown[] = [];
    await Email.provide({ send: async (input) => void sent.push(input) }, async () => {
      expect(await Template.sendWeeklyInsights(range())).toBe("empty");
    });
    expect(sent).toHaveLength(0);
  });
});
