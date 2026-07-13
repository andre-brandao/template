import { z } from "zod";
import { and, eq, gt } from "drizzle-orm";
import { fn } from "../util/fn";
import { Database } from "../drizzle";
import { ErrorCodes, VisibleError } from "../error";
import { Identifier } from "../identifier";
import { UserTable } from "./user.sql";
import { ProviderTable } from "./provider.sql";
import { SessionTable } from "./session.sql";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function createToken() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const array = new Uint32Array(48);
  crypto.getRandomValues(array);
  return Array.from(array, (n) => chars[n % chars.length]!).join("");
}

export namespace Auth {
  export const register = fn(
    z.object({ name: z.string().min(1), email: z.email(), password: z.string().min(8) }),
    async (input) => {
      const existing = await account(input.email);
      if (existing)
        throw new VisibleError(
          "validation",
          ErrorCodes.Validation.ALREADY_EXISTS,
          "Email is already registered",
        );

      const password = await Bun.password.hash(input.password);
      const userID = Identifier.create("user");
      await Database.transaction(async (tx) => {
        await tx.insert(UserTable).values({ id: userID, name: input.name, email: input.email });
        await tx.insert(ProviderTable).values({
          id: Identifier.create("provider"),
          userID,
          providerId: "email",
          accountId: input.email,
          password,
        });
      });

      return createSession(userID);
    },
  );

  export const login = fn(z.object({ email: z.email(), password: z.string() }), async (input) => {
    const provider = await account(input.email);
    if (!provider?.password)
      throw new VisibleError(
        "authentication",
        ErrorCodes.Authentication.INVALID_CREDENTIALS,
        "Invalid email or password",
      );

    const valid = await Bun.password.verify(input.password, provider.password);
    if (!valid)
      throw new VisibleError(
        "authentication",
        ErrorCodes.Authentication.INVALID_CREDENTIALS,
        "Invalid email or password",
      );

    return createSession(provider.userID);
  });

  export const logout = fn(z.string(), (token) =>
    Database.use((tx) => tx.delete(SessionTable).where(eq(SessionTable.id, token))),
  );

  export const verifySession = fn(z.string(), (token) =>
    Database.use((tx) =>
      tx
        .select({ userID: SessionTable.userID })
        .from(SessionTable)
        .where(and(eq(SessionTable.id, token), gt(SessionTable.expiresAt, new Date())))
        .then((rows) => rows.at(0)?.userID ?? null),
    ),
  );

  function account(email: string) {
    return Database.use((tx) =>
      tx
        .select({
          id: ProviderTable.id,
          userID: ProviderTable.userID,
          password: ProviderTable.password,
        })
        .from(ProviderTable)
        .where(and(eq(ProviderTable.providerId, "email"), eq(ProviderTable.accountId, email)))
        .then((rows) => rows.at(0)),
    );
  }

  async function createSession(userID: string) {
    const token = createToken();
    await Database.use((tx) =>
      tx.insert(SessionTable).values({
        id: token,
        userID,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      }),
    );
    return { userID, token };
  }
}
