export type Attachment = {
  filename: string;
  content: string;
  contentType?: string;
  encoding?: string;
};

/** A fully addressed mail — `Email.send` fills the default `from` before a driver sees it. */
export type Message = {
  from: string;
  to: string | string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  html?: string;
  /** Extra headers verbatim — `In-Reply-To`/`References`, so a reply threads for the recipient. */
  headers?: Record<string, string>;
  attachments?: Attachment[];
};

/** Where mail goes when sent: console (log only), queue (defer), cloudflare (binding). */
export interface Port {
  send(msg: Message): Promise<void>;
}
