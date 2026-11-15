/** A link chip reads its title, else the bare host. */
export function label(link: { url: string; title?: string }) {
  if (link.title) return link.title;
  return URL.canParse(link.url) ? new URL(link.url).hostname : link.url;
}
