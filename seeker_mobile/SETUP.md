# Solana Seeker Mobile App - Setup Guide

## Prerequisites

Before setting up the Seeker mobile app, ensure you have:

- **Node.js**: v18.0.0 or higher
  ```bash
  node --version
  ```

- **React Native CLI**: v12.0.0 or higher
  ```bash
  npm install -g react-native-cli
  ```

- **Android SDK**: API Level 24+ with:
  - Android Build Tools 34.0.0
  - Android Platform Tools 34.0.0
  - Android Emulator or connected device with Seeker OS

- **Java Development Kit (JDK)**: Version 11 or 17
  ```bash
  java -version
  ```

- **Git**: For version control
  ```bash
  git --version
  ```

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/luckysitara/reimagine.git
cd reimagine/seeker_mobile
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

**Note**: If you encounter peer dependency warnings, they can be safely ignored. The app uses compatible versions.

### 3. Configure Environment Variables

Create a `.env` file in the `seeker_mobile/` directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# API Configuration
REACT_APP_API_BASE_URL=https://solana-reimagine.vercel.app/api
REACT_APP_RPC_URL=https://api.mainnet-beta.solana.com

# Solana Network
REACT_APP_NETWORK=mainnet-beta

# Optional: Analytics
REACT_APP_ENABLE_ANALYTICS=true
```

### 4. Setup Android Development Environment

```bash
# For macOS
brew install android-sdk

# For Linux
sudo apt-get install android-sdk

# Verify Android SDK installation
android list avd
```

### 5. Create Android Emulator (Optional)

```bash
# List available emulators
emulator -list-avds

# Create new emulator for Seeker (API 31+)
avdmanager create avd -n seeker_emulator -k "system-images;android-31;default;arm64-v8a"
```

### 6. Start Development Server

```bash
# Terminal 1: Start Metro bundler
npm start

# Terminal 2: Build and run on Android
npm run android
```

## Troubleshooting

### Issue: "No connected devices"

```bash
# List connected devices
adb devices

# Check if adb is in PATH
which adb
```

### Issue: "Metro bundler port 8081 in use"

```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9

# Or use different port
npm start -- --port 8082
```

### Issue: "Gradle build failed"

```bash
# Clean and rebuild
cd seeker_mobile
./gradlew clean
npm run android
```

### Issue: "Module not found errors"

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Running on Real Seeker Device

1. **Enable USB Debugging** on your Seeker device:
   - Settings > Developer Options > USB Debugging

2. **Connect device via USB**:
   ```bash
   adb devices  # Should list your device
   ```

3. **Build and deploy**:
   ```bash
   npm run android
   ```

## Development Workflow

### Hot Reload

The app supports fast refresh during development:

```bash
npm start
```

Press `r` to reload, `d` to open dev menu.

### Building for Production

```bash
# Create release build
./gradlew assembleRelease

# Output: app/build/outputs/apk/release/app-release.apk
```

### Code Quality

```bash
# Run linter
npm run lint

# Run tests
npm test
```

## Project Structure

```
seeker_mobile/
├── src/
│   ├── app.tsx                 # Main app entry
│   ├── context/                # State management
│   ├── screens/                # Screen components
│   ├── services/               # API & blockchain services
│   └── components/             # Reusable components
├── android/                    # Native Android code
├── package.json               # Dependencies
├── app.json                   # App configuration
└── tsconfig.json              # TypeScript config
```

## API Integration

The mobile app connects to the main backend at:
- **Base URL**: `https://solana-reimagine.vercel.app/api`

### Available Endpoints

- `/portfolio` - User portfolio data
- `/jupiter/search` - Token search
- `/jupiter/quote` - Swap quotes
- `/jupiter/order` - Create orders
- `/agent` - AI copilot commands

## Features

- **Wallet Connection**: Mobile Wallet Adapter integration
- **Token Swap**: Real-time Jupiter quotes
- **Portfolio**: View balances and assets
- **Limit Orders**: Set price alerts and orders
- **AI Copilot**: Natural language DeFi commands
- **Notifications**: Real-time updates

## Support

For issues and questions:

1. Check the main [README.md](../README.md)
2. Review [SOLANA_MOBILE_REQUIREMENTS.md](../SOLANA_MOBILE_REQUIREMENTS.md)
3. Check debug logs: `adb logcat`
4. Open an issue on GitHub

## Next Steps

1. Configure your Solana wallet
2. Connect to a Seeker device or emulator
3. Test token swapping functionality
4. Deploy to production

Happy building! 🚀
