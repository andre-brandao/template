import { Context } from "../context";
import { Database } from "./index";

/**
 * Where `central.*` tables are read. Without a provided client it is `Database` itself, so it
 * joins the open transaction (pglite holds a client exclusive mid-transaction; a second
 * connection would deadlock). With one, central work runs on that client in its own transaction.
 */
export namespace Central {
  const Client = Context.create<Database.Client>();
  const Tx = Context.create<Database.TxOrDb>();

  /** Scopes a separate central client — only apps whose workspaces live in other databases. */
  export function provide<R>(client: Database.Client, fn: () => R): R {
    return Client.provide(client, fn);
  }

  export function use<T>(fn: (tx: Database.TxOrDb) => Promise<T>): Promise<T> {
    if (!Client.peek()) return Database.use(fn);
    return transaction(fn);
  }

  export function transaction<T>(fn: (tx: Database.TxOrDb) => Promise<T>): Promise<T> {
    const client = Client.peek();
    if (!client) return Database.transaction(fn);
    const open = Tx.peek();
    if (open) return fn(open);
    return client.db.transaction((tx) => Tx.provide(tx, () => fn(tx)));
  }
}
