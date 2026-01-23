# AI Provider Fallback - Quick Reference

## One-Line Summary
Google Gemini → Automatic Grok fallback on rate limit or error. Set both API keys in Vercel.

## Setup (60 seconds)

```bash
# 1. Go to Vercel Project → Settings → Environment Variables

# 2. Add (or update) these variables:
GOOGLE_API_KEY=sk-...your-google-key...
XAI_API_KEY=...your-grok-key...

# 3. Redeploy
vercel --prod
```

## What Happens When You Chat

```
User: "Swap 1 SOL for USDC"
         ↓
[v0] Attempting Google Gemini API (primary)
         ↓
    ┌────Yes────┐
    ↓           ↓
Success    Rate Limited?
    ↓           ↓
Stream     Fallback
Response   to Grok
    ↓           ↓
  Done  ────────┘
```

## Console Messages You'll See

### Normal (Google works)
```
[v0] Attempting Google Gemini API (primary)
[v0] Using Google Gemini for streaming response
```

### Fallback (Google rate limited)
```
[v0] Google API rate limited or quota exceeded: quota exceeded
[v0] Falling back to Grok AI...
[v0] Using Grok AI for streaming response
```

### Error (Both failed)
```
[v0] Both Google and Grok AI failed. Please try again later.
```

## Common Issues

| Issue | Check |
|-------|-------|
| Always using Grok | Verify `GOOGLE_API_KEY` is correct |
| Getting 503 errors | Set at least one API key |
| Slow fallback | Check network, both APIs might be slow |
| Expensive Grok usage | Keep Google quota high, fallback less often |

## API Key Sources

- **Google Gemini**: https://ai.google.dev/ (Free tier: 60 req/min)
- **Grok/XAI**: https://console.x.ai/ (Paid, variable cost)

## Tip: Reduce Fallback

1. Upgrade Google API plan (higher quota)
2. Batch requests to avoid rate limits
3. Cache responses when possible
4. Or disable Grok fallback (remove `XAI_API_KEY`)

## Monitor Fallback Events

```bash
# In Vercel Dashboard:
# Deployments → Select latest → Logs
# Search for: "Falling back to Grok"
# Shows when/how often fallback happens
```

Done! The system now auto-fallbacks on errors. 🚀
