const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/** 64 random alphanumerics behind a prefix — `sk-` for API keys, `whsec_` for webhooks. */
export function token(prefix: string) {
  const bytes = new Uint32Array(64);
  crypto.getRandomValues(bytes);
  return prefix + Array.from(bytes, (n) => CHARS[n % CHARS.length]!).join("");
}
