import { sequence } from "@sveltejs/kit/hooks";
import { providers } from "./providers";
import { auth } from "./auth";
import { tenancy } from "./tenancy";
import { api } from "./api";
import { theme } from "./theme";

export const handle = sequence(providers, auth, tenancy, api, theme);
