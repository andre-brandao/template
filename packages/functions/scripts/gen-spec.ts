import { spec } from "../src/api/spec";

await Bun.write(import.meta.dir + "/../../sdk/openapi.json", JSON.stringify(await spec(), null, 2));
console.log("Wrote openapi.json");
