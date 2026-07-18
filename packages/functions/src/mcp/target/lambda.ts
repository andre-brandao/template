import { lambda } from "../../target";
import { app } from "../index";

export const handler = lambda(app);
