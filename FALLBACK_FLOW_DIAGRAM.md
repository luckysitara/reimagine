# AI Provider Fallback Flow Diagrams

## Main Request Flow

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ User sends message to AI Copilot                                   ┃
┗━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                       │
                       ▼
        ┌──────────────────────────────────┐
        │ Check Environment Variables      │
        │ - GOOGLE_API_KEY?                │
        │ - XAI_API_KEY?                   │
        └────────────┬─────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
    ┌─────────┐          ┌────────────┐
    │ Neither │          │ At least   │
    │ set?    │          │ one set?   │
    └────┬────┘          └──────┬─────┘
         │                      │
         ▼                      ▼
    Return 503         ┌──────────────────┐
    "No providers"     │ tryGoogleWithFallback()
                       └────────┬─────────┘
                                │
                    ┌───────────┴────────────┐
                    │                        │
                    ▼                        ▼
            ┌────────────────┐      ┌──────────────────┐
            │ GOOGLE_API_KEY │      │ Only XAI_API_KEY │
            │ exists?        │      │ exists?          │
            └────┬───────────┘      └────────┬─────────┘
                 │                           │
         ┌───────┴────────┐                  │
         │                │                  │
       YES               NO                  ▼
         │                │         ┌────────────────────┐
         │                └────────►│ Use Grok directly  │
         │                          │ (skip Google)      │
         │                          └────────┬───────────┘
         ▼                                   │
    ┌──────────────────┐                     │
    │ Create Google    │                     │
    │ Generative AI    │                     │
    │ client           │                     │
    └────────┬─────────┘                     │
             │                               │
         Try │                               │
         Init│                               │
             ▼                               │
        ┌─────────────────┐                  │
        │ Success?        │                  │
        └────┬──────┬─────┘                  │
             │      │                        │
           YES      NO                       │
             │      │                        │
             │      └─────┬──────────────┐   │
             │            │              │   │
             │            ▼              ▼   │
             │       ┌──────────────┐  Rate  │
             │       │ Error type:  │  limit/│
             │       │ Rate/Quota/  │  Quota/│
             │       │ Auth?        │  Auth? │
             │       └──┬────────┬──┘        │
             │          │        │           │
             │        YES        NO          │
             │          │        │           │
             │          │        ▼           │
             │          │   ┌─────────────┐ │
             │          │   │ Grok avail? │ │
             │          │   └┬───────────┬┘ │
             │          │    │           │  │
             │          │   YES          NO │
             │          │    │           │  │
             │          ▼    ▼           ▼  │
             │       ┌──────────────┐  Error
             │       │ Use Grok     │
             │       └──────┬───────┘
             │              │
             └──────┬───────┘
                    │
                    ▼
         ┌──────────────────────┐
         │ Provider Determined  │
         │ - Google OR          │
         │ - Grok OR            │
         │ - Error state        │
         └──────────┬───────────┘
                    │
                    ▼
        ┌──────────────────────────┐
        │ Start Streaming Response │
        │ with selected provider   │
        └──────────┬───────────────┘
                   │
                   ▼
          [See Streaming Flow Below]
