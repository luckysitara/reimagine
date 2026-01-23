# AI Provider Configuration Migration Guide

## Overview

This guide explains the new standardized approach for configuring AI providers in Reimagine.

**Previous Approach**: Used 3 different Google API key variable names
**New Approach**: Unified to `GOOGLE_API_KEY` with `XAI_API_KEY` as automatic fallback

---

## What Changed

### Before (Old Variables - NO LONGER USED)
```
GOOGLE_API_KEY
GOOGLE_GENERATIVE_AI_API_KEY  ❌ Deprecated
GOOGLE_AI_KEY                 ❌ Deprecated
```

### After (New Variables - USE THESE)
```
GOOGLE_API_KEY       → Google Gemini AI (Primary, Recommended)
XAI_API_KEY          → Grok AI (Fallback, Optional)
```

---

## Migration Steps

### Step 1: Update Vercel Environment Variables

1. **Go to your Vercel Project Settings**
   - Dashboard → Your Project → Settings → Environment Variables

2. **Remove Old Variables** (if you have them)
   - Delete: `GOOGLE_GENERATIVE_AI_API_KEY`
   - Delete: `GOOGLE_AI_KEY` (if it exists)

3. **Keep/Add New Variables**
   - `GOOGLE_API_KEY` = Your Google Gemini API key (REQUIRED or use Grok as fallback)
   - `XAI_API_KEY` = Your Grok/XAI API key (OPTIONAL - used only if Google is not set)

---

## Provider Priority

The application uses this priority order:

```
1. GOOGLE_API_KEY (Primary - Google Gemini)
   ↓ If not set, use ↓
2. XAI_API_KEY (Fallback - Grok AI)
   ↓ If neither is set ↓
3. Error: "AI service not configured"
```

**Recommendation**: Set `GOOGLE_API_KEY` for best performance. Grok is used only if Google is unavailable.

---

## How to Get API Keys

### Google Gemini API Key (Primary)
1. Visit: https://ai.google.dev/
2. Click "Get API Key in Google AI Studio"
3. Create a new project or use existing
4. Copy the API key
5. **Free Tier**: 60 requests/minute, 1,500 requests/day

### Grok/XAI API Key (Fallback)
1. Visit: https://console.x.ai/
2. Sign up for XAI account
3. Create API key
4. Copy the key
5. **Free Tier**: Check XAI pricing page

---

## Testing Your Configuration

### Test via cURL
```bash
# Test Google Gemini
curl -X POST https://your-app.vercel.app/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "What is SOL price?"}
    ],
    "walletAddress": "YOUR_WALLET_ADDRESS"
  }'
```

### Test in App
1. Deploy to Vercel with environment variables set
2. Visit your app
3. Try asking the AI Copilot a question
4. Check browser console for logs showing which provider is being used

---

## Troubleshooting

### "AI service is not configured" Error

**Cause**: Neither `GOOGLE_API_KEY` nor `XAI_API_KEY` are set

**Solution**:
1. Go to Vercel project settings
2. Add at least one of:
   - `GOOGLE_API_KEY` with your Google Gemini key
   - `XAI_API_KEY` with your Grok key
3. Redeploy the application

### "Failed to get response: 500" When Using AI

**Possible Causes**:
- Invalid API key format
- API key has no remaining quota
- Network connectivity issues

**Solutions**:
1. Verify the API key is correct:
   ```bash
   vercel env ls  # Check variable value in Vercel
   ```
2. Test the API key directly:
   - Google: https://ai.google.dev/ → Try "Get Started"
   - Grok: https://console.x.ai/ → Check account status
3. Check application logs:
   - Vercel Dashboard → Deployments → Logs
   - Look for: "[v0] Using Google API key successfully"

### Only Grok is Being Used (Should Use Google First)

**Cause**: `GOOGLE_API_KEY` is not set, so it's falling back to Grok

**Solution**: Set `GOOGLE_API_KEY` in your Vercel environment variables

---

## Code Changes Made

### Files Modified
1. **`/app/api/agent/route.ts`**
   - Added Grok support via `@ai-sdk/xai`
   - Unified API key checking to use only `GOOGLE_API_KEY` and `XAI_API_KEY`
   - Implemented fallback logic: Google → Grok
   - Added proper error handling with 503 status for missing providers

2. **`/DEPLOYMENT_CONFIGURATION.md`**
   - Updated environment variable documentation
   - Changed examples to use `GOOGLE_API_KEY` and `XAI_API_KEY`

3. **`/DEPLOYMENT.md`**
   - Updated prerequisites and setup instructions
   - Changed CLI commands to use new variable names

4. **`/lib/utils/rpc-client.ts`**
   - Improved RPC response parsing for balance queries

5. **`/hooks/use-solana-balance.ts`**
   - Enhanced balance hook with better error handling

6. **`/components/solana-copilot.tsx`**
   - Improved balance fetching with flexible response format handling

---

## Benefits of New Approach

✅ **Simplified Configuration**: Only 2 variables instead of 3+
✅ **Built-in Fallback**: Automatically uses Grok if Google unavailable
✅ **Better Naming**: Clear which is primary (`GOOGLE_API_KEY`) vs fallback (`XAI_API_KEY`)
✅ **Reduced Confusion**: No more wondering which key name to use
✅ **Cost Optimization**: Can switch providers based on quota/cost

---

## Backward Compatibility

If you have old variables set, they will be ignored. You must use:
- `GOOGLE_API_KEY` (instead of `GOOGLE_GENERATIVE_AI_API_KEY` or `GOOGLE_AI_KEY`)
- `XAI_API_KEY` (instead of any other Grok key name)

---

## Support

For issues with:
- **Google API**: https://ai.google.dev/support
- **Grok/XAI API**: https://console.x.ai/support
- **Deployment**: Check Vercel logs or contact support

---

**Last Updated**: January 23, 2026
**Status**: Production Ready
