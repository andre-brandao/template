import { lambda } from "../../target";
import { File } from "@template/core/file";
import { app } from "../routes";

export const handler = lambda(app, File.provider(File.fromEnv(process.env)));
