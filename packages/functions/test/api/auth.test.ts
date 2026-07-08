import { describe, expect, test } from "bun:test";
import { app } from "../../src/api/routes";

function register(email: string, password = "hunter2222") {
  return app.request("/auth/register", {
    method: "post",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Test User", email, password }),
  });
}

function login(email: string, password: string) {
  return app.request("/auth/login", {
    method: "post",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

describe("auth", () => {
  test("POST /auth/register creates a session", async () => {
    const email = `test-${crypto.randomUUID()}@example.com`;
    const res = await register(email);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { userID: string; token: string };
    expect(body.userID).toBeDefined();
    expect(body.token).toBeDefined();
  });

  test("POST /auth/register rejects a duplicate email", async () => {
    const email = `test-${crypto.randomUUID()}@example.com`;
    await register(email);
    const res = await register(email);
    expect(res.status).toBe(400);
  });

  test("POST /auth/login succeeds with the right password and fails with the wrong one", async () => {
    const email = `test-${crypto.randomUUID()}@example.com`;
    await register(email, "correct-password");

    const ok = await login(email, "correct-password");
    expect(ok.status).toBe(200);

    const bad = await login(email, "wrong-password");
    expect(bad.status).toBe(401);
  });

  test("POST /auth/logout invalidates the session", async () => {
    const email = `test-${crypto.randomUUID()}@example.com`;
    const registerRes = await register(email);
    const { token } = (await registerRes.json()) as { userID: string; token: string };

    const logoutRes = await app.request("/auth/logout", {
      method: "post",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(logoutRes.status).toBe(200);

    const meRes = await app.request("/me", { headers: { authorization: `Bearer ${token}` } });
    expect(meRes.status).toBe(401);
  });
});
