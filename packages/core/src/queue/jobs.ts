import { z } from "zod";
import { Email } from "../email";
import { Queue } from "./index";

/**
 * Job definitions live here so a process running `Queue.work()` only has to import one
 * module for every handler to resolve. Push with `jobs.email.push({ ... })`.
 */
export const email = Queue.define(
  "email.send",
  z.object({
    from: z.string().optional(),
    to: z.union([z.string(), z.string().array()]),
    subject: z.string(),
    body: z.string(),
    html: z.string().optional(),
  }),
  Email.send,
);
