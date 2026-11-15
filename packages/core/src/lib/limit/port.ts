import type { Kv } from "../kv";

export type Subject = Readonly<{ kind: string; value: string }>;

export type Result = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAfter: number;
  retryAfter?: number;
};

export type Store = Pick<Kv.Api, "delete" | "get" | "incr" | "set">;

export interface Algorithm<Options> {
  consume(store: Store, key: string, opts: Options, cost: number): Promise<Result>;
  inspect(store: Store, key: string, opts: Options): Promise<Result>;
  reset(store: Store, key: string, opts: Options): Promise<void>;
}

export type Policy<Options> = {
  algorithm: Algorithm<Options>;
  options: Options;
};

export interface Rule {
  consume(subject: Subject, opts?: { cost?: number }): Promise<Result>;
  inspect(subject: Subject): Promise<Result>;
  reset(subject: Subject): Promise<void>;
}
