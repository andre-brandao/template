import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { fn } from "../util/fn";
import { Password } from "../util/password";
import { Key } from "../key";
import { Database } from "../drizzle";
import { ErrorCodes, VisibleError } from "../error";
import { Identifier } from "../identifier";
import { UserTable } from "./user.sql";
import { ProviderTable } from "./provider.sql";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

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

      const password = await Password.hash(input.password);
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

      return session(userID);
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

    const valid = await Password.verify(input.password, provider.password);
    if (!valid)
      throw new VisibleError(
        "authentication",
        ErrorCodes.Authentication.INVALID_CREDENTIALS,
        "Invalid email or password",
      );

    return session(provider.userID);
  });

  export const logout = fn(z.string(), (token) => Key.revoke(token));

  export const verify = fn(z.string(), (token) => Key.verify(token));

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

  /** A login is just a `session` key — same secret shape as an API key, but it expires. */
  async function session(userID: string) {
    const key = await Key.create({
      userID,
      type: "session",
      name: "session",
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    });
    return { userID, token: key.key };
  }
}
