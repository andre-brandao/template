import { beforeAll, expect, test as _test, mock } from "bun:test";
import { app } from "../../src/api/routes";
import { User } from "@template/core/user";
import { Key } from "@template/core/key";
import { Actor } from "@template/core/actor";
import { z } from "zod";

/**
 * Setup API test environment with an authenticated user and utility functions.
 */
export function setupApiTest() {
  let userID: string;
  let token: string;

  const withContext = async <T>(fn: () => T | Promise<T>): Promise<T> => {
    return Actor.provide("user", { userID }, fn);
  };

  beforeAll(async () => {
    console.log = mock();
    console.info = mock();
    console.warn = mock();
    console.error = mock();

    const email = `test-${crypto.randomUUID()}@example.com`;
    userID = await User.create({ name: "Test User", email });
    token = (await Key.create({ userID, name: "test" })).key;
  });

  const get = async (path: string, headers?: Record<string, string>) => {
    return app.request(path, { headers: { authorization: `Bearer ${token}`, ...headers } });
  };

  const post = async (path: string, body: any, headers?: Record<string, string>) => {
    return app.request(path, {
      method: "post",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
  };

  const patch = async (path: string, body: any, headers?: Record<string, string>) => {
    return app.request(path, {
      method: "patch",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
  };

  const del = async (path: string, headers?: Record<string, string>) => {
    return app.request(path, {
      method: "delete",
      headers: { authorization: `Bearer ${token}`, ...headers },
    });
  };

  const noAuth = (...args: Parameters<typeof app.request>) => app.request(...args);

  const test = (
    label: string,
    fn: () => void | Promise<unknown>,
    options?: Parameters<typeof _test>[2],
  ) => {
    return _test(label, () => withContext(fn), options);
  };

  const request = async (method: string = "get", path: string, body?: any): Promise<any> => {
    switch (method) {
      case "get":
        return await get(path);
      case "post":
        return await post(path, body);
      case "patch":
        return await patch(path, body);
      case "delete":
        return await del(path);
      default:
        throw new Error("Method not supported: " + method);
    }
  };

  /** Drives a route through the OpenAPI spec: happy path, unauthenticated, and 400/404 if declared. */
  const validateOpenAPIRoute = async (
    method: "get" | "post" | "patch" | "delete" = "get",
    path: string,
    params?: Record<string, string>,
    body?: any,
  ) => {
    const { SchemaValidator } = await import("./schema-validator");

    const originalPath = path.toLowerCase();

    const pathNames = new Set(
      path
        .split("/")
        .filter((x) => x.startsWith(":"))
        .map((x) => x.slice(1)),
    );
    path = path.replace(/:[^/]+/g, (x) => params![x.slice(1)]!);

    const query = Object.entries(params ?? {}).filter(([k]) => !pathNames.has(k));
    if (query.length > 0) path = `${path}?${new URLSearchParams(query)}`;

    const statusCodes = await SchemaValidator.getRouteResponseStatusCodes(originalPath, method);
    const requiresAuth = statusCodes.includes(401);

    const response = await request(method, path, body);
    expect(response.status).toBe(200);
    const data = await SchemaValidator.validateResponse(response, path, method);

    const unauthRes = await noAuth(path, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (requiresAuth) {
      expect(unauthRes.status).toBe(401);
    } else {
      expect(unauthRes.status).toBe(200);
    }
    await SchemaValidator.validateResponse(unauthRes, path, method);

    if (statusCodes.includes(400)) {
      const invalidBody = await SchemaValidator.createInvalidRequestBody(originalPath, method);
      if (invalidBody) {
        const badReqRes = await request(method, path, invalidBody);
        expect(badReqRes.status).toBe(400);
        await SchemaValidator.validateResponse(badReqRes, path, method);
      }
    }

    if (statusCodes.includes(404)) {
      const notFoundPath = originalPath.replace(/:[^/]+/g, "fake-param");
      const notFoundRes = await request(method, notFoundPath, body);
      expect(notFoundRes.status).toBe(404);
      await SchemaValidator.validateResponse(notFoundRes, notFoundPath, method);
    }

    return data;
  };

  const resultSchema = <T extends z.ZodType>(schema: T) => z.object({ data: schema });

  const expectError = async (response: Response, expectedStatus: number, expectedCode?: string) => {
    expect(response.status).toBe(expectedStatus);
    if (expectedCode) {
      const data = await response.json();
      expect(data).toHaveProperty("code", expectedCode);
    }
  };

  return {
    get,
    post,
    patch,
    del,
    noAuth,
    test,
    validateOpenAPIRoute,
    resultSchema,
    expectError,
    userID: () => userID,
    token: () => token,
  };
}
