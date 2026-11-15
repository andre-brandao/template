// The keyboard and search model `Command` and `Combobox` share.

export type Part = { text: string; hit: boolean };

type Range = [number, number];

/** The next index for ↑/↓/Home/End over `n` rows, wrapping; undefined for any other key. */
export function step(key: string, at: number, n: number) {
  const to = (
    { ArrowDown: at + 1, ArrowUp: at - 1, Home: 0, End: n - 1 } as Record<string, number>
  )[key];
  if (to === undefined || !n) return undefined;
  return (to + n) % n;
}

/** Buckets `list` by `by`, groups and members both in first-seen order. */
export function bucket<T>(list: T[], by: (one: T) => string) {
  const map = new Map<string, T[]>();
  list.forEach((one) => {
    const name = by(one);
    const group = map.get(name) ?? [];
    group.push(one);
    map.set(name, group);
  });
  return [...map].map((entry) => ({ name: entry[0], items: entry[1] }));
}

export const words = (query: string) => query.toLowerCase().split(/\s+/).filter(Boolean);

// Longest first, so "gpt5" can still split into "gpt" + "5" when "gpt5" alone fails.
function walk(segs: RegExpExecArray[], rest: string, from: number): Range[] | undefined {
  if (!rest) return [];
  for (let i = from; i < segs.length; i++) {
    const seg = segs[i];
    const most = [...seg[0]].findIndex((char, n) => char !== rest[n]);
    for (let n = most < 0 ? Math.min(seg[0].length, rest.length) : most; n > 0; n--) {
      const tail = walk(segs, rest.slice(n), i + 1);
      if (tail) return [[seg.index, seg.index + n], ...tail];
    }
  }
  return undefined;
}

// A substring, or prefixes of successive letter/digit runs: "g6" finds "gpt-6".
function find(text: string, word: string) {
  const at = text.indexOf(word);
  if (at >= 0) return [[at, at + word.length] as Range];
  return walk([...text.matchAll(/\p{L}+|\p{N}+/gu)], word.replace(/[^\p{L}\p{N}]/gu, ""), 0);
}

/**
 * `text` split into hit and plain parts when every word matches it, in any order;
 * undefined when one does not. No words: one plain part.
 */
export function mark(text: string, list: string[]): Part[] | undefined {
  const low = text.toLowerCase();
  const found = list.map((word) => find(low, word));
  if (found.some((one) => !one)) return undefined;
  const hits = new Set(found.flatMap((one) => one ?? []).flatMap((range) => spread(range)));
  return text.split("").reduce<Part[]>((parts, char, i) => {
    const hit = hits.has(i);
    const last = parts.at(-1);
    if (last?.hit === hit) last.text += char;
    if (last?.hit !== hit) parts.push({ text: char, hit });
    return parts;
  }, []);
}

const spread = (range: Range) =>
  Array.from({ length: range[1] - range[0] }, (_, n) => range[0] + n);
