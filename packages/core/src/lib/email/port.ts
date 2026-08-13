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
  subject: string;
  body: string;
  html?: string;
  attachments?: Attachment[];
};

/** Where mail goes when sent: console (log only), queue (defer), cloudflare (binding). */
export interface Port {
  send(msg: Message): Promise<void>;
}
