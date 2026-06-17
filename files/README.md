# MHT-CET PCM 2026 — Live Student Dashboard
## Deployment Guide (Vercel — Free Hosting)

### Project Structure
```
mhtcet-live/
├── api/
│   └── chat.js          ← Serverless proxy (holds API key securely)
├── public/
│   └── index.html       ← Main frontend dashboard
├── vercel.json          ← Vercel configuration
├── package.json
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

### Step 4 — Configure Frontend
In the deployed app, go to "Live Updates" tab:
- Set Proxy URL to: `https://your-app.vercel.app/api/chat`
- Click "Fetch Latest from CET Cell"

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

### Official Sources Used
- cetcell.mahacet.org (live fetching)
- portal-2026.maharashtracet.org (CET Portal)
- MHT-CET 2026 Result Processing Methodology PDF
- Press Note: TED-1226/C.No.05/PCM Result/CET/2026/1399 (16 Jun 2026)
