# Production Deployment Configuration Guide

This guide explains how to properly configure environment variables for production deployment on Vercel.

## Security-First Architecture

The application uses a **secure proxy pattern** to protect API keys:

- ✅ **Server-side only**: `HELIUS_RPC_URL` and `JUPITER_API_KEY` are NEVER exposed to the client
- ✅ **Secure proxy**: Client-side code uses `/api/solana/rpc` endpoint that forwards requests server-side
- ✅ **No API key leakage**: Your Helius API key stays safe on the server

## Required Environment Variables

### On Vercel (Production)

Add these environment variables in your Vercel project dashboard or v0 Vars section:

```bash
# REQUIRED: Helius RPC URL (Server-side only - secure)
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY

# REQUIRED: Solana Network
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta

# OPTIONAL: Google Gemini API for AI Copilot
GOOGLE_GENERATIVE_AI_API_KEY=your_google_gemini_api_key

# OPTIONAL: Jupiter API Key (recommended for better rate limits)
JUPITER_API_KEY=your_jupiter_api_key
```

### Important Notes

1. **DO NOT** set `NEXT_PUBLIC_HELIUS_RPC_URL` in production - this would expose your API key
2. The app automatically uses the secure proxy pattern
3. All RPC calls from the browser go through `/api/solana/rpc` endpoint
4. The server-side endpoint adds the API key before forwarding to Helius

## Setting Up Environment Variables

### Method 1: In v0 UI (Easiest)

1. Open your v0 chat
2. Click **Vars** in the left sidebar
3. Click **+ Add Variable**
4. Add each variable:
   - Name: `HELIUS_RPC_URL`
   - Value: `https://mainnet.helius-rpc.com/?api-key=YOUR_KEY`
5. Save changes

### Method 2: In Vercel Dashboard

1. Go to your project on [vercel.com](https://vercel.com)
2. Go to **Settings** → **Environment Variables**
3. Add each variable
4. Select environments: Production, Preview, Development
5. Save and redeploy

## Getting API Keys

### Helius API Key (Required)

1. Visit: https://dev.helius.xyz/
2. Sign up for a free account
3. Create a new project
4. Copy your API key
5. Format: `https://mainnet.helius-rpc.com/?api-key=YOUR_KEY`

**Free Tier**: 100,000 credits/day

### Google Gemini API Key (Optional - for AI features)

1. Visit: https://ai.google.dev/
2. Click "Get API Key in Google AI Studio"
3. Create API key in new or existing project
4. Copy the API key

**Free Tier**: 60 requests/minute, 1500 requests/day

### Jupiter API Key (Optional - for better rate limits)

1. Visit: https://portal.jup.ag
2. Sign up and create a new API key
3. Copy the key

**Free Tier**: Generous limits for personal use

## Troubleshooting

### Build Fails: "HELIUS_RPC_URL environment variable is required"

**Solution**: The environment variable is not set in Vercel. Add it in the Vars section or Vercel dashboard.

### API Key Visible in Browser DevTools

**Solution**: This should NOT happen with the current architecture. If you see the API key:
1. Make sure you're NOT using `NEXT_PUBLIC_HELIUS_RPC_URL`
2. Check that all client-side code uses the `/api/solana/rpc` proxy
3. Verify that `lib/utils/rpc-client.ts` is using the proxy endpoint

### RPC Calls Failing in Production

**Checklist**:
- [ ] `HELIUS_RPC_URL` is set in Vercel environment variables
- [ ] The URL format is correct: `https://mainnet.helius-rpc.com/?api-key=YOUR_KEY`
- [ ] Your Helius account has available credits
- [ ] The API key is valid (test it directly)

### AI Copilot Not Working

**Checklist**:
- [ ] `GOOGLE_GENERATIVE_AI_API_KEY` is set
- [ ] The API key is valid
- [ ] You haven't exceeded the free tier quota (60 requests/min)

## Local Development

For local development, create a `.env.local` file:

```bash
# Copy from .env.example
cp .env.example .env.local

# Edit .env.local and add your keys
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
GOOGLE_GENERATIVE_AI_API_KEY=your_key
JUPITER_API_KEY=your_key
```

**Never commit `.env.local` to git** - it's already in `.gitignore`.

## Security Best Practices

✅ **Do:**
- Use server-side environment variables for API keys
- Use the secure proxy pattern for RPC calls
- Rotate API keys periodically
- Monitor API usage in provider dashboards

❌ **Don't:**
- Use `NEXT_PUBLIC_` prefix for sensitive API keys
- Hardcode API keys in your code
- Commit `.env.local` or `.env` files
- Share API keys publicly

## Environment Variable Reference

| Variable | Required | Purpose | Exposed to Client |
|----------|----------|---------|-------------------|
| `HELIUS_RPC_URL` | ✅ Yes | Solana RPC endpoint | ❌ No (server-only) |
| `NEXT_PUBLIC_SOLANA_NETWORK` | ✅ Yes | Network selection | ✅ Yes (safe) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | ⚠️ Optional | AI Copilot | ❌ No (server-only) |
| `JUPITER_API_KEY` | ⚠️ Optional | Jupiter API access | ❌ No (server-only) |

## Production Checklist

Before deploying to production:

- [ ] All required environment variables are set in Vercel
- [ ] API keys are valid and have sufficient quotas
- [ ] `.env.local` is in `.gitignore` (already done)
- [ ] No API keys are hardcoded in the codebase
- [ ] RPC proxy is working (test with a wallet connection)
- [ ] Build completes successfully on Vercel
- [ ] Test the app with a real wallet after deployment

## Support

If you encounter issues:

1. Check the **Console** in browser DevTools for error messages
2. Check **Vercel Logs** in your deployment dashboard
3. Verify environment variables in Vercel Settings
4. Test API keys directly with curl/Postman
5. Check provider dashboards for quota/usage issues

---

**Last Updated**: Based on secure proxy architecture
**Security Level**: Production-ready with API key protection
