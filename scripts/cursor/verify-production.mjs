#!/usr/bin/env node
/**
 * DASH-1 production: validate live dashboard URL via Cursor agent.
 * Usage: CURSOR_API_KEY=... DASHBOARD_URL=https://... npm run verify:prod
 */
import { Agent, CursorAgentError } from "@cursor/sdk";
import { REPO_ROOT, requireApiKey, exitFromResult } from "./env.mjs";

async function main() {
  const apiKey = requireApiKey();
  const url = (process.env.DASHBOARD_URL ?? "").trim().replace(/\/$/, "");
  if (!url) {
    console.error("DASHBOARD_URL is required");
    process.exit(1);
  }

  const prompt = `Validate MHT-CET Live Student Dashboard at ${url}:
1. Page title contains "Live Student Dashboard" (NOT "College Predictor" only)
2. Percentage Calculator or calculator tabs are visible
3. NOT a bare profile form with only "Find Colleges"
4. Report whether AI/Live Updates section exists

Report PASS or FAIL for each. Repo context: ${REPO_ROOT}`;

  try {
    const result = await Agent.prompt(prompt, {
      apiKey,
      model: { id: "composer-2.5" },
      local: { cwd: REPO_ROOT },
    });
    exitFromResult(result.status);
    console.log(result.result ?? "verify-production completed");
  } catch (err) {
    if (err instanceof CursorAgentError) {
      console.error(`startup failed: ${err.message}`);
      process.exit(1);
    }
    throw err;
  }
}

main();
