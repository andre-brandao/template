import { getContext, setContext } from "svelte";

const KEY = Symbol("combobox");

export type Ctx = {
  readonly open: boolean;
  readonly query: string;
  readonly value: string | undefined;
  /** True while the viewport is under the root's breakpoint — the content is a sheet, not a popover. */
  readonly narrow: boolean;
  /** Ties the trigger's `aria-controls` to the panel. */
  readonly id: string;
  /** How many items survive the current query. */
  readonly count: number;
  set(open: boolean): void;
  search(query: string): void;
  pick(value: string): void;
  tally(by: number): void;
  match(text: string): boolean;
};

export const createCombobox = (ctx: Ctx) => setContext(KEY, ctx);

export const combobox = () => getContext<Ctx>(KEY);
