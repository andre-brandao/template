import { bun } from "../../target";
import { Storage } from "@template/core/storage";
import { app } from "../routes";

const port = parseInt(process.env.PORT!) || 3000;
console.log(`Running at http://localhost:${port}`);

export default bun(app, port, Storage.provider(Storage.fromEnv(process.env)));
