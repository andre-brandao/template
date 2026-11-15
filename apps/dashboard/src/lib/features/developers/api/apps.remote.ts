import { env } from "$env/dynamic/private";
import { App } from "@template/core/app";
import { remote } from "$lib/server/remote";

/** Where the App posts in. The API's public origin is dashboard config only the server knows. */
export const getEndpoint = remote.query(App.Info.shape.id, (id) =>
  new URL(`/hook/${id}`, env.API_URL ?? "http://localhost:3000").toString(),
);
