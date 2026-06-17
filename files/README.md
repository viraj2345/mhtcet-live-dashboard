# MHT-CET PCM 2026 — Live Student Dashboard
## Deployment Guide (Vercel — Free Hosting)

### Project Structure
```
projects/my-project/files/
├── api/
│   └── chat.js          ← Serverless proxy (ANTHROPIC_API_KEY in env)
├── public/
│   ├── index.html       ← Main dashboard
│   └── scorecard.html   ← Scorecard calculator
├── vercel.json
├── package.json
├── .env.example
└── README.md
```

### Step 1 — Get Anthropic API Key
1. Go to https://console.anthropic.com/
2. Sign up / Log in
3. Click "API Keys" → "Create Key"
4. Copy the key (starts with `sk-ant-...`)

### Step 2 — Push to GitHub
```bash
git init
git add .
git commit -m "MHT-CET Live Dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/mhtcet-dashboard.git
git push -u origin main
```

### Step 3 — Deploy on Vercel (Free)
1. Go to https://vercel.com → Sign up with GitHub
2. Click "Add New Project"
3. Import your GitHub repo
4. In "Environment Variables" add:
   - Name:  `ANTHROPIC_API_KEY`
   - Value: `sk-ant-YOUR_KEY_HERE`
5. Click "Deploy"
6. Done! Your URL: `https://your-app.vercel.app`

### Step 4 — Configure Frontend (Proxy URL)

In the deployed app, open the **Live Updates** tab:

| Field | Local dev | Production |
|-------|-----------|--------------|
| **Proxy URL** | `/api/chat` (default) | `https://your-app.vercel.app/api/chat` |

1. Enter the Proxy URL in the text field (id `proxyUrl` on the Live Updates page)
2. Click **Fetch Latest from CET Cell**
3. Requires `ANTHROPIC_API_KEY` set in Vercel env (or `files/.env` for `vercel dev`)

All AI features (`live_updates`, `college_suggest`, `ask_cet`, `scorecard`) POST to this URL.

### Local Development
```bash
npm install
npx vercel dev
# App runs at http://localhost:3000
```

### What the API does
- `/api/chat` accepts POST with `{ type, userMessage }`
- `type: "live_updates"` → Claude fetches cetcell.mahacet.org live
- `type: "college_suggest"` → AI suggests colleges based on percentile
- `type: "ask_cet"` → General MHT-CET Q&A with web search
- `type: "scorecard"` → Parses scorecard data and calculates everything

### Cost Estimate
- Vercel: **FREE** (Hobby plan, plenty for this use)
- Anthropic API: ~$0.003 per "Fetch Live Updates" click
  (Claude Sonnet = $3/million tokens, each call ~1000 tokens)
- For 1000 students/day clicking once = ~$3/day

### Security
- API key is stored as Vercel Environment Variable — NEVER in frontend code
- CORS configured to allow all origins (restrict to your domain in production)
- No user data is stored

### Cursor API (dev automation — optional)

For CI/agent smoke tests (not the student app):

```bash
cd ../scripts/cursor
npm install
CURSOR_API_KEY=cursor_... npm run verify:local
```

See `../scripts/cursor/README.md`. Student-facing AI uses **Anthropic** (`ANTHROPIC_API_KEY`), not Cursor.

### Official Sources Used
- cetcell.mahacet.org (live fetching)
- portal-2026.maharashtracet.org (CET Portal)
- MHT-CET 2026 Result Processing Methodology PDF
- Press Note: TED-1226/C.No.05/PCM Result/CET/2026/1399 (16 Jun 2026)
