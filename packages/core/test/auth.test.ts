import { describe, expect, it } from "bun:test";
import { Auth } from "../src/auth";
import { User } from "../src/user";
import { Identity } from "../src/identity";
import { Permission } from "../src/permission";
import { Email } from "../src/lib/email";
import { Key } from "../src/platform/key";
import { Delegation } from "../src/auth/delegation";
import { createUser, testEmail } from "./util";

describe("auth", () => {
  it("link creates a user on first sight", async () => {
    const email = testEmail();
    const userID = await Auth.link({ provider: "email", accountId: email, email });

    const user = await User.fromID(userID);
    expect(user?.email).toBe(email);
  });

  it("link is idempotent for the same provider identity", async () => {
    const email = testEmail();
    const first = await Auth.link({ provider: "email", accountId: email, email });
    const second = await Auth.link({ provider: "email", accountId: email, email });

    expect(second).toBe(first);
  });

  it("link links a new provider onto an existing email", async () => {
    const email = testEmail();
    const viaEmail = await Auth.link({ provider: "email", accountId: email, email });
    const viaGithub = await Auth.link({ provider: "github", accountId: "gh-123", email });

    // Same person, two providers → one user.
    expect(viaGithub).toBe(viaEmail);
  });

  it("link keeps distinct emails distinct", async () => {
    const one = testEmail();
    const two = testEmail();
    const a = await Auth.link({ provider: "email", accountId: one, email: one });
    const b = await Auth.link({ provider: "email", accountId: two, email: two });

    expect(a).not.toBe(b);
  });

  it("link refuses an App account", async () => {
    const email = testEmail();
    await createUser({ name: "CI", email, kind: "system" });
    await expect(Auth.link({ provider: "email", accountId: email, email })).rejects.toThrow(
      "App accounts can't log in",
    );
  });
});

describe("auth password", () => {
  /** A password is something an existing account gains, so every case starts with one. */
  async function account() {
    const email = testEmail();
    const userID = await Auth.link({ provider: "email", accountId: email, email });
    return { email, userID };
  }

  const as = <T>(userID: string, fn: () => Promise<T>) =>
    Identity.provide("user", { userID, role: "member" }, fn);

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

describe("auth resolve", () => {
  const as = <T>(userID: string, fn: () => Promise<T>) =>
    Identity.provide("user", { userID, role: "member" }, fn);

  it("an api key resolves to its user, a bot's key to a bot carrying its owner", async () => {
    const human = await createUser({ name: "Ada", email: testEmail() });
    const bot = await createUser({
      name: "CI",
      email: testEmail(),
      kind: "system",
      ownerID: human.id,
    });
    const one = await Key.mint({ userID: human.id, name: "k" });
    const two = await Key.mint({ userID: bot.id, name: "k" });

    const mine = await Auth.resolve(one.key!);
    expect(mine.type === "user" && mine.properties.credential).toBe(one.id);
    expect(await Auth.resolve(two.key!)).toEqual({
      type: "system",
      properties: {
        userID: bot.id,
        role: "member",
        owner: { userID: human.id, role: "member" },
        credential: two.id,
      },
    });
  });

  it("a bot never outranks its owner, and dies with them", async () => {
    const human = await createUser({ name: "Ada", email: testEmail() });
    const bot = await createUser({
      name: "CI",
      email: testEmail(),
      kind: "system",
      ownerID: human.id,
    });
    await Identity.internal("test", Permission.all, () =>
      User.assign({ id: bot.id, role: "admin" }),
    );
    const key = await Key.mint({ userID: bot.id, name: "k" });

    await Identity.enter(await Auth.resolve(key.key!), async () => {
      expect(Identity.can({ todo: ["read"] })).toBe(true);
      expect(Identity.can({ admin: ["read"] })).toBe(false);
    });

    await Identity.internal("test", Permission.all, () => User.remove(human.id));
    await expect(Auth.resolve(key.key!)).rejects.toThrow("owner is no longer active");
  });

  it("a delegation resolves to an agent acting for its user, narrowed to its scope", async () => {
    const user = await createUser({ name: "Ada", email: testEmail() });
    const token = await as(user.id, () =>
      Delegation.create({ name: "copilot", scope: { todo: ["read"] } }),
    );
    const info = await Auth.resolve(token);
    expect(info.type).toBe("agent");
    await Identity.enter(info, async () => {
      expect(Identity.userID()).toBe(user.id);
      expect(Identity.can({ todo: ["read"] })).toBe(true);
      expect(Identity.can({ todo: ["create"] })).toBe(false);
    });
  });

  it("a scoped agent can only mint a delegation as narrow as itself", async () => {
    const user = await createUser({ name: "Ada", email: testEmail() });
    const token = await as(user.id, () =>
      Delegation.create({ name: "copilot", scope: { todo: ["read"] } }),
    );
    await Identity.enter(await Auth.resolve(token), async () => {
      await expect(
        Delegation.create({ name: "sub", scope: { todo: ["read", "delete"] } }),
      ).rejects.toThrow(/can't hold more/);
      // No scope inherits the lender's, never the whole role.
      const sub = await Auth.resolve(await Delegation.create({ name: "sub" }));
      expect(sub.type === "agent" && sub.properties.scope).toEqual({ todo: ["read"] });
    });
  });

  it("an unknown bearer is a 401", async () => {
    await expect(Auth.resolve("agt-nope")).rejects.toThrow("Invalid or expired delegation");
    await expect(Auth.resolve("sk-nope")).rejects.toThrow("Invalid or expired API key");
    // No issuer port provided, so a JWT has nothing to verify it.
    await expect(Auth.resolve("eyJ.a.b")).rejects.toThrow("Invalid or expired token");
  });

  it("an issuer token links its subject; an MCP client's works only on the MCP", async () => {
    const email = testEmail();
    const subject = { id: "github:7", provider: "github" as const, email };
    const issuer = (aud: string) => ({ verify: async () => ({ aud, subject }) });

    const user = await Auth.Issuer.provide(issuer("dashboard"), () => Auth.resolve("jwt"));
    expect(user.type).toBe("user");

    const mcp = issuer("mcp:claude");
    await expect(Auth.Issuer.provide(mcp, () => Auth.resolve("jwt"))).rejects.toThrow(
      "issued for an MCP client",
    );
    const agent = await Auth.Issuer.provide(mcp, () => Auth.resolve("jwt", "mcp"));
    expect(agent.type === "agent" && agent.properties.name).toBe("claude");
    expect(agent.type === "agent" && agent.properties.userID).toBe(
      user.type === "user" ? user.properties.userID : "",
    );
  });
});
