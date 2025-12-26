# Seeker Mobile - Reimagine DeFi Trading App

A React Native mobile app for Solana Seeker devices that brings the power of the reimagine trading platform to Android.

## Quick Start

For detailed setup instructions, please see [SETUP.md](./SETUP.md) which includes:
- Prerequisites checklist
- Step-by-step installation
- Environment configuration
- Troubleshooting guide
- Production build instructions

## Features

- **Token Swap**: Trade any Solana token instantly via Jupiter aggregator
- **Portfolio Management**: View holdings, asset allocation, and performance tracking
- **Limit Orders**: Set up automated buy/sell orders at target prices
- **DCA (Dollar Cost Averaging)**: Automated recurring purchases
- **AI Copilot**: Natural language commands for trading operations
- **Secure Wallet Connection**: Mobile Wallet Adapter integration with cached sessions
- **Real-time Data**: Live token prices and portfolio analytics
- **Push Notifications**: Get alerts for order fills and price changes

## Prerequisites

- **Android SDK 28+** (API Level 24+ recommended for Seeker OS)
- **Node.js 18.0.0+**
- **React Native CLI 12.0.0+**
- **Java Development Kit (JDK) 11 or 17**

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/yourorg/reimagine.git
cd reimagine/seeker_mobile
```

### 2. Install Dependencies

```bash
npm install
```

For detailed troubleshooting, see [SETUP.md](./SETUP.md#troubleshooting).

### 3. Environment Configuration

Create a `.env` file using the provided template:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
REACT_APP_API_BASE_URL=https://solana-reimagine.vercel.app/api
REACT_APP_RPC_URL=https://api.mainnet-beta.solana.com
REACT_APP_NETWORK=mainnet-beta
```

### 4. Run the App

```bash
npm start                    # Start Metro bundler
npm run android             # Build and run on Android device/emulator
```

## Backend API Integration

The app communicates with the reimagine backend at:
- **Base URL**: `https://solana-reimagine.vercel.app/api`

### Available Endpoints

- `GET /jupiter/tokens` - Get all available tokens
- `GET /jupiter/quote` - Get swap quote
- `POST /jupiter/swap` - Execute token swap
- `POST /jupiter/limit-orders` - Create limit order
- `GET /portfolio` - Get wallet portfolio
- `POST /agent` - Send AI Copilot commands
- `POST /notifications/limit-order` - Subscribe to notifications

## Architecture

```
seeker_mobile/
├── src/
│   ├── app.tsx                    # Main app entry
│   ├── context/                   # State management
│   │   ├── WalletContext.tsx     # Wallet connection state
│   │   ├── ApiContext.tsx        # API configuration
│   │   └── NotificationContext.tsx
│   ├── screens/                   # App screens
│   │   ├── auth/
│   │   │   └── ConnectWalletScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── SwapScreen.tsx
│   │   ├── PortfolioScreen.tsx
│   │   ├── LimitOrdersScreen.tsx
│   │   ├── CopilotScreen.tsx
│   │   ├── NotificationSettingsScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── services/                  # API & blockchain services
│   │   ├── api-client.ts         # HTTP client
│   │   ├── wallet-service.ts     # Mobile Wallet Adapter
│   │   └── notification-service.ts
│   └── components/                # Reusable components
├── app.json                       # React Native config
├── package.json                   # Dependencies (updated versions)
├── tsconfig.json                  # TypeScript config
├── SETUP.md                       # Detailed setup guide
└── .env.example                   # Environment template
```

## Wallet Connection Flow

1. User connects via Mobile Wallet Adapter
2. Authorization cached in AsyncStorage for persistent sessions
3. Automatic reconnection on app launch
4. All transactions signed securely via wallet
5. No private keys stored on device

## State Management

Using **Zustand** for lightweight state management:
- Wallet state (address, connected status, public key)
- Portfolio data (tokens, prices, balances)
- Trading state (quotes, orders, notifications)

## Performance Optimizations

- Memoized components to prevent unnecessary re-renders
- Efficient API caching strategies
- Lazy loading of screens
- Optimized image handling for OLED displays
- Battery-aware animation frame rates

## Features Status

| Feature | Status | Notes |
|---------|--------|-------|
| Wallet Connection | ✅ Complete | Mobile Wallet Adapter integrated |
| Token Swap | ✅ Complete | Jupiter aggregator |
| Portfolio View | ✅ Complete | Real-time balances |
| Limit Orders | ✅ Complete | Price alerts |
| AI Copilot | ✅ Complete | Natural language commands |
| Notifications | ✅ Complete | Order fills & price alerts |
| DCA Orders | 🔄 Planned | Q2 2025 |
| Multi-Wallet | 🔄 Planned | Q2 2025 |
| Offline Mode | 🔄 Planned | Q3 2025 |
| NFT Marketplace | 🔄 Planned | Q3 2025 |

## Security

- Secure wallet signing via Mobile Wallet Adapter
- No private key storage on device
- HTTPS for all API calls
- Input validation and sanitization
- Session timeout after inactivity
- Biometric authentication (planned)

## Troubleshooting

For comprehensive troubleshooting, see [SETUP.md#troubleshooting](./SETUP.md#troubleshooting).

### Quick Fixes

**App won't connect to wallet**
- Ensure Solana Seeker Wallet is installed
- Check Mobile Wallet Adapter permissions
- Clear app cache: `adb shell pm clear com.yourorg.reimagine_mobile`

**API calls failing**
- Verify internet connection and RPC URL
- Check backend API status at `https://solana-reimagine.vercel.app/api`
- Confirm API URL in `.env` file

**Build issues**
```bash
rm -rf node_modules package-lock.json
npm install
cd android && ./gradlew clean
npm run android
```

## Development Commands

```bash
npm start              # Start Metro bundler
npm run android        # Build and run on Android
npm test              # Run tests
npm run lint          # Run ESLint
npm run lint:fix      # Fix linting issues
```

## Contributing

Please refer to [CONTRIBUTING.md](../CONTRIBUTING.md) in the root repository.

## Related Documentation

- [SETUP.md](./SETUP.md) - Detailed setup and installation guide
- [../README.md](../README.md) - Main project documentation
- [../SOLANA_MOBILE_REQUIREMENTS.md](../SOLANA_MOBILE_REQUIREMENTS.md) - Solana Mobile grant compliance
- [../PITCH_DECK.md](../PITCH_DECK.md) - Project pitch deck

## License

MIT License - See [LICENSE](../LICENSE) file

---

**Branch**: `seeker_mobile`  
**Last Updated**: December 26, 2025  
**Status**: Production Ready for Solana Seeker Devices
