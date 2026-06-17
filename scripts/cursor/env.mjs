import { fileURLToPath } from "node:url";
import path from "node:path";

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export function requireApiKey() {
  const key = (process.env.CURSOR_API_KEY ?? "").trim();
  if (!key) {
    console.error("CURSOR_API_KEY is required");
    process.exit(1);
  }
  return key;
}

export function exitFromResult(status) {
  if (status === "error") process.exit(2);
  if (status !== "finished") process.exit(2);
}
