# 🚀 Reimagine - AI-Powered DeFi Trading Platform on Solana

<div align="center">

![Reimagine Banner](./public/digital-art-collection.png)

**The Future of DeFi Trading - Powered by AI**

[🌐 Live Demo](http://solana-reimagine.vercel.app) | [📊 Pitch Deck](#) | [📹 Demo Video](#) 

[![Built with Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Powered by Solana](https://img.shields.io/badge/Solana-Mainnet-9945FF)](https://solana.com/)
[![AI by Gemini](https://img.shields.io/badge/AI-Google%20Gemini-4285F4)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Live Demo](#-live-demo)
- [Screenshots](#-screenshots)
- [Getting Started](#-getting-started)
- [Environment Setup](#-environment-setup)
- [API Documentation](#-api-documentation)
- [Tech Stack](#-tech-stack)
- [Security](#-security)
- [Hackathon Submission](#-hackathon-submission)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**Reimagine** is a production-ready, AI-powered DeFi trading platform built on Solana that revolutionizes how users interact with blockchain technology. By leveraging Google Gemini's advanced AI capabilities, we've created an intuitive conversational interface that allows anyone - from beginners to power traders - to execute complex DeFi operations through simple natural language commands.

### The Problem

Traditional DeFi platforms are intimidating and complex:
- Users must navigate multiple protocols and interfaces
- Understanding technical jargon is required
- Executing multi-step operations is time-consuming
- Risk management is left entirely to the user

### Our Solution

Reimagine eliminates complexity through AI:
- **Natural Language Trading**: "Swap 100 USDC for SOL" - done
- **Intelligent Optimization**: AI finds the best prices and yields automatically
- **Risk Management**: Built-in portfolio analysis and recommendations
- **Unified Interface**: Access all major Solana protocols in one place

---

## ✨ Key Features

### 🤖 AI-Powered Copilot

- **Natural Language Processing**: Execute trades, stakes, and swaps using conversational commands
- **Context-Aware Responses**: AI understands your portfolio and provides personalized recommendations
- **Function Calling**: Seamless integration with blockchain operations
- **Multi-Turn Conversations**: Ask follow-up questions and refine your strategy

**Example Commands:**
```
"Swap 50 USDC for SOL"
"What's my portfolio worth?"
"Find me the best yield opportunities"
"Stake 10 SOL with the highest APY"
```

### 💱 Token Swaps (Jupiter Integration)

- **Best Price Routing**: Aggregates liquidity from all Solana DEXs
- **Real-Time Quotes**: Live price updates with sub-second latency
- **Slippage Protection**: Configurable slippage tolerance (default 1%)
- **Multi-Hop Routes**: Automatically finds optimal swap paths
- **MEV Protection**: Priority fee optimization for transaction security
- **1000+ Tokens**: Support for all major Solana SPL tokens

**Powered by:** [Jupiter v6 API](https://jup.ag)

### 📊 Portfolio Analytics

- **Real-Time Tracking**: Live SOL and SPL token balances via Helius API
- **USD Valuation**: Automatic price conversion for all holdings
- **Token Metadata**: Rich token information including logos and descriptions
- **24h Performance**: Track daily gains and losses
- **Diversification Score**: Risk analysis and portfolio recommendations
- **Transaction History**: Complete audit trail of all operations

### 🏦 Liquid Staking (Marinade Finance)

- **Earn Rewards**: 7.84% APY on staked SOL
- **Maintain Liquidity**: Receive mSOL tokens that remain tradable
- **Instant Unstake**: Exit positions immediately via liquidity pools
- **Delayed Unstake**: Higher returns with 2-3 day unlock period
- **Auto-Compounding**: Rewards automatically added to your stake

**Integration:** [Marinade Finance](https://marinade.finance)

### 🌾 Yield Farming

- **Protocol Aggregation**: Compare opportunities from Orca, Raydium, and more
- **APY Comparison**: Sort pools by returns, TVL, and risk level
- **Concentrated Liquidity**: Support for Orca Whirlpools
- **Automated Market Making**: Classic AMM pools on Raydium
- **Impermanent Loss Calculator**: Understand risks before providing liquidity
- **One-Click Deposits**: Simplified LP token management

### 🖼️ NFT Management

- **Collection Gallery**: Beautiful grid display of all your NFTs
- **Helius DAS API**: Fast, reliable NFT data via Digital Asset Standard
- **Rich Metadata**: View attributes, descriptions, and collection info
- **Compressed NFTs**: Support for cNFTs for lower fees
- **Solscan Integration**: Direct links to explore on-chain data

### 🏭 Token Studio (Jupiter Studio)

Create your own SPL tokens in minutes:
- **Custom Metadata**: Name, symbol, logo, and description
- **Supply Management**: Configure total supply and decimals
- **Authority Control**: Set mint and freeze authorities
- **Metadata Upload**: Automatic Arweave/IPFS storage
- **Instant Deployment**: Launch to Solana mainnet with one click

### 🤖 Trading Bots & Automation

#### Dollar-Cost Averaging (DCA)
- Set recurring buy orders at fixed intervals
- Reduce impact of volatility
- Configurable frequency and amount

#### Grid Trading
- Profit from price volatility
- Set price ranges and intervals
- Automated buy low, sell high

#### Limit Orders
- Execute trades at target prices
- Set take-profit and stop-loss levels
- Jupiter's on-chain limit order program

### 🎯 Goals & Strategies

- **Financial Goals**: Set targets for savings, income, or growth
- **Automated Execution**: AI recommends and executes optimal strategies
- **Progress Tracking**: Visual dashboards show goal completion
- **Risk-Adjusted Returns**: Match strategies to your risk tolerance

---

## 🏗️ Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (Next.js 16)              │
│  ┌─────────────────────────────────────────────┐   │
│  │  UI Components (React 19 + Tailwind v4)     │   │
│  │  - Trading Panel  - Portfolio Panel          │   │
│  │  - AI Copilot    - Yield Panel               │   │
│  │  - NFT Gallery   - Token Studio              │   │
│  └──────────────┬──────────────────────────────┘   │
└─────────────────┼──────────────────────────────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
┌───────▼────────┐  ┌────────▼────────┐
│  AI Agent      │  │ Wallet Adapter  │
│  (Gemini 2.0)  │  │  - Phantom      │
│                │  │  - Solflare     │
│  - Intent      │  │  - Backpack     │
│  - Tool Calls  │  └────────┬────────┘
│  - Context     │           │
└───────┬────────┘           │
        │                    │
        └─────────┬──────────┘
                  │
        ┌─────────▼──────────────────┐
        │  Transaction Orchestration  │
        │                            │
        │  ┌──────────────────────┐ │
        │  │  Service Layer       │ │
        │  │  - Jupiter Service   │ │
        │  │  - Helius Service    │ │
        │  │  - NFT Service       │ │
        │  │  - Portfolio Tracker │ │
        │  └──────────────────────┘ │
        └─────────┬──────────────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
┌───────▼────────┐  ┌────────▼────────┐
│  External APIs │  │ Solana Network  │
│                │  │                 │
│  - Jupiter v6  │  │  - Helius RPC   │
│  - Helius DAS  │  │  - Validators   │
│  - Marinade    │  │  - Programs     │
│  - Orca/Raydium│  │  - Accounts     │
└────────────────┘  └─────────────────┘
```

### Data Flow

1. **User Input → AI Processing**
   - User enters natural language command
   - Google Gemini parses intent and extracts parameters
   - AI selects appropriate tool (swap, stake, analyze)

2. **Transaction Building**
   - Service layer fetches on-chain data (prices, balances)
   - Transaction builder creates optimized transaction
   - Returns serialized transaction with estimates

3. **User Confirmation → Execution**
   - UI displays transaction review modal
   - User signs with connected wallet
   - Transaction broadcast to Solana network
   - Real-time confirmation polling

---

## 🌐 Live Demo

### 🔗 Links

- **Live Application**: [http://solana-reimagine.vercel.app](http://solana-reimagine.vercel.app)
- **Pitch Deck**: [View Presentation](#) *(Add your pitch deck link)*
- **Demo Video**: [Watch on YouTube](#) *(Add your demo video link)*
- **GitHub Repository**: [View Source Code](#) *(Add your repo link)*

### 🎮 Try It Out

1. Visit the live demo at [http://solana-reimagine.vercel.app](http://solana-reimagine.vercel.app)
2. Connect your Solana wallet (Phantom, Solflare, or Backpack)
3. Try the AI Copilot: "Swap 1 SOL for USDC"
4. Explore your portfolio and NFT collection
5. Browse yield opportunities

**Test Wallet**: Use Solana devnet for testing without real funds

---

## 📸 Screenshots

<div align="center">

### Trading Interface
![Trading Panel](./screenshots/trading.png)
*AI-powered token swaps with Jupiter integration*

### Portfolio Analytics
![Portfolio](./screenshots/portfolio.png)
*Real-time balance tracking and USD valuation*

### AI Copilot
![AI Copilot](./screenshots/copilot.png)
*Natural language DeFi operations*

### NFT Gallery
![NFT Gallery](./screenshots/nfts.png)
*Beautiful NFT collection display*

</div>

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: 18.x or higher
- **npm/yarn/bun**: Latest version
- **Solana Wallet**: Phantom, Solflare, or Backpack browser extension
- **API Keys**: 
  - [Helius API Key](https://dev.helius.xyz/) (Required for RPC access)
  - [Google Gemini API Key](https://ai.google.dev/) (Required for AI features)
  - [Jupiter API Key](https://portal.jup.ag) (Optional but Recommended)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/reimagine.git
cd reimagine

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Add your API keys to .env.local
# NEXT_PUBLIC_HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
# HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
# GOOGLE_GENERATIVE_AI_API_KEY=YOUR_KEY
# JUPITER_API_KEY=YOUR_KEY

# Run development server
npm run dev

# Open http://localhost:3000
```

### Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Run type checking
npm run type-check
```

---

## ⚙️ Environment Setup

### Required Environment Variables

Create a `.env.local` file in the root directory:

```bash
# ============================================
# Solana RPC Configuration
# ============================================

# NEXT_PUBLIC_HELIUS_RPC_URL (Required for client-side wallet operations)
# Get your API key at: https://dev.helius.xyz/
# Free tier: 100k credits/day
NEXT_PUBLIC_HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_api_key_here

# HELIUS_RPC_URL (Required for server-side operations - keeps API key secure)
# Use the same Helius API key as above
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_api_key_here

# Network Selection (mainnet-beta or devnet)
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta

# ============================================
# AI Configuration
# ============================================

# GOOGLE_GENERATIVE_AI_API_KEY (Required for AI Copilot)
# Get your API key at: https://ai.google.dev/
# Free tier: 60 requests/minute
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key_here

# ============================================
# Jupiter API Configuration
# ============================================

# Jupiter API Key (Optional but Recommended)
# Get your free API key at: https://portal.jup.ag
# Provides higher rate limits and priority access
JUPITER_API_KEY=your_jupiter_api_key_here

# ============================================
# Feature Flags (Optional)
# ============================================

# Enable devnet redirect for development
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
```

### Getting API Keys

#### 1. Helius API Key
1. Visit [https://dev.helius.xyz/](https://dev.helius.xyz/)
2. Sign up for a free account
3. Create a new project
4. Copy your API key
5. Add to `.env.local`:
   - `NEXT_PUBLIC_HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY`
   - `HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY`

**Note**: You need both environment variables - `NEXT_PUBLIC_HELIUS_RPC_URL` for client-side wallet operations and `HELIUS_RPC_URL` for secure server-side operations.

**Free Tier**: 100,000 credits/day (sufficient for testing and development)

#### 2. Google Gemini API Key
1. Visit [https://ai.google.dev/](https://ai.google.dev/)
2. Click "Get API Key" → "Create API key in new project"
3. Copy your API key
4. Add to `.env.local`: `GOOGLE_GENERATIVE_AI_API_KEY=YOUR_KEY`

**Free Tier**: 60 requests/minute, 1500 requests/day

#### 3. Jupiter API Key (Optional)
1. Visit [https://portal.jup.ag](https://portal.jup.ag)
2. Sign up for a free account
3. Create a new API key
4. Copy your API key
5. Add to `.env.local`: `JUPITER_API_KEY=YOUR_KEY`

**Benefits**: Higher rate limits, priority access to Jupiter Ultra API features (search, holdings, shield)
**Free Tier**: Generous limits for personal and development use

---

## 📡 API Documentation

### AI Agent Endpoint

**POST** `/api/agent`

Execute natural language DeFi commands through the AI copilot.

**Request:**
```json
{
  "message": "Swap 100 USDC for SOL",
  "walletAddress": "user_wallet_address" // optional
}
```

**Response:**
```json
{
  "text": "I'll help you swap 100 USDC for SOL...",
  "toolCalls": [
    {
      "toolName": "execute_swap",
      "args": {
        "inputToken": "USDC",
        "outputToken": "SOL",
        "amount": 100
      }
    }
  ],
  "toolResults": [
    {
      "tool": "execute_swap",
      "success": true,
      "result": {
        "estimatedOutput": 2.5,
        "priceImpact": 0.1
      }
    }
  ]
}
```

### Portfolio Analysis

**GET** `/api/portfolio?wallet={address}`

Get comprehensive portfolio analysis for a Solana wallet.

**Response:**
```json
{
  "totalValueUSD": 1250.45,
  "solBalance": 5.234,
  "tokens": [...],
  "diversification": {
    "score": 7.5,
    "recommendation": "Well-balanced"
  },
  "riskLevel": "moderate"
}
```

### Token Price

**GET** `/api/token-price?symbol={symbol}`

Get current USD price for any Solana token.

**Response:**
```json
{
  "symbol": "SOL",
  "priceUSD": 98.45,
  "source": "Jupiter",
  "timestamp": 1703001234
}
```

### Jupiter Token List

**GET** `/api/jupiter/tokens`

Get list of all tradable tokens on Jupiter.

**Response:**
```json
[
  {
    "address": "So11111111111111111111111111111111111111112",
    "symbol": "SOL",
    "name": "Wrapped SOL",
    "decimals": 9,
    "logoURI": "https://..."
  }
]
```

---

## 🛠️ Tech Stack

### Frontend

- **Framework**: [Next.js 16](https://nextjs.org/) - React framework with App Router
- **UI Library**: [React 19.2](https://react.dev/) - Latest React with Server Components
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) - Utility-first CSS
- **Components**: [shadcn/ui](https://ui.shadcn.com/) - High-quality React components
- **Language**: [TypeScript 5.x](https://www.typescriptlang.org/) - Strict mode enabled

### Blockchain

- **Network**: [Solana](https://solana.com/) - High-performance blockchain
- **Web3**: [@solana/web3.js](https://solana-labs.github.io/solana-web3.js/) - Solana JavaScript SDK
- **Wallet**: [@solana/wallet-adapter](https://github.com/solana-labs/wallet-adapter) - Multi-wallet support
- **RPC Provider**: [Helius](https://helius.dev/) - Premium Solana RPC

### AI & Backend

- **AI Model**: [Google Gemini 2.0 Flash](https://ai.google.dev/) - Fast, efficient LLM
- **AI SDK**: [@google/genai](https://www.npmjs.com/package/@google/genai) - Official Gemini SDK
- **Runtime**: Edge Runtime - Fast, globally distributed
- **API Routes**: Next.js App Router API routes

### External Integrations

- **DEX Aggregator**: [Jupiter v6](https://jup.ag) - Best-price token swaps
- **RPC & Data**: [Helius API](https://helius.dev) - Fast RPC, balances, NFTs
- **Liquid Staking**: [Marinade Finance](https://marinade.finance) - mSOL staking
- **AMM Pools**: [Orca](https://orca.so) - Concentrated liquidity
- **AMM Pools**: [Raydium](https://raydium.io) - Automated market maker
- **NFT Standard**: [Metaplex](https://metaplex.com) - NFT protocol

### Development Tools

- **Package Manager**: npm/yarn/bun
- **Type Checking**: TypeScript compiler
- **Linting**: ESLint with Next.js config
- **Formatting**: Prettier
- **Version Control**: Git & GitHub

---

## 🔒 Security

### Wallet Security

✅ **Non-Custodial Architecture**
- Private keys never leave user's browser
- All transactions signed client-side in wallet
- No server-side access to user funds
- Open-source wallet adapters only

✅ **Transaction Security**
- Simulation before broadcast prevents failed transactions
- Slippage protection on all swaps (configurable)
- Clear transaction review before signing
- Real-time confirmation polling

### Smart Contract Security

✅ **Whitelisted Programs**
```typescript
const TRUSTED_PROGRAMS = [
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4', // Jupiter v6
  'MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD', // Marinade
  'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc', // Orca
]
```

✅ **Input Validation**
- All user inputs validated and sanitized
- Public key format verification
- Amount range checks
- Rate limiting on API endpoints

### API Security

✅ **Environment Variables**
- API keys stored server-side only
- Never exposed to client-side code
- Automatic rotation recommended

✅ **Error Handling**
- Comprehensive try-catch blocks
- Graceful fallbacks for failed requests
- User-friendly error messages
- Detailed server-side logging

---

## 🏆 Hackathon Submission

### Project Category

**DeFi / AI Integration**

### Problem Statement

Traditional DeFi platforms have a steep learning curve that prevents mainstream adoption. Users must understand complex concepts like slippage, liquidity pools, and gas optimization while navigating fragmented interfaces across multiple protocols.

### Our Solution

Reimagine abstracts away complexity using AI:

1. **Natural Language Interface**: Trade using simple commands like "swap 100 USDC for SOL"
2. **Intelligent Optimization**: AI finds best prices and yields automatically
3. **Risk Management**: Built-in portfolio analysis and recommendations
4. **Unified Platform**: All major Solana protocols in one place

### Innovation

- **First AI-native DeFi platform** on Solana with function calling
- **Context-aware AI** that understands user portfolio and preferences
- **Seamless multi-protocol integration** through intelligent routing
- **Production-ready** with comprehensive error handling and security

### Technical Achievements

✅ Real-time AI-powered transaction execution
✅ Multi-wallet support (Phantom, Solflare, Backpack)
✅ Integration with 5+ major DeFi protocols
✅ Full NFT management with Helius DAS API
✅ Automated trading bots (DCA, Grid, Limit Orders)
✅ Token creation studio
✅ Mobile-responsive design

### Impact & Metrics

- **User Experience**: Reduces trade execution from 5+ clicks to 1 command
- **Price Discovery**: Always gets best rates via Jupiter aggregation
- **Accessibility**: Opens DeFi to non-technical users
- **Safety**: AI prevents common mistakes and warns about risks

### Future Plans

See [Roadmap](#-roadmap) section below.

---

## 🗺️ Roadmap

### Phase 1: Core Platform (✅ Complete)
- [x] AI copilot with Google Gemini
- [x] Jupiter swap integration
- [x] Portfolio tracking
- [x] Wallet adapter
- [x] NFT gallery
- [x] Liquid staking

### Phase 2: Advanced Trading (🚧 In Progress)
- [x] Trading bots (DCA, Grid, Limit)
- [x] Token Studio
- [ ] Advanced charting
- [ ] Technical indicators
- [ ] Trading signals

### Phase 3: Social & Community (📅 Planned)
- [ ] Social trading (copy trading)
- [ ] Strategy marketplace
- [ ] Leaderboards
- [ ] Community chat
- [ ] Educational content

### Phase 4: Cross-Chain (🔮 Future)
- [ ] Ethereum support
- [ ] Cross-chain swaps
- [ ] Multi-chain portfolio
- [ ] Bridge aggregation

### Phase 5: Mobile App (🔮 Future)
- [ ] React Native app
- [ ] Mobile wallet integration
- [ ] Push notifications
- [ ] Biometric authentication

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Use Tailwind CSS for styling
- Add tests for new features
- Update documentation
- Follow existing code patterns

### Areas We Need Help

- 🐛 Bug fixes and testing
- 📖 Documentation improvements
- 🎨 UI/UX enhancements
- 🌐 Translations (i18n)
- 🔧 New feature implementations

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

Built with ❤️ by [Your Name/Team]

- **Your Name** - Full Stack Developer - [@yourtwitter](https://twitter.com/yourhandle)
- Add team members here

---

## 🙏 Acknowledgments

- [Solana Foundation](https://solana.org/) for the blockchain platform
- [Jupiter](https://jup.ag) for DEX aggregation
- [Helius](https://helius.dev) for RPC infrastructure
- [Google](https://ai.google.dev/) for Gemini AI
- [Vercel](https://vercel.com) for deployment platform
- [shadcn](https://ui.shadcn.com/) for UI components

---

## 📞 Contact & Support

- **Email**: your.email@example.com
- **Twitter**: [@yourproject](https://twitter.com/yourhandle)
- **Discord**: [Join our community](#)
- **GitHub Issues**: [Report bugs](https://github.com/yourusername/reimagine/issues)

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

Made with 💜 for the Solana ecosystem

[🔝 Back to Top](#-reimagine---ai-powered-defi-trading-platform-on-solana)

</div>
