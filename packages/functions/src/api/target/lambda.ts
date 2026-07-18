import { lambda } from "../../target";
import { Storage } from "@template/core/storage";
import { app } from "../routes";

export const handler = lambda(app, Storage.provider(Storage.fromEnv(process.env)));
