#!/usr/bin/env node
/**
 * DASH-1 local: validate dashboard files + optional Cursor agent smoke.
 * Usage: CURSOR_API_KEY=... npm run verify:local
 */
import fs from "node:fs";
import path from "node:path";
import { Agent, CursorAgentError } from "@cursor/sdk";
import { REPO_ROOT, requireApiKey, exitFromResult } from "./env.mjs";

const FILES = path.join(REPO_ROOT, "files");
const INDEX = path.join(FILES, "public", "index.html");
const CHAT = path.join(FILES, "api", "chat.js");

function checkFiles() {
  if (!fs.existsSync(INDEX)) {
    console.error(`Missing ${INDEX}`);
    process.exit(1);
  }
  const html = fs.readFileSync(INDEX, "utf8");
  if (!html.includes("Live Student Dashboard")) {
    console.error("index.html missing Live Student Dashboard title");
    process.exit(1);
  }
  if (!fs.existsSync(CHAT)) {
    console.error(`Missing ${CHAT}`);
    process.exit(1);
  }
  console.log("OK: files/public/index.html present with correct title");
  console.log("OK: files/api/chat.js present");
}

const prompt = `Validate MHT-CET Live Student Dashboard repo at ${REPO_ROOT}:
1. files/public/index.html exists with title "Live Student Dashboard"
2. files/api/chat.js exists for Anthropic proxy
3. vercel.json present for Vercel deploy
4. public/ + api/ layout matches Vercel deploy contract

Report PASS or FAIL per item.`;

async function main() {
  checkFiles();
  const apiKey = requireApiKey();
  try {
    const result = await Agent.prompt(prompt, {
      apiKey,
      model: { id: "composer-2.5" },
      local: { cwd: REPO_ROOT },
    });
    exitFromResult(result.status);
    console.log(result.result ?? "verify-local completed");
  } catch (err) {
    if (err instanceof CursorAgentError) {
      console.error(`startup failed: ${err.message}`);
      process.exit(1);
    }
    throw err;
  }
}

main();
