import { sequence } from "@sveltejs/kit/hooks";
import { providers } from "./providers";
import { auth } from "./auth";
import { theme } from "./theme";

export const handle = sequence(providers, auth, theme);
