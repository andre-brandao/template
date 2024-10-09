import { Lucia } from "lucia";
import { dev } from "$app/environment";
import type { TenantDbType } from "./db/tenant";
import { DrizzleSQLiteAdapter } from "@lucia-auth/adapter-drizzle";
import { sessionTable, userTable } from "./db/tenant/schema";

export function getLuciaForTenant(db: TenantDbType) {
  // @ts-expect-error fix later, idk why it's complaining about db
  const adapter = new DrizzleSQLiteAdapter(db, sessionTable, userTable);
  return new Lucia(adapter, {
    sessionCookie: {
      attributes: {
        secure: !dev,
      },
    },
    getUserAttributes: (attributes) => {
      return {
        id: attributes.id,
        username: attributes.username,
        email: attributes.email,
        role: attributes.role,
      };
    },
  });
}

declare module "lucia" {
  interface Register {
    Lucia: ReturnType<typeof getLuciaForTenant>;
    DatabaseUserAttributes: {
      id: string;
      username: string;
      email: string;
      role: "admin" | "customer";
    };
    UserId: string;
  }
}

export type LuciaType = ReturnType<typeof getLuciaForTenant>;
