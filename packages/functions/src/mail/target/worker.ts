import type { ForwardableEmailMessage, ReadableStream } from "@cloudflare/workers-types";
import { Actor } from "@template/core/actor";
import { Context } from "@template/core/context";
import { Database } from "@template/core/drizzle";
import { MAX, parse } from "@template/core/email/inbound";
import { Mail } from "@template/core/mail";
import { Storage } from "@template/core/storage";
import { Log } from "@template/core/util/log";
import type { MailEnv } from "../../cf";

const log = Log.create({ namespace: "mail.worker" });

/**
 * MX routed here: Cloudflare hands us the raw MIME, we normalise it and hand it to core.
 * Everything provider-specific stops at this file — `Mail.receive` is the same call the
 * inbound webhook and the dev script make.
 */
export default {
  async email(message: ForwardableEmailMessage, env: MailEnv) {
    if (message.rawSize > MAX) {
      log.warn("rejected: too large", { size: message.rawSize, to: message.to });
      return message.setReject("Message exceeds the 25 MB limit");
    }
    const input = await parse(await bytes(message.raw, message.rawSize));
    // No user is present when mail arrives, so reception runs as the system actor.
    return Context.withProviders(
      () => Actor.provide("system", {}, () => Mail.receive(input)),
      Database.provider(Database.connect(env.Hyperdrive.connectionString)),
      Storage.provider(Storage.Providers.r2(env.Files)),
    );
  },
};

/** `rawSize` is the declared length; a stream that overruns it is a malformed delivery. */
async function bytes(stream: ReadableStream, size: number) {
  const out = new Uint8Array(size);
  const reader = stream.getReader();
  let at = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (at + value.length > size) {
      await reader.cancel();
      throw new Error(`Stream exceeds declared size of ${size} bytes`);
    }
    out.set(value, at);
    at += value.length;
  }
  return out;
}
