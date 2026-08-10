/** Uploads a markdown attachment via `/files`, returning its public URL. */
export async function upload(file: File) {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/files", { method: "POST", body });
  if (!res.ok) return null;
  const data = await res.json();
  return data.url as string;
}
