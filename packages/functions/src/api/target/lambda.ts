import { lambda } from "../../target";
import { app } from "../routes";

export const handler = lambda(app);
