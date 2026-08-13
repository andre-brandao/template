import { z } from "zod";
import { fn } from "@template/core/util/fn";
import { Actor } from "@template/core/actor";
import { User } from "@template/core/user";

export namespace Feedback {
  /** Both vars set → the topbar shows the button. */
  export function enabled() {
    return !!(process.env.FEEDBACK_TOKEN && process.env.FEEDBACK_REPO);
  }

  export const create = fn(
    z.object({
      body: z.string().trim().min(10, "Tell us a bit more — at least 10 characters.").max(10000),
      tag: z.enum(["bug", "feature"]),
      urgency: z.enum(["low", "medium", "high"]),
      page: z.string().max(500),
    }),
    async (input) => {
      const token = process.env.FEEDBACK_TOKEN;
      const repo = process.env.FEEDBACK_REPO;
      if (!token || !repo)
        throw new Error("Feedback disabled. Set FEEDBACK_TOKEN and FEEDBACK_REPO.");

      const user = await User.fromID(Actor.userID());
      // The first line stands in for a title; GitHub caps at 256 so truncate well short.
      const line = input.body.split("\n")[0]!.trim();
      const title = line.length > 72 ? `${line.slice(0, 72)}…` : line;
      // Labels need push access to stick, so the trailer repeats them where they can't be lost.
      const lines = [
        input.body,
        "",
        "---",
        `Page: ${input.page}`,
        `Tag: ${input.tag}`,
        `Urgency: ${input.urgency}`,
      ];
      if (user) lines.push(`From: ${user.name} (${user.email})`);

      const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          accept: "application/vnd.github+json",
          "content-type": "application/json",
          "user-agent": "template-feedback",
        },
        body: JSON.stringify({
          title,
          body: lines.join("\n").trim(),
          labels: [input.tag, `urgency:${input.urgency}`],
        }),
      });
      if (!res.ok) throw new Error(`GitHub issue failed: ${res.status} ${await res.text()}`);
      const json = (await res.json()) as { html_url: string };
      return { url: json.html_url };
    },
  );
}
