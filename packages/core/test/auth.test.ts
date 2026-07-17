import { describe, expect, it } from "bun:test";
import { Auth } from "../src/user/auth";
import { User } from "../src/user";
import { Actor } from "../src/actor";
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

    const first = await Actor.provide("user", { userID }, () => Auth.tokens("github"));
    expect(first?.access).toBe("tok-1");
    expect(first?.refresh).toBe("ref-1");

    // A second login for the same identity updates the stored tokens.
    await Auth.provision({
      provider: "github",
      accountId: "gh-42",
      email,
      tokens: { access: "tok-2", refresh: "ref-2" },
    });
    const second = await Actor.provide("user", { userID }, () => Auth.tokens("github"));
    expect(second?.access).toBe("tok-2");
  });

  it("tokens returns null for a provider the user has not connected", async () => {
    const email = testEmail();
    const userID = await Auth.provision({ provider: "email", accountId: email, email });

    const tokens = await Actor.provide("user", { userID }, () => Auth.tokens("github"));
    expect(tokens).toBeNull();
  });
});
