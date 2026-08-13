import { afterAll } from "bun:test";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";

// config.ts freezes its file path at import, so the scratch dir has to be in place before
// any test file loads it. A fresh dir per run keeps concurrent runs from colliding.
const dir = `${tmpdir()}/template-cli-test-${crypto.randomUUID()}`;
process.env.XDG_CONFIG_HOME = dir;
afterAll(() => rm(dir, { recursive: true, force: true }));

// A dev shell usually exports these; tests set them explicitly when they mean to.
for (const k of ["TEMPLATE_TOKEN", "API_URL", "AUTH_URL"]) delete process.env[k];
