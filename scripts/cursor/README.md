# Cursor API — MHT-CET Live Dashboard

Dev/CI automation using [@cursor/sdk](https://cursor.com/docs/sdk/typescript). **Not** used in the student-facing app.

## Setup

```bash
cd scripts/cursor
npm install
cp .env.example .env   # add CURSOR_API_KEY
```

Get `CURSOR_API_KEY` from [Cursor Dashboard → Integrations](https://cursor.com/dashboard/integrations).

## Commands

```bash
# File checks + agent smoke (local repo)
CURSOR_API_KEY=cursor_... npm run verify:local

# Live Netlify/Vercel URL
CURSOR_API_KEY=cursor_... DASHBOARD_URL=https://your-site.netlify.app npm run verify:prod
```

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Missing key or `CursorAgentError` (startup) |
| 2 | Agent run `status === "error"` |

## Security

- Never commit `CURSOR_API_KEY`
- Never add Cursor SDK to `files/index.html` or browser bundle
- Dashboard AI uses **Anthropic** via `api/chat.js`, not Cursor API
