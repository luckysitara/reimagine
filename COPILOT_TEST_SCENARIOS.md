# AI Copilot Test Scenarios

Test these scenarios to verify all fixes are working:

## Test 1: Wallet Connection Recognition
**Scenario**: Wallet is connected, user sends a message

**Expected Behavior**:
- No "Please connect your wallet" error
- Message is sent immediately to AI
- AI receives wallet address and can execute tools

**Steps**:
1. Connect wallet (Phantom, Solflare, etc.)
2. Type any message, e.g., "What's my portfolio worth?"
3. Submit

**Pass Criteria**: Message processes without wallet connection error

---

## Test 2: Token Analysis with Multiple Indicators
**Scenario**: User asks AI to analyze a specific token

**Messages to Try**:
- "Analyze SOL"
- "What's the sentiment for BONK?"
- "Give me technical analysis of JUP"
- "Analyze news for SOL and tell me if it's a good time to buy"

**Expected Behavior**:
- AI calls `analyze_token_news` tool automatically
- Response includes:
  - Sentiment analysis (bullish/bearish/neutral)
  - Key headlines
  - Technical indicators mention
  - Risk factors
- No duplication in response text

**Pass Criteria**: 
- Tool call appears in message history
- Response is clean and coherent
- Analysis is comprehensive

---

## Test 3: Portfolio Analysis
**Scenario**: User asks about portfolio

**Messages to Try**:
- "What's my portfolio worth?"
- "Analyze my portfolio"
- "Give me a portfolio breakdown"
- "What's my diversification score?"

**Expected Behavior**:
- AI calls `analyze_portfolio` tool automatically
- Response includes:
  - Total portfolio value
  - Token breakdown
  - Diversification score
  - Risk recommendations
- Clean formatting, no text repetition

**Pass Criteria**:
- Portfolio data is retrieved
- Analysis is accurate
- No duplicate text in response

---

## Test 4: Response Text Quality
**Scenario**: Monitor response formatting

**What to Watch For**:
- No repeated words ("wallet wallet", "your your")
- Proper sentence formatting
- Complete thoughts (not cut off)
- Proper paragraph breaks

**Expected Behavior**:
- All responses are clean and readable
- No garbled or duplicated text
- Streaming appears smooth

**Pass Criteria**: Response text is professional and readable

---

## Test 5: Automatic Tool Usage
**Scenario**: AI should call tools without asking for confirmation

**Messages to Try**:
- "Swap 1 SOL for USDC" - should directly prepare swap
- "What's SOL price?" - should call get_token_price
- "Create a limit order to buy SOL at $140" - should ask for amount if missing
- "Set up DCA: invest 10 SOL weekly" - should prepare DCA order

**Expected Behavior**:
- AI calls tools immediately for executable commands
- Only asks clarifying questions if parameters are ambiguous
- Doesn't ask "Do you want me to...?" for clear requests

**Pass Criteria**:
- Tools are called without unnecessary confirmation prompts
- Only asks clarifying questions for ambiguous requests

---

## Test 6: Google to Grok Fallback
**Scenario**: If Google API fails, Grok should take over smoothly

**How to Trigger** (in testing only):
- Temporarily set invalid GOOGLE_API_KEY in env
- Or send requests until Google rate limit is hit

**Expected Behavior**:
- Request fails silently on Google
- Grok automatically handles the request
- User receives response without knowing about fallback
- No "both failed" error unless BOTH providers are down

**Pass Criteria**: Seamless fallback occurs without user awareness

---

## Test 7: Stream Completion
**Scenario**: Long responses should complete properly

**Messages to Try**:
- Ask for detailed portfolio analysis
- Ask for comprehensive news analysis
- Ask for multiple token analyses at once

**Expected Behavior**:
- Response completes cleanly
- No duplicate content at end
- "Response complete" log appears in console
- Next message can be sent immediately

**Pass Criteria**: Long responses complete without issues

---

## Test 8: Multiple Message Exchange
**Scenario**: Conversation flow should work smoothly

**Steps**:
1. Send: "What's my portfolio worth?"
2. Wait for response
3. Send: "Should I swap BONK for SOL?"
4. Wait for response
5. Send: "What's the price of JUP?"

**Expected Behavior**:
- Each message processes correctly
- Context is maintained
- No state corruption
- Chat history saved

**Pass Criteria**: Multi-turn conversation works smoothly

---

## Success Criteria Checklist

- [ ] Connected wallet doesn't get "please connect" error
- [ ] Token analysis includes sentiment + technical indicators
- [ ] Portfolio analysis returns comprehensive data
- [ ] Response text has zero duplication/garbling
- [ ] AI calls tools automatically for clear requests
- [ ] Fallback from Google to Grok works seamlessly
- [ ] Long responses complete without issues
- [ ] Multi-turn conversations flow properly
- [ ] Chat history persists across refreshes
- [ ] No console errors for successful operations

All tests passed = ✅ All fixes verified and working!
