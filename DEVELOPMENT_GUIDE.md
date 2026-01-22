# 👨‍💻 Development Guide: Reimagine Platform

This guide helps developers understand the codebase structure and how to add new features.

---

## 📁 Project Structure

### Web App (Next.js)
\`\`\`
├── app/
│   ├── api/                      # API routes
│   │   ├── agent/               # AI agent endpoint
│   │   ├── jupiter/             # DEX routes
│   │   ├── notifications/       # Notification endpoints
│   │   ├── portfolio/           # Portfolio analytics
│   │   ├── token/               # Token operations
│   │   └── solana/              # RPC proxy
│   ├── globals.css              # Tailwind configuration
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Main dashboard
│
├── components/
│   ├── panels/                  # Feature panels
│   │   ├── trading-panel.tsx
│   │   ├── portfolio-panel.tsx
│   │   ├── nft-panel.tsx
│   │   ├── limit-orders-panel.tsx
│   │   └── ...
│   ├── notifications/           # Notification components
│   ├── ui/                      # shadcn/ui components
│   ├── header.tsx               # Header with wallet
│   ├── left-sidebar.tsx         # Navigation
│   └── solana-copilot.tsx       # AI chat interface
│
├── lib/
│   ├── services/                # External API integrations
│   │   ├── jupiter.ts           # Jupiter DEX
│   │   ├── nft-service.ts       # NFT queries
│   │   ├── notifications.ts     # Push notifications
│   │   └── ...
│   ├── tools/                   # AI agent tools
│   │   ├── execute-swap.ts
│   │   ├── analyze-portfolio.ts
│   │   └── ...
│   ├── constants/               # Configuration
│   └── utils/                   # Helper functions
│
├── public/
│   ├── service-worker.js        # Notification SW
│   └── assets/
│
└── hooks/                       # React hooks
\`\`\`

### Mobile App (React Native)
\`\`\`
seeker_mobile/
├── src/
│   ├── screens/                 # Screen components
│   │   ├── auth/                # Wallet connection
│   │   ├── DashboardScreen.tsx
│   │   ├── SwapScreen.tsx
│   │   └── NotificationSettingsScreen.tsx
│   ├── context/                 # State management
│   │   ├── WalletContext.tsx
│   │   ├── ApiContext.tsx
│   │   └── NotificationContext.tsx
│   ├── components/              # Reusable components
│   ├── navigation/              # Tab navigation
│   └── app.tsx                  # Root component
│
├── app.json                     # React Native config
├── tsconfig.json                # TypeScript config
└── package.json                 # Dependencies
\`\`\`

---

## 🔌 Adding a New Feature

### Step 1: Create the Backend Service

**Example: Adding a new API integration**

\`\`\`typescript
// lib/services/my-service.ts

export interface MyServiceResult {
  success: boolean
  data?: any
  error?: string
}

export async function myServiceFunction(params: Record<string, any>): Promise<MyServiceResult> {
  try {
    const response = await fetch("https://api.example.com/endpoint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error("[v0] Service error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
\`\`\`

### Step 2: Create the API Route

\`\`\`typescript
// app/api/my-feature/route.ts

import { type NextRequest, NextResponse } from "next/server"
import { myServiceFunction } from "@/lib/services/my-service"

export async function POST(request: NextRequest) {
  try {
    const { param1, param2 } = await request.json()

    const result = await myServiceFunction({ param1, param2 })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error("[v0] Route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
\`\`\`

### Step 3: Create the UI Component

\`\`\`typescript
// components/my-feature-panel.tsx

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function MyFeaturePanel() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleExecute = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/my-feature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ param1: "value1", param2: "value2" }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error("[v0] Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Feature</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={handleExecute} disabled={isLoading}>
          {isLoading ? "Loading..." : "Execute"}
        </Button>
        {result && <p>{JSON.stringify(result)}</p>}
      </CardContent>
    </Card>
  )
}
\`\`\`

### Step 4: Add AI Agent Tool (Optional)

\`\`\`typescript
// In app/api/agent/route.ts

// Add to tools array:
{
  name: "my_tool",
  description: "What this tool does",
  parameters: {
    type: "object",
    properties: {
      param1: {
        type: "string",
        description: "Description of param1",
      },
    },
    required: ["param1"],
  },
}

// Add to case statement:
case "my_tool": {
  const { myServiceFunction } = await import("@/lib/services/my-service")
  const result = await myServiceFunction(args)
  return result
}
\`\`\`

### Step 5: Add Mobile Support

\`\`\`typescript
// seeker_mobile/src/screens/MyFeatureScreen.tsx

import React, { useState } from "react"
import { View, Text, StyleSheet, ScrollView } from "react-native"
import { Button } from "react-native"

export function MyFeatureScreen() {
  const [isLoading, setIsLoading] = useState(false)

  const handlePress = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("https://solana-reimagine.vercel.app/api/my-feature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ param1: "value1" }),
      })

      const data = await response.json()
      console.log("[v0] Response:", data)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>My Feature</Text>
      <Button title={isLoading ? "Loading..." : "Execute"} onPress={handlePress} disabled={isLoading} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#1a1a1a" },
  title: { color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 16 },
})
\`\`\`

---

## 🛠️ Common Development Tasks

### Adding a New Token Integration

1. Create service in `lib/services/my-token-service.ts`
2. Add API route `/api/tokens/my-token`
3. Create panel component
4. Add to agent tools if needed
5. Update README with token info

### Adding a New Trading Feature

1. Extend `lib/tools/execute-*.ts` with new logic
2. Add tool definition in agent route
3. Create UI panel for the feature
4. Add notifications if needed
5. Test with mock wallet first

### Adding Notifications for a Feature

1. Import `notifyTradingRecommendation` from `lib/services/notifications`
2. Call after successful operation:
   \`\`\`typescript
   await notifyTradingRecommendation(
     "Feature Complete",
     "Your operation finished successfully",
     { type: "feature_name" }
   )
   \`\`\`
3. Users can control notifications in settings

---

## 🧪 Testing

### Web App

\`\`\`bash
# Run development server
npm run dev

# Type check
npm run type-check

# Lint
npm run lint
\`\`\`

### Mobile App

\`\`\`bash
# Install dependencies
cd seeker_mobile
npm install

# Run on Android (requires Seeker device or emulator)
yarn android

# Build APK
yarn android:build
\`\`\`

### Testing Notifications

\`\`\`typescript
// Test in browser console
await Notification.requestPermission()
new Notification("Test", { body: "This is a test" })
\`\`\`

---

## 📚 Important Files Reference

| File | Purpose |
|------|---------|
| `lib/services/jupiter.ts` | DEX integration hub |
| `lib/tools/execute-swap.ts` | Core swap logic |
| `app/api/agent/route.ts` | AI agent with all tools |
| `components/solana-copilot.tsx` | Chat UI |
| `lib/services/notifications.ts` | Push notification service |
| `public/service-worker.js` | Browser notifications |
| `seeker_mobile/src/context/WalletContext.tsx` | Mobile wallet state |

---

## 🔒 Security Checklist

- ✅ Never expose API keys to client
- ✅ Validate all user inputs on server
- ✅ Use Next.js environment variables for secrets
- ✅ Verify wallet signatures for sensitive operations
- ✅ Rate limit API endpoints
- ✅ Log errors server-side only
- ✅ Sanitize user-generated content
- ✅ Use HTTPS for all requests

---

## 📖 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Solana Web3.js](https://github.com/solana-labs/solana-web3.js)
- [Jupiter API Docs](https://station.jup.ag/docs/apis)
- [React Native Docs](https://reactnative.dev/docs)
- [Tailwind CSS](https://tailwindcss.com)

---

**Happy coding! 🚀**
