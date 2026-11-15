import { modal } from "@template/ui";
import { ask } from "$lib/ask";
import { rotate } from "../../api/apps.query";
import Reveal from "../Reveal.svelte";

/** The inbound-secret flow the App row and panel share: confirm a held one, mint, reveal once. */
export const secret = () => {
  // The caller outlives the reveal, so reset drops the secret from the mutation's data.
  const spin = rotate({
    onSuccess: (data) => {
      spin.reset();
      modal(Reveal, { title: "Inbound secret", secret: data.secret });
    },
  });
  const run = async (app: { id: string; name: string; inbound: boolean }) => {
    const ok =
      !app.inbound ||
      (await ask({
        title: "Rotate secret",
        action: "Rotate",
        name: app.name,
        warn: "The current inbound secret for {name} stops working at once.",
      }));
    if (ok) spin.mutate(app.id);
  };
  return { spin, run };
};
