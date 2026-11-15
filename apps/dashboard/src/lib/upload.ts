/** Uploads a markdown attachment via the files API, returning its content URL. */
export async function upload(file: File) {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/api/file", { method: "POST", body });
  if (!res.ok) return null;
  const data: { key: string } = await res.json();
  return `/api/file/${encodeURIComponent(data.key.split("/").at(-1) ?? "")}/content`;
}
