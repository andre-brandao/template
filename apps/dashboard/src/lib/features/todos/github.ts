/** `github.com/issue` holds "owner/name#12"; the badge label and its url both come from it. */
export function issue(annotations: Record<string, string>) {
  const match = annotations["github.com/issue"]?.match(/^([\w.-]+\/[\w.-]+)#(\d+)$/);
  if (!match) return;
  return { label: match[0], url: `https://github.com/${match[1]}/issues/${match[2]}` };
}
