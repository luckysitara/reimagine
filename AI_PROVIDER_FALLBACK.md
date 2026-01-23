# AI Provider Automatic Fallback System

## Overview

The Reimagine platform now features an intelligent automatic fallback system for AI providers. If the primary provider (Google Gemini) fails or hits rate limits, the system automatically switches to Grok without user intervention.

## How It Works

### Provider Priority & Fallback Chain

```
┌─────────────────────────────────────────┐
│ User sends AI Copilot request           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ Try Google Gemini API (Primary)         │
│ - Check GOOGLE_API_KEY exists           │
│ - Attempt to stream response            │
└──────────────┬──────────────────────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
    Success      Failure?
        │         (Rate limit,
        │          Auth error,
        │          Network issue)
        │             │
        │        ┌────▼────┐
        │        │          │
        │        ▼          ▼
        │   Grok Available? No API Keys
        │   (XAI_API_KEY)       │
        │        │              ▼
        │     Yes  No        Return 503 Error
        │        │              │
        │        ▼              │
        │   Use Grok API  "Both providers failed"
        │        │              │
        └───────┬┘              │
                │               │
                └───────┬───────┘
                        │
                        ▼
                    Stream Response
```

## Automatic Fallback Triggers

The system automatically falls back to Grok when Google API:

1. **Rate Limited** (HTTP 429)
   - Too many requests within the quota window
   - Google free tier: 60 requests/minute

2. **Quota Exceeded**
   - Daily quota limit reached
   - Account quota depleted

3. **Authentication Failed** (HTTP 401/403)
   - Invalid API key
   - Expired credentials

4. **Other Errors**
   - Network timeouts
   - Server errors
   - Invalid requests
   - Any streaming exception

## Configuration

### Required Environment Variables

```bash
# Primary AI Provider (strongly recommended)
GOOGLE_API_KEY=your_google_gemini_api_key

# Fallback AI Provider (optional but recommended)
XAI_API_KEY=your_xai_grok_api_key
```

### Scenarios

| Config | Behavior |
|--------|----------|
| Only `GOOGLE_API_KEY` | Uses Google, no fallback |
| Only `XAI_API_KEY` | Uses Grok directly |
| Both keys set | Tries Google first, falls back to Grok automatically |
| No keys | Returns 503 error |

## Console Logging

The agent logs all provider switches for debugging:

```
[v0] Attempting Google Gemini API (primary)
[v0] Using Google Gemini for streaming response
[v0] Google API response received successfully
```

**On Fallback:**
```
[v0] Google API rate limited or quota exceeded: quota exceeded
[v0] Falling back to Grok AI...
[v0] Using Grok AI for streaming response
[v0] Grok response received, streaming to client
```

**On All Failures:**
```
[v0] Both Google and Grok AI failed. Please try again later.
```

## Error Handling

### Client-Side Error Messages

Users receive clear feedback about provider status:

```json
{
  "type": "error",
  "error": "Both Google and Grok AI failed. Please try again later."
}
```

### Server-Side Debug Info

Developers can monitor `/api/agent` logs in Vercel dashboard:
- Go to **Deployments** → **Logs**
- Filter by `[v0]` prefix
- Check provider selection and fallback events

## Testing the Fallback

### Test 1: Google Rate Limit Fallback

1. Send 60+ requests to `/api/agent` within 1 minute
2. After quota, system automatically uses Grok
3. Check console logs for: `[v0] Falling back to Grok AI...`

### Test 2: Manual Fallback

1. Set invalid `GOOGLE_API_KEY` (e.g., "invalid")
2. Keep `XAI_API_KEY` valid
3. Send request to `/api/agent`
4. Observe automatic fallback to Grok in logs

### Test 3: Grok-Only Mode

1. Remove or disable `GOOGLE_API_KEY`
2. Keep `XAI_API_KEY` valid
3. Requests should use Grok directly
4. Console: `[v0] Google API not configured. Starting with Grok fallback.`

## Cost Implications

- **Google Gemini**: Free tier (60 req/min), paid plans available
- **Grok**: Not free, pricing based on token usage
- **Recommendation**: Use Google for cost savings, keep Grok as safety net

## Best Practices

1. **Always set both API keys** for maximum reliability
2. **Monitor rate limits** - Google free tier is 60 req/min
3. **Use Grok sparingly** - Only as fallback due to costs
4. **Check logs regularly** - Look for fallback patterns
5. **Upgrade Google plan** - If hitting quota frequently

## Troubleshooting

### Problem: Always falling back to Grok

```
[v0] Google API error: Invalid API key
[v0] Falling back to Grok AI...
```

**Solution**: Verify `GOOGLE_API_KEY` in Vercel environment variables

### Problem: No fallback happening

```
[v0] Google API rate limited or quota exceeded
[v0] No fallback available
```

**Solution**: Set `XAI_API_KEY` for automatic fallback capability

### Problem: Both providers failing

```
[v0] Both Google and Grok AI failed. Please try again later.
```

**Solutions**:
- Check both API keys are valid
- Check account quotas and balance
- Wait for services to recover
- Monitor status pages (Google AI, XAI)

## Performance Notes

- **Google → Grok switch**: ~100-500ms overhead
- **Direct Grok usage**: No overhead (if Google disabled)
- **Streaming**: Seamless transition, user doesn't notice fallback

## Future Enhancements

Potential improvements:
- [ ] Provider load balancing
- [ ] Weighted random provider selection
- [ ] Response quality comparison
- [ ] Cost optimization mode
- [ ] Provider health checks
- [ ] Custom fallback chains
