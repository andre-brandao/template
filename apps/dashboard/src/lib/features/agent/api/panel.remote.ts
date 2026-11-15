import { remote } from "$lib/server/remote";
import { Panel } from "./copilot/panel";
import { Sql } from "./copilot/sql";

/** One read-only SELECT as the user: a panel block's rows, straight to the browser. */
export const getRows = remote.core(Sql.run).query();

export const getPanels = remote.core(Panel.list).query();

export const getPanel = remote.core(Panel.fromID).query();

export const savePanel = remote.command(Panel.save.schema, async (input) => {
  const info = await Panel.save(input);
  await getPanels().refresh();
  return info;
});

export const removePanel = remote.command(Panel.remove.schema, async (id) => {
  await Panel.remove(id);
  await getPanels().refresh();
});