```

## Streaming Phase Flow

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Streaming Response to Client                  ┃
┗━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━┛
                    │
         ┌──────────┴──────────┐
         │                     │
         ▼                     ▼
    ┌─────────────┐       ┌──────────────┐
    │ Using       │       │ Using Grok   │
    │ Google?     │       │ (Direct or   │
    └─────┬───────┘       │ Fallback)    │
          │               └──────┬───────┘
          │                      │
          ▼                      ▼
     ┌──────────────┐      ┌─────────────────┐
     │ Stream text  │      │ Get complete    │
     │ sentence by  │      │ response        │
     │ sentence     │      │ (non-streaming) │
     │              │      │                 │
     │ Check for    │      │ Send to client  │
     │ tool calls   │      │                 │
     │              │      └────────┬────────┘
     │ Execute      │              │
     │ tools        │              │
     │              │              │
     └──────┬───────┘              │
            │                      │
    ┌───────┴──────────────────────┤
    │                              │
    ▼                              │
 Stream Continue?               Stream 
    │                           Continue?
    │                              │
┌───┴───┐                       ┌──┴──┐
│       │                       │     │
│      YES                     YES    NO
│       │                       │     │
▼       │                       ▼     │
Stream  │                   Finish   │
More    │                   Streaming│
│       │                       │     │
└───┬───┘                       │     │
    │                           │     │
    └───────┬───────────────────┘     │
            │                         │
            ▼                         ▼
        Continue Loop         ┌────────────┐
        Or Fallback           │ Check: Did │
        on Error              │ stream OK? │
                              └────┬───────┘
                                   │
                          ┌────────┴────────┐
                          │                 │
                         YES               NO
                          │                 │
                          │                 ▼
                          │            ┌──────────────┐
                          │            │ Grok avail?  │
                          │            └┬──────────┬──┘
                          │             │          │
                          │            YES         NO
                          │             │          │
                          │             ▼          ▼
                          │        Try Grok    Return Error
                          │        Fallback    to User
                          │             │          │
                          │             ▼          ▼
                          │        Stream Text  "Both Providers
                          │             │       Failed"
                          │             │          │
                          └─────┬───────┘          │
                                │                 │
                                ▼                 ▼
                         ┌────────────────────────────┐
                         │ Send "done" signal         │
                         │ to client                  │
                         └────────────┬───────────────┘
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │ Response Complete        │
                         │ Client receives full     │
                         │ AI response              │
                         └──────────────────────────┘
```

## Error Handling Paths

```
Error Case 1: Google Rate Limited
════════════════════════════════════════
  Request fails with: "quota exceeded"
             │
             ▼
  [v0] Google API rate limited
             │
             ▼
  Grok available?
      │     │
     YES   NO
      │     │
      ▼     ▼
   Use   Return
   Grok  Error
      │     │
      └──┬──┘
         │
         ▼
   Stream Response


Error Case 2: Google Stream Fails Mid-Response
════════════════════════════════════════════════
  [Streaming Google response...]
  Suddenly: Error reading stream
             │
             ▼
  [v0] Google stream error
             │
             ▼
  Grok available?
      │     │
     YES   NO
      │     │
      ▼     ▼
   Try   Return
   Grok  Partial
   (fresh Response
   request)
      │     │
      └──┬──┘
         │
         ▼
   Continue/End


Error Case 3: No Fallback Available
═════════════════════════════════════
  Request arrives
           │
           ▼
  Only GOOGLE_API_KEY set
           │
           ▼
  Google fails with error
           │
           ▼
  [v0] Google error: [error details]
           │
           ▼
  No Grok fallback configured
           │
           ▼
  Return 500 Error
  Message: "Google AI failed and no
           fallback available"


Error Case 4: Both Providers Fail
══════════════════════════════════
  Try Google → Fails
           │
           ▼
  Fall back to Grok
           │
           ▼
  Grok also fails
           │
           ▼
  [v0] Both Google and Grok failed
           │
           ▼
  Return 503 Error
  Message: "Both Google and Grok AI
           failed. Please try again."
```

## State Machine

