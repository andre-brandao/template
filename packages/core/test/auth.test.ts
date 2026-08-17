import { describe, expect, it } from "bun:test";
import { Auth } from "../src/user/auth";
import { User } from "../src/user";
import { Actor } from "../src/actor";
import { Email } from "../src/lib/email";
import { testEmail } from "./util";

describe("auth", () => {
  it("provision creates a user on first sight", async () => {
    const email = testEmail();
    const userID = await Auth.provision({ provider: "email", accountId: email, email });

    const user = await User.fromID(userID);
    expect(user?.email).toBe(email);
  });

  it("provision is idempotent for the same provider identity", async () => {
    const email = testEmail();
    const first = await Auth.provision({ provider: "email", accountId: email, email });
    const second = await Auth.provision({ provider: "email", accountId: email, email });

    expect(second).toBe(first);
  });

  it("provision links a new provider onto an existing email", async () => {
    const email = testEmail();
    const viaEmail = await Auth.provision({ provider: "email", accountId: email, email });
    const viaGithub = await Auth.provision({ provider: "github", accountId: "gh-123", email });

    // Same person, two providers → one user.
    expect(viaGithub).toBe(viaEmail);
  });

  it("provision keeps distinct emails distinct", async () => {
    const one = testEmail();
    const two = testEmail();
    const a = await Auth.provision({ provider: "email", accountId: one, email: one });
    const b = await Auth.provision({ provider: "email", accountId: two, email: two });

    expect(a).not.toBe(b);
  });

  it("provision stores provider tokens and refreshes them on re-login", async () => {
    const email = testEmail();
    const userID = await Auth.provision({
      provider: "github",
      accountId: "gh-42",
      email,
      tokens: { access: "tok-1", refresh: "ref-1" },
    });

    const first = await Actor.provide("user", { userID, role: "member" }, () =>
      Auth.tokens("github"),
    );
    expect(first?.access).toBe("tok-1");
    expect(first?.refresh).toBe("ref-1");

    // A second login for the same identity updates the stored tokens.
    await Auth.provision({
      provider: "github",
      accountId: "gh-42",
      email,
      tokens: { access: "tok-2", refresh: "ref-2" },
    });
    const second = await Actor.provide("user", { userID, role: "member" }, () =>
      Auth.tokens("github"),
    );
    expect(second?.access).toBe("tok-2");
  });

  it("tokens returns null for a provider the user has not connected", async () => {
    const email = testEmail();
    const userID = await Auth.provision({ provider: "email", accountId: email, email });

    const tokens = await Actor.provide("user", { userID, role: "member" }, () =>
      Auth.tokens("github"),
    );
    expect(tokens).toBeNull();
  });
});

describe("auth password", () => {
  /** A password is something an existing account gains, so every case starts with one. */
  async function account() {
    const email = testEmail();
    const userID = await Auth.provision({ provider: "email", accountId: email, email });
    return { email, userID };
  }

  const as = <T>(userID: string, fn: () => Promise<T>) =>
    Actor.provide("user", { userID, role: "member" }, fn);

  it("a password set on an account logs it back in", async () => {
    const { email, userID } = await account();
    await as(userID, () => Auth.Pass.set({ password: "password123" }));

    expect(await Auth.Pass.login({ email, password: "password123" })).toBe(userID);
  });

  it("setting a password again replaces the old one", async () => {
    const { email, userID } = await account();
    await as(userID, () => Auth.Pass.set({ password: "password123" }));
    await as(userID, () => Auth.Pass.set({ password: "second-password" }));

    expect(await Auth.Pass.login({ email, password: "second-password" })).toBe(userID);
    await expect(Auth.Pass.login({ email, password: "password123" })).rejects.toThrow(
      "Invalid email or password",
    );
  });

  it("login rejects a wrong password", async () => {
    const { email, userID } = await account();
    await as(userID, () => Auth.Pass.set({ password: "password123" }));

    await expect(Auth.Pass.login({ email, password: "wrong-password" })).rejects.toThrow(
      "Invalid email or password",
    );
  });

  it("login rejects an account that never set one", async () => {
    const { email } = await account();

    await expect(Auth.Pass.login({ email, password: "password123" })).rejects.toThrow(
      "Invalid email or password",
    );
  });

  it("the hash never comes back out through tokens", async () => {
    const { userID } = await account();
    await as(userID, () => Auth.Pass.set({ password: "password123" }));

    // `tokens` takes `OauthIds`, so "password" is not even expressible here — the closest
    // a caller gets is asking for a provider this account has not connected.
    expect(await as(userID, () => Auth.tokens("github"))).toBeNull();
  });
});

describe("auth code", () => {
  /** Runs `fn` with a capturing mail port and hands back the code the template wrote. */
  async function code(email: string) {
    const sent: string[] = [];
    await Email.provide({ send: async (msg) => void sent.push(msg.body) }, () =>
      Auth.Code.request({ email }),
    );
    return sent.join("").match(/\b(\d{6})\b/)![1]!;
  }

  it("a code logs in and creates the account on first sight", async () => {
    const email = testEmail();
    const userID = await Auth.Code.verify({ email, code: await code(email) });

    const user = await User.fromID(userID);
    expect(user?.email).toBe(email);
  });

  it("a second code for a known address lands on the same user", async () => {
    const email = testEmail();
    const first = await Auth.Code.verify({ email, code: await code(email) });
    const second = await Auth.Code.verify({ email, code: await code(email) });

    expect(second).toBe(first);
  });

  it("a code is spent once", async () => {
    const email = testEmail();
    const one = await code(email);
    await Auth.Code.verify({ email, code: one });

    await expect(Auth.Code.verify({ email, code: one })).rejects.toThrow("wrong or has expired");
  });

  it("a wrong code retires the real one", async () => {
    const email = testEmail();
    const real = await code(email);

    await expect(Auth.Code.verify({ email, code: "000000" })).rejects.toThrow(
      "wrong or has expired",
    );
    // No attempt counter to keep: the row is gone, so the code that was right is dead too.
    await expect(Auth.Code.verify({ email, code: real })).rejects.toThrow("wrong or has expired");
  });

  it("requesting again retires the previous code", async () => {
    const email = testEmail();
    const first = await code(email);
    await code(email);

    // Had the first request's row survived alongside the second, this would have logged in.
    await expect(Auth.Code.verify({ email, code: first })).rejects.toThrow("wrong or has expired");
  });
});
