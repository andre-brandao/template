// Runtime-agnostic password hashing built only on Web Crypto (`crypto.subtle`),
// so it runs the same under Bun, Node, Cloudflare Workers and the browser — no
// native `Bun.password`. PBKDF2-HMAC-SHA256 is the one password KDF Web Crypto
// exposes everywhere. Stored form is self-describing: `pbkdf2$sha256$<iter>$<salt>$<hash>`.

const ITER = 600_000;
const KEYLEN = 32;

export namespace Password {
  export async function hash(pw: string) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const bits = await derive(pw, salt, ITER);
    return `pbkdf2$sha256$${ITER}$${encode(salt)}$${encode(bits)}`;
  }

  export async function verify(pw: string, stored: string) {
    const parts = stored.split("$");
    if (parts.length !== 5 || parts[0] !== "pbkdf2" || parts[1] !== "sha256") return false;

    const iter = Number(parts[2]);
    if (!Number.isInteger(iter) || iter < 1) return false;

    const want = decode(parts[4]!);
    const got = await derive(pw, decode(parts[3]!), iter);
    return equal(got, want);
  }
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

/** Constant-time compare — Web Crypto has no `timingSafeEqual`. */
function equal(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

function encode(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

function decode(s: string) {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}
