# Grok AI - Quick Fix Reference

## Problem
```
Error: Unsupported model version v3 for provider "xai.chat"
AI SDK 5 only supports models that implement specification version "v2"
```

## Solution
Change from `generateText()` to `streamText()` for Grok responses.

## Why
- `generateText()` returns full text at once (non-streaming)
- xai provider requires `streamText()` for proper v2 spec support
- `streamText()` returns `textStream` for chunk-by-chunk iteration

## Code Changes

### Location: `/app/api/agent/route.ts`

**Line 3**: Import
```typescript
// ❌ Before
import { generateText } from "ai"

// ✅ After
import { streamText } from "ai"
```

**Lines 1110-1140**: Initial Grok Fallback
```typescript
// ❌ Before
const grokResponse = await generateText({ model: xai("grok-4", ...) })
controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: grokResponse.text })}`))

// ✅ After
const result = await streamText({ model: xai("grok-4", ...) })
for await (const chunk of result.textStream) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}`))
}
```

**Lines 1269-1295**: Mid-Stream Grok Fallback
```typescript
// Same pattern as above
const grokResult = await streamText({ model: xai("grok-4", ...) })
for await (const chunk of grokResult.textStream) {
  controller.enqueue(encoder.encode(...))
}
```

## Deployment

```bash
git add app/api/agent/route.ts
git commit -m "fix: Grok fallback with streamText for AI SDK v5"
git push origin main
# Then redeploy in Vercel Dashboard
```

## Verify It Works

Browser Console after deployment:
```
[v0] Attempting Google Gemini API (primary)
[v0] Using Google Gemini for streaming response

// Or if quota exceeded:
[v0] Google API rate limited or quota exceeded
[v0] Falling back to Grok AI...
[v0] Grok fallback succeeded, streaming response
```

## Environment Variables
```
GOOGLE_API_KEY=sk-...     # Required for primary
XAI_API_KEY=xai-...       # Required for fallback
```

Done! 🚀
