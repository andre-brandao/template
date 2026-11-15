import { createContext } from "svelte";

export const [menu, createMenu] = createContext<{ close(): void }>();
