// Password hashing on Web Crypto only, so it runs under Bun, Node, Workers and the
// browser. Stored form is self-describing: `pbkdf2$sha256$<iter>$<salt>$<hash>`.

import { decode, encode, equal } from "./hash";

const ITER = 600_000;
const KEYLEN = 32;

export namespace Password {
  export async function hash(pw: string) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const bits = await derive(pw, salt, ITER);
    return `pbkdf2$sha256$${ITER}$${encode(salt)}$${encode(bits)}`;
  }

  export async function verify(pw: string, stored: string) {
    const p = parse(stored);
    if (!p) return false;
    const got = await derive(pw, p.salt, p.iter);
    return equal(got, p.hash);
  }
}

function parse(stored: string) {
  const parts = stored.split("$");
  if (parts.length !== 5 || parts[0] !== "pbkdf2" || parts[1] !== "sha256") return;

  const iter = Number(parts[2]);
  if (!Number.isInteger(iter) || iter < 1) return;

  return { iter, salt: decode(parts[3]!), hash: decode(parts[4]!) };
}

async function derive(pw: string, salt: Uint8Array<ArrayBuffer>, iter: number) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" },
    key,
    KEYLEN * 8,
  );
  return new Uint8Array(bits);
}
