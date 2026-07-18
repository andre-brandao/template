import { describe, expect, it } from "bun:test";
import { User } from "../src/user";
import { Auth } from "../src/user/auth";
import { Actor } from "../src/actor";
import { ProviderIds } from "../src/user/provider.sql";
import { testEmail, withTestUser } from "./util";

describe("user", () => {
  it("providers reports email as connected after provisioning, and never leaks a password", async () => {
    const email = testEmail();
    const userID = await Auth.provision({ provider: "email", accountId: email, email });

    const providers = await Actor.provide("user", { userID }, () => User.providers());

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
});
