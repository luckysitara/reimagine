# Quick Start: AI Copilot Setup

## 30-Second Setup

### 1. Update Vercel Environment Variables

Go to: **Vercel Dashboard → Project Settings → Environment Variables**

Add or update:
```
GOOGLE_API_KEY = your_google_api_key_here
XAI_API_KEY = your_grok_api_key_here  (optional)
```

### 2. Redeploy
```bash
vercel --prod
```

### 3. Test
Visit your app → Try asking the AI copilot: "What's the price of SOL?"

---

## Where to Get API Keys

| Provider | URL | Time | Cost |
|----------|-----|------|------|
| **Google Gemini** | https://ai.google.dev/ | 2 min | Free tier: 60 req/min |
| **Grok/XAI** | https://console.x.ai/ | 5 min | Check pricing |

---

## What Each Key Does

### GOOGLE_API_KEY (Recommended)
- ✅ Primary AI provider
- ✅ Supports all features (swaps, trades, analysis)
- ✅ Real-time tool execution
- **Use this one first**

### XAI_API_KEY (Optional Fallback)
- Automatically used if Google key is missing
- Good for reliability backup
- No tool execution (text-only responses)

---

## Common Issues

### "AI service is not configured"
→ Set `GOOGLE_API_KEY` or `XAI_API_KEY` in Vercel and redeploy

### "Failed to get response: 500"
→ Check that your API key is valid and has remaining quota

### "Service Unavailable (503)"
→ Neither `GOOGLE_API_KEY` nor `XAI_API_KEY` is set

---

## Verify It Works

1. **Check Console Logs**
   - Open browser DevTools (F12)
   - Console tab
   - Should see: `[v0] Using Google API key successfully`

2. **Test Prompt**
   - Ask: "What's my wallet balance?"
   - Should get a response within 5 seconds

3. **Check Vercel Logs**
   - Dashboard → Deployments → View Logs
   - Search for: `Google API key successfully`

---

## Done! 🎉

Your AI Copilot is now running with dual-provider support.
- Primary: Google Gemini (full features)
- Fallback: Grok (text-only, if needed)

For detailed info, see `/DEPLOYMENT_CONFIGURATION.md` or `/API_KEY_MIGRATION.md`
