import { list } from "./docs";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async () => ({ features: await list() });
