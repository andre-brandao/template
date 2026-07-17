import { Context } from "../context";
import { Log } from "../util/log";

export namespace Email {
  const log = Log.create({ namespace: "email" });

  const EMAIL_FROM = process.env.SMTP_FROM ?? "Developing <no.reply@developing.company>";

  export type Attachment = {
    filename: string;
    content: string;
    contentType?: string;
    encoding?: string;
  };

  export interface SenderPort {
    send(input: {
      from: string;
      to: string | string[];
      subject: string;
      body: string;
      html?: string;
      attachments?: Attachment[];
    }): Promise<void>;
  }

  const ctx = Context.create<SenderPort>();

  export function provide<R>(sender: SenderPort, fn: () => R): R {
    return ctx.provide(sender, fn);
  }

  /** Curried form of `provide` for composition via `Context.withProviders`. */
  export function provider(sender: SenderPort) {
    return <R>(fn: () => R) => provide(sender, fn);
  }

  export function use(): SenderPort {
    try {
      return ctx.use();
    } catch (err) {
      if (!(err instanceof Context.NotFound)) throw err;
      throw new Error("No email sender provided. Use Email.provide() to set one.");
    }
  }

  export async function send(input: {
    from?: string;
    to: string | string[];
    subject: string;
    body: string;
    html?: string;
    attachments?: Attachment[];
  }) {
    const from = input.from || EMAIL_FROM;
    log.info("sending email", { subject: `{{${input.subject}}}`, from, to: input.to });
    try {
      const sender = use();
      await sender.send({ ...input, from });
    } catch (err) {
      log.warn("failed to send email", { err: err instanceof Error ? err.message : String(err) });
      throw err;
    }
  }
}