```
┌──────────────────────────────────────────────────────────────┐
│                     AI PROVIDER STATE MACHINE                 │
└──────────────────────────────────────────────────────────────┘

START
  │
  ▼
[INIT_STATE]
  ├─ Check API Keys
  └─ Determine available providers
      │
      ├─ Both available? → [GOOGLE_PRIMARY]
      ├─ Only Google? → [GOOGLE_ONLY]
      ├─ Only Grok? → [GROK_ONLY]
      └─ None? → [ERROR_NO_PROVIDERS] → 503

[GOOGLE_PRIMARY]
  ├─ Try Google API
  ├─ Success? → [GOOGLE_STREAMING] → [SUCCESS] → END
  └─ Failure?
      ├─ Rate limited? → [FALLBACK_GROK]
      ├─ Auth failed? → [FALLBACK_GROK]
      ├─ Other error? → [FALLBACK_GROK]
      └─ No Grok? → [ERROR_GOOGLE_FAILED] → 500

[GOOGLE_ONLY]
  ├─ Try Google API
  ├─ Success? → [GOOGLE_STREAMING] → [SUCCESS] → END
  └─ Failure? → [ERROR_GOOGLE_FAILED] → 500

[GROK_ONLY]
  ├─ Try Grok API
  ├─ Success? → [GROK_STREAMING] → [SUCCESS] → END
  └─ Failure? → [ERROR_GROK_FAILED] → 500

[GOOGLE_STREAMING]
  ├─ Stream succeeds? → [SUCCESS]
  └─ Stream fails?
      ├─ Grok available? → [FALLBACK_GROK]
      └─ Not available? → [STREAM_ERROR] → 500

[FALLBACK_GROK]
  ├─ Try Grok API
  ├─ Success? → [GROK_STREAMING] → [SUCCESS] → END
  └─ Failure? → [ERROR_BOTH_FAILED] → 503

[GROK_STREAMING]
  ├─ Stream succeeds? → [SUCCESS]
  └─ Stream fails? → [ERROR_GROK_FAILED] → 503

[SUCCESS]
  └─ Response sent to client → END

[ERROR_*]
  └─ Error response → END
```

## Timeline Example: Rate Limit Recovery

```
Timeline: User at 59 requests, then hits rate limit, then uses Grok

T = 0s:  Request 1-59 successfully use Google
         └─ Each request logs: [v0] Using Google Gemini

T = 60.1s: Request 60 arrives
          ├─ Google rate limit resets
          └─ Quota refreshed

T = 60.5s: Request 61-120 use Google again
          └─ Back to normal

T = 61s:  Request 61-120 sent very quickly (all within same second)
         ├─ Request 61: Uses Google ✓
         ├─ Request 62: Uses Google ✓
         ├─ ...
         ├─ Request 85+: Google rate limited (429)
         │  └─ [v0] Google API rate limited
         │  └─ [v0] Falling back to Grok...
         │  └─ Uses Grok ✓
         │
         └─ Cost: ~25 requests at Grok (expensive)

Solution: Don't burst requests, space them out!
```

## Provider Decision Tree

```
                    Request Arrives
                          │
                          ▼
                 ┌─────────────────┐
                 │ Read API Keys   │
                 │ from env        │
                 └────┬──┬──┬──────┘
                      │  │  │
        GOOGLE?   NO──┴┘ │  │
                         │  │
                       XAI?  │
                    NO──┴┘   │
                             │
                           NONE?
                         YES───┴───► Return 503
                                    "No providers"
                          
                     ┌────────YES───┬────────┐
                     │              │        │
                    GOOGLE      GOOGLE      XAI
                     &          ONLY      ONLY
                    XAI          │          │
                     │           │          │
                     ▼           ▼          ▼
                 TRY      TRY       TRY
                GOOGLE   GOOGLE    GROK
                  &        │        │
                GROK       ▼        ▼
                 │      OK? NO    OK? NO
                 │      │            │
                 ▼      ▼            ▼
              OK?      ERR        ERR
              │ │      │          │
           YES NO      │          ▼
             │  │      │       Return
             │  │      ▼       500 Error
             │  │   FALLBACK   ("No fallback")
             │  │   TO GROK
             │  │      │
             │  │      ▼
             │  │    OK? NO
             │  │    │    │
             │  │ YES │   NO
             │  │    ▼    ▼
             │  │   GROK  Return
             │  │    │    503 Error
             │  │    │    ("Both failed")
             │  │    │
             └──┴────┴─────► STREAM RESPONSE
                               │
                               ▼
                             END ✓
```

---

These diagrams help visualize:
1. **Request Flow**: How API keys are checked and providers selected
2. **Streaming Flow**: How responses are streamed with error recovery
3. **Error Handling**: Different failure scenarios and recovery paths
4. **State Machine**: All possible states during request processing
5. **Timeline Example**: What happens with rate limit scenario
6. **Decision Tree**: Quick visual logic for provider selection
