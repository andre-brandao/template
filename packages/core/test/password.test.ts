import { describe, expect, it } from "bun:test";
import { Password } from "../src/util/password";

describe("password", () => {
  it("hash produces a self-describing pbkdf2 string", async () => {
    const hash = await Password.hash("hunter2");
    expect(hash).toMatch(/^pbkdf2\$sha256\$600000\$[^$]+\$[^$]+$/);
  });

  it("verify accepts the password that was hashed", async () => {
    const hash = await Password.hash("hunter2");
    expect(await Password.verify("hunter2", hash)).toBe(true);
  });

  it("verify rejects the wrong password", async () => {
    const hash = await Password.hash("hunter2");
    expect(await Password.verify("wrong", hash)).toBe(false);
  });

  it("hash salts each call, so identical passwords produce different stored strings", async () => {
    const a = await Password.hash("hunter2");
    const b = await Password.hash("hunter2");
    expect(a).not.toBe(b);
    expect(await Password.verify("hunter2", a)).toBe(true);
    expect(await Password.verify("hunter2", b)).toBe(true);
  });

  it("verify rejects malformed or tampered stored strings", async () => {
    expect(await Password.verify("hunter2", "garbage")).toBe(false);
    expect(await Password.verify("hunter2", "pbkdf2$sha256$600000$salt")).toBe(false);
    expect(await Password.verify("hunter2", "scrypt$sha256$600000$salt$hash")).toBe(false);
    expect(await Password.verify("hunter2", "pbkdf2$sha1$600000$salt$hash")).toBe(false);
    expect(await Password.verify("hunter2", "pbkdf2$sha256$0$salt$hash")).toBe(false);
    expect(await Password.verify("hunter2", "pbkdf2$sha256$abc$salt$hash")).toBe(false);
  });
});
