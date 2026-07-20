import { bun } from "../../target";
import { File } from "@template/core/file";
import { app } from "../routes";

const port = parseInt(process.env.PORT!) || 3000;
console.log(`Running at http://localhost:${port}`);

export default bun(app, port, File.provider(File.fromEnv(process.env)));
