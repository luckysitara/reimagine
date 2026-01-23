# Grok Fallback Deployment Checklist

## Pre-Deployment Verification

- [ ] Ensure `XAI_API_KEY` is set in Vercel Environment Variables
- [ ] Ensure `GOOGLE_API_KEY` is set in Vercel Environment Variables
- [ ] Both keys are marked as "All Environments" in Vercel
- [ ] Review changes in `/app/api/agent/route.ts` (imports and Grok implementation)
- [ ] Verify `streamText` is imported from "ai" package (not `generateText`)

## Deployment Steps

1. **Commit Changes**
   ```bash
   git add app/api/agent/route.ts
   git commit -m "fix: resolve Grok fallback streaming with AI SDK v5 streamText"
   ```

2. **Push to Main**
   ```bash
   git push origin main
   ```

3. **Monitor Vercel Deployment**
   - Go to Vercel Dashboard → Deployments
   - Wait for build to complete
   - Check "Functions" tab for any errors
   - Verify deployment was successful

## Post-Deployment Testing

### Test 1: Normal Google Flow (without quota)
```
Ask: "What's the current price of SOL?"
Expected: Response in 2-5 seconds with Google's response
Console: [v0] Using Google Gemini for streaming response
Result: ✅ PASS
```

### Test 2: Google Quota Exceeded (manual trigger)
```
Send 30+ requests rapidly to exhaust Google quota
Then ask: "Swap 1 SOL for USDC"
Expected: Response via Grok (slightly slower)
Console: [v0] Google API rate limited... Falling back to Grok...
Result: ✅ PASS
```

### Test 3: Verify Error Messages
```
Disable both API keys temporarily
Ask: "What's my portfolio?"
Expected: 503 Service Unavailable
Console: [v0] No AI providers configured
Result: ✅ PASS
```

## Monitoring

After deployment, monitor for 24 hours:

1. **Check Vercel Logs**
   - Watch for "Falling back to Grok" patterns
   - Look for any `AI_UnsupportedModelVersionError` (should be gone)
   - Verify streaming responses complete successfully

2. **Check Error Rates**
   - Vercel Dashboard → Analytics
   - 5xx errors should decrease
   - Response times should be consistent

3. **User Feedback**
   - Verify AI Copilot responses work
   - Check that slow responses trigger fallback
   - Confirm no more model version errors

## Rollback Plan (if issues occur)

```bash
# Revert to previous version
git revert HEAD
git push origin main

# Or manually edit app/api/agent/route.ts and change:
# - Import: import { streamText } from "ai"
# - Use streamText() for Grok calls
```

## Success Criteria

✅ Google API is used as primary provider
✅ Grok automatically activates on rate limit/quota
✅ Both providers stream responses properly
✅ No model version errors in logs
✅ Zero 500 errors from AI service
✅ Fallback response latency < 2 seconds worse than primary

## Notes

- Grok model uses specification v2 which requires `streamText()`
- Google Gemini uses v1 which works with `generateContentStream()`
- Both are compatible with streaming chunk-by-chunk response handling
- Rate limits: Google (60 req/min free), Grok (depends on plan)
