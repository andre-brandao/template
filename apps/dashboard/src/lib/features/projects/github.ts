/** `github.com/repos` holds "owner/a,owner/b". */
export function repos(annotations: Record<string, string>) {
  return (annotations["github.com/repos"] ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({ name, url: `https://github.com/${name}` }));
}
