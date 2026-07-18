import { worker } from "../../target";
import { app } from "../routes";

export default worker(app);
