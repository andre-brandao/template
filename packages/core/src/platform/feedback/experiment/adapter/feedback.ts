import { z } from "zod";
import { clean } from "../../body";
import type { Thread } from "../../port";
import { comment as reply, comments, edit, thread as find } from "../../thread";
import type { Adapter } from "../port";

// Votes are comments on one feedback thread per experiment, one per user: a readable line for
// people, then a hidden marker. Only the last marker in a comment counts.
const Marker = z.object({ variant: z.string(), user: z.string(), name: z.string() });
const MARK = /<!-- vote (\{.*\}) -->/g;

export function feedback(): Adapter {
  return {
    async tally(key, title, user) {
      const ref = await thread(key, title);
      const all = await votes(ref);
      const mine = all.get(user);
      return {
        votes: [...all.values()].reduce<Record<string, number>>(
          (total, one) => ({ ...total, [one.variant]: (total[one.variant] ?? 0) + 1 }),
          {},
        ),
        mine: mine ? { variant: mine.variant, comment: comment(mine.body) } : null,
        url: ref.url,
      };
    },
    async vote(ballot) {
      const ref = await thread(ballot.key, ballot.title);
      const text = ballot.comment ? clean(ballot.comment) : "";
      const line = JSON.stringify({
        variant: ballot.variant,
        user: ballot.user.id,
        name: ballot.user.name,
      });
      const body = `**Vote: ${clean(ballot.label)}**${text ? ` — ${text}` : ""}\n\n<!-- vote ${line} -->`;
      const mine = (await votes(ref)).get(ballot.user.id);
      if (mine) return edit(mine, body);
      await reply(ref, body);
    },
  };
}

// === UTILS ===

function thread(key: string, title: string) {
  return find(`experiment:${key}`, `Experiment: ${title}`);
}

/** Each user's vote comment; with duplicates, the latest by time wins. */
async function votes(ref: Thread) {
  const rows = (await comments(ref)).toSorted((a, b) => a.time.localeCompare(b.time));
  return new Map(
    rows.flatMap((one) => {
      const json = [...one.body.matchAll(MARK)].at(-1)?.[1];
      const vote = json ? Marker.safeParse(parse(json)) : undefined;
      return vote?.success ? [[vote.data.user, { ...one, ...vote.data }] as const] : [];
    }),
  );
}

/** The free text after the bold vote line, without the marker. */
function comment(body: string) {
  return (
    body
      .replace(MARK, "")
      .replace(/^\*\*Vote: [^*]*\*\*( — )?/, "")
      .trim() || null
  );
}

/** A comment typed straight on the tracker may carry a broken marker; it just doesn't count. */
function parse(json: string) {
  try {
    return JSON.parse(json);
  } catch {
    return undefined;
  }
}
