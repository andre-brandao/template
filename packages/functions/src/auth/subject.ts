import { createSubjects } from "@openauthjs/openauth/subject";
import type { Client } from "@openauthjs/openauth/client";
import { Auth } from "@template/core/auth";

/** The issuer's one subject, app-agnostic: every app built from the template reads the same. */
export const subjects = createSubjects({ identity: Auth.Subject });

/** An OpenAuth client as core's `Auth.Issuer` port. `aud` is the client the token was minted for. */
export function verifier(client: Client) {
  return {
    async verify(token: string) {
      // OpenAuth throws on a malformed token rather than returning `err`; both mean "not ours".
      const result = await client.verify(subjects, token).catch(() => null);
      if (!result || result.err) return null;
      return { aud: String(result.aud), subject: result.subject.properties };
    },
  };
}
