const colors: Record<string, string> = {
  pending: "var(--pending)",
  in_progress: "var(--progress)",
  done: "var(--done)",
};

export function label(status: string) {
  const words = status.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function color(status: string) {
  return colors[status] ?? "var(--accent)";
}
