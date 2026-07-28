import { config } from "dotenv";
import path from "node:path";

config({ path: path.resolve(process.cwd(), ".env"), quiet: true });
config({
  path: path.resolve(process.cwd(), ".env.local"),
  override: true,
  quiet: true,
});
