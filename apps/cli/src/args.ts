/** Read the value following `flag` in a raw arg list, if present. */
export function value(args: string[], flag: string) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}

/** Drop the given `--flag value` pairs from a raw arg list. */
export function strip(args: string[], flags: string[]) {
  const out: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (flags.includes(args[i]!)) {
      i++;
      continue;
    }
    out.push(args[i]!);
  }
  return out;
}
