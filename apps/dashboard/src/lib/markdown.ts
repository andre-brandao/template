import { Carta } from "carta-md";
import { attachment } from "@cartamd/plugin-attachment";
import DOMPurify from "isomorphic-dompurify";

/** Shared Carta instance for markdown bodies — wires image upload/embed via `/files`. */
export function createCarta() {
  return new Carta({
    sanitizer: DOMPurify.sanitize,
    extensions: [
      attachment({
        supportedMimeTypes: ["image/png", "image/jpeg", "image/gif", "image/svg+xml"],
        async upload(file) {
          const body = new FormData();
          body.append("file", file);
          const res = await fetch("/files", { method: "POST", body });
          if (!res.ok) return null;
          const data = await res.json();
          return data.url;
        },
      }),
    ],
  });
}
