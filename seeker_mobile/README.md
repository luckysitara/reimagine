# Seeker Mobile - Reimagine DeFi Trading App

A React Native mobile app for Solana Seeker devices that brings the power of the reimagine trading platform to Android.

## Features

- **Token Swap**: Trade any Solana token instantly via Jupiter aggregator
- **Portfolio Management**: View holdings, asset allocation, and performance tracking
- **Limit Orders**: Set up automated buy/sell orders at target prices
- **DCA (Dollar Cost Averaging)**: Automated recurring purchases
- **AI Copilot**: Natural language commands for trading operations
- **Secure Wallet Connection**: Mobile Wallet Adapter integration with cached sessions
- **Real-time Data**: Live token prices and portfolio analytics

## Setup

### Prerequisites
- Android SDK 28+
- Node.js 16+
- React Native CLI

### Installation

```bash
cd seeker_mobile
npm install
# or
yarn install
```

### Configuration

Create a `.env` file in the `seeker_mobile` directory:

```env
REACT_APP_API_URL=https://solana-reimagine.vercel.app/api
REACT_APP_JUPITER_API_KEY=your_jupiter_api_key
```

### Running the App

```bash
npm run android
# or
yarn android
```

## Backend API Integration

The app communicates with the reimagine backend at:
- Base URL: `https://solana-reimagine.vercel.app/api`

### Available Endpoints

- `GET /jupiter/tokens` - Get all available tokens
- `GET /jupiter/quote` - Get swap quote
- `POST /jupiter/swap` - Execute token swap
- `POST /jupiter/limit-orders` - Create limit order
- `GET /jupiter/portfolio` - Get wallet portfolio
- `POST /agent` - Send AI Copilot commands

## Architecture

```
seeker_mobile/
├── src/
│   ├── context/           # Zustand stores and context providers
│   │   ├── WalletContext.tsx
│   │   └── ApiContext.tsx
│   ├── screens/           # App screens
│   │   ├── auth/
│   │   ├── DashboardScreen.tsx
│   │   ├── SwapScreen.tsx
│   │   ├── PortfolioScreen.tsx
│   │   ├── LimitOrdersScreen.tsx
│   │   ├── CopilotScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── navigation/        # Navigation configuration
│   │   └── BottomTabNavigator.tsx
│   ├── utils/             # Utility functions
│   └── App.tsx            # Main app component
├── app.json               # React Native config
├── package.json
└── tsconfig.json
```

## Wallet Connection Flow

1. User connects via Mobile Wallet Adapter
2. Authorization cached in AsyncStorage
3. Automatic reconnection on app launch
4. All transactions signed securely via wallet

## State Management

Using **Zustand** for lightweight state management:
- Wallet state (address, connected status)
- Portfolio data (tokens, prices, balances)
- Trading state (quotes, orders)

## Performance Optimizations

- Memoized components to prevent unnecessary re-renders
- Efficient API caching strategies
- Lazy loading of screens
- Optimized image handling

## Future Features

- Push notifications for order fills
- Biometric authentication
- Offline mode with sync
- Advanced charting
- Trading history
- Multi-wallet support
- Token creation wizard
- NFT marketplace
- Staking integration
- Governance voting

## Security

- Secure wallet signing via Mobile Wallet Adapter
- No private key storage on device
- HTTPS for all API calls
- Input validation and sanitization
- Session timeout after inactivity

## Troubleshooting

### App won't connect to wallet
- Ensure Solana Seeker Wallet is installed
- Check Mobile Wallet Adapter permissions
- Clear app cache and try again

### API calls failing
- Verify internet connection
- Check backend API status
- Confirm API URL in environment variables

### Build issues
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Android build cache: `cd android && ./gradlew clean`
- Update Android SDK to latest version

## Contributing

Please refer to CONTRIBUTING.md in the root repository.

## License

MIT License - See LICENSE file
