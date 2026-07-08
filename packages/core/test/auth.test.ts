import { describe, expect } from "bun:test";
import { it } from "bun:test";
import { Auth } from "../src/user/auth";
import { User } from "../src/user";
import { testEmail } from "./util";

describe("auth", () => {
  it("register creates a user and a session", async () => {
    const email = testEmail();
    const { userID, token } = await Auth.register({ name: "Test User", email, password: "hunter2222" });

    const user = await User.fromID(userID);
    expect(user?.email).toBe(email);

    const sessionUserID = await Auth.verifySession(token);
    expect(sessionUserID).toBe(userID);
  });

  it("register rejects a duplicate email", async () => {
    const email = testEmail();
    await Auth.register({ name: "Test User", email, password: "hunter2222" });
    await expect(Auth.register({ name: "Someone Else", email, password: "hunter2222" })).rejects.toThrow();
  });

  it("login succeeds with the right password and fails with the wrong one", async () => {
    const email = testEmail();
    const { userID } = await Auth.register({ name: "Test User", email, password: "hunter2222" });

    const login = await Auth.login({ email, password: "hunter2222" });
    expect(login.userID).toBe(userID);

    await expect(Auth.login({ email, password: "wrong-password" })).rejects.toThrow();
  });

  it("logout invalidates the session", async () => {
    const email = testEmail();
    const { token } = await Auth.register({ name: "Test User", email, password: "hunter2222" });

    await Auth.logout(token);
    const sessionUserID = await Auth.verifySession(token);
    expect(sessionUserID).toBeNull();
  });
});
