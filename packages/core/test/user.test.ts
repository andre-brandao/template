import { describe, expect, it } from "bun:test";
import { User } from "../src/user";
import { Auth } from "../src/user/auth";
import { Actor } from "../src/actor";
import { ProviderIds } from "../src/user/provider.sql";
import { DEFAULTS, zone } from "../src/user/prefs";
import { testEmail, withTestUser } from "./util";

describe("user", () => {
  it("providers reports email as connected after provisioning, and never leaks a password", async () => {
    const email = testEmail();
    const userID = await Auth.provision({ provider: "email", accountId: email, email });

    const providers = await Actor.provide("user", { userID, role: "member" }, () =>
      User.providers(),
    );

    // Every known provider is listed, connected or not.
    expect(providers.map((provider) => provider.id)).toEqual([...ProviderIds]);

    const provider = providers.find((provider) => provider.id === "email")!;
    expect(provider.connected).toBe(true);
    expect(provider.accountId).toBe(email);
    expect(provider.timeCreated).not.toBeNull();
    expect(provider).not.toHaveProperty("password");

    // Nothing else is wired up yet.
    expect(providers.filter((provider) => provider.connected)).toHaveLength(1);
    expect(providers.find((provider) => provider.id === "github")).toMatchObject({
      connected: false,
      accountId: null,
    });
  });

  withTestUser("providers are scoped to the actor", async () => {
    const email = testEmail();
    const otherID = await Auth.provision({ provider: "email", accountId: email, email });
    expect(otherID).toBeString();

    // This user was created directly, so it has no provider rows of its own —
    // and must not see the other user's.
    const providers = await User.providers();
    expect(providers.every((provider) => !provider.connected)).toBe(true);
  });

  withTestUser("can be looked up by id and email", async ({ userID, email }) => {
    const byID = await User.fromID(userID);
    expect(byID?.email).toBe(email);

    const byEmail = await User.fromEmail(email);
    expect(byEmail?.id).toBe(userID);
  });

  withTestUser("update changes the name", async ({ userID }) => {
    await User.update({ name: "New Name" });
    const user = await User.fromID(userID);
    expect(user?.name).toBe("New Name");
  });

  withTestUser("a new user starts with every preference defaulted", async ({ userID }) => {
    const user = await User.fromID(userID);
    expect(user?.prefs).toEqual(DEFAULTS);
  });

  withTestUser("prefs writes only the keys it is given", async ({ userID }) => {
    await User.prefs({ theme: "dark" });
    expect((await User.fromID(userID))?.prefs).toEqual({ ...DEFAULTS, theme: "dark" });

    // The regression test that matters: a second partial write must not reset `theme`
    // back to its default. See the `.partial()` note in src/user/prefs.ts.
    await User.prefs({ locale: "pt-BR" });
    expect((await User.fromID(userID))?.prefs).toEqual({
      ...DEFAULTS,
      theme: "dark",
      locale: "pt-BR",
    });
  });

  // Clearing means "unset", not "UTC" — the next browser to report seeds it again.
  withTestUser("prefs stores a timezone and clears it back to unset", async ({ userID }) => {
    await User.prefs({ zone: "America/Sao_Paulo" });
    expect((await User.fromID(userID))?.prefs.zone).toBe("America/Sao_Paulo");

    await User.prefs({ zone: null });
    expect((await User.fromID(userID))?.prefs.zone).toBeNull();
  });

  withTestUser("a zone reads as UTC until one is stored", async ({ userID }) => {
    expect((await User.fromID(userID))?.prefs.zone).toBeNull();
    expect(zone((await User.fromID(userID))!.prefs)).toBe("UTC");

    await User.prefs({ zone: "America/Sao_Paulo" });
    expect(zone((await User.fromID(userID))!.prefs)).toBe("America/Sao_Paulo");
  });

  withTestUser("prefs rejects a zone Intl does not know", async ({ userID }) => {
    expect(() => User.prefs({ zone: "Mars/Olympus" })).toThrow();
    expect((await User.fromID(userID))?.prefs.zone).toBeNull();
  });

  // `Intl.supportedValuesOf("timeZone")` disagrees across engines — V8 omits these, JSC
  // lists them — so validating by that list let the server store a zone the browser then
  // rejected, killing hydration. Every engine's `DateTimeFormat` accepts them.
  withTestUser("prefs accepts zones the supported-values list leaves out", async ({ userID }) => {
    for (const name of ["UTC", "Etc/UTC", "Etc/GMT+3"]) {
      await User.prefs({ zone: name });
      expect((await User.fromID(userID))?.prefs.zone).toBe(name);
    }
  });

  withTestUser("prefs rejects a value outside the enum", async ({ userID }) => {
    const bad: any = { theme: "neon" };
    expect(() => User.prefs(bad)).toThrow();
    expect((await User.fromID(userID))?.prefs.theme).toBe("system");
  });
});
