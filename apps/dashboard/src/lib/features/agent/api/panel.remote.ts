import { Panel } from "@template/core/panel";
import { remote } from "$lib/server/remote";
import { Sql } from "./panel/sql";

/** One read-only SELECT as the user: a panel block's rows, straight to the browser. */
export const getRows = remote.core(Sql.run).query();

export const getPanels = remote.core(Panel.list).query();

export const getPanel = remote.core(Panel.fromID).query();

export const createPanel = remote.core(Panel.create).command();

export const updatePanel = remote.core(Panel.update).command();

export const removePanel = remote.core(Panel.remove).command();
