// Bytes helpers shared by the things that hash: base64 both ways, and a compare that
// doesn't leak how far it got. Web Crypto only, so it runs under Bun, Node and Workers.

export function encode(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

export function decode(s: string) {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

/** SHA-256. For high-entropy input only — anything guessable wants `Password.hash`. */
export async function digest(raw: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw)));
}

/** Constant-time compare — Web Crypto has no `timingSafeEqual`. */
export function equal(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}
