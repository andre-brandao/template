/** Frames lines in a box, the same shape the console email sender draws. */
export function boxed(lines: string[]) {
  const width = Math.max(...lines.map((line) => line.length));
  const rule = "═".repeat(width + 2);
  return [
    "",
    `╔${rule}╗`,
    ...lines.map((line) => `║ ${line.padEnd(width, " ")} ║`),
    `╚${rule}╝`,
    "",
  ].join("\n");
}
