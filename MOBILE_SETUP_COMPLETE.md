# Complete Guide: Setting Up the Solana Seeker Mobile App for Beginners

## What You're Building

You're creating a mobile version of the **Reimagine** app that runs on Android Seeker phones. The mobile app uses the **same backend APIs** as the web version, meaning:

- When you swap tokens on mobile, it uses the same Jupiter integration
- When you check your portfolio, it pulls from the same servers
- When you use the AI Copilot, it talks to the same backend
- Your data syncs across web and mobile automatically

Think of it like Gmail: you have the web version and mobile app, but they share the same account and data.

---

## Part 1: Understanding What You Need

### What Is React Native?

React Native is a framework that lets you write mobile apps using JavaScript (like web development), but the app runs natively on Android. Instead of learning Android-specific languages, you write code once and it works on mobile.

### What Is the Solana Seeker?

The Solana Seeker is a special Android phone optimized for crypto transactions. It has built-in security features for wallet management using Mobile Wallet Adapter (MWA).

### System Architecture: How It Works

```
┌─────────────────────────────────────────────────────────┐
│  Your Computer (Development Machine)                     │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Node.js &    │  │ Android SDK  │  │ React Native │  │
│  │ npm          │  │ & Tools      │  │ Metro        │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                           │                              │
│                           └─────────────┬────────────┐   │
└───────────────────────────────────────────┼─────────────┘
                                            │
                                            ▼
                          ┌─────────────────────────────┐
                          │  Android Emulator or         │
                          │  Physical Seeker Device      │
                          │                             │
                          │  ┌──────────────────────┐   │
                          │  │ Reimagine Mobile App │   │
                          │  └──────────────────────┘   │
                          └─────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────────┐
                    │  Web Backend APIs (Same as web)   │
                    │  https://solana-reimagine...      │
                    │  /api/portfolio                   │
                    │  /api/jupiter/swap                │
                    │  /api/agent (AI Copilot)          │
                    └───────────────────────────────────┘
```

---

## Part 2: Prerequisites (What to Install First)

### Step 1: Check Your Node.js Installation

Node.js is a JavaScript runtime that lets you run JavaScript on your computer.

```bash
# Check if installed
node --version

# You need v18.0.0 or higher
# If not installed, download from https://nodejs.org
```

Expected output:
```
v18.17.0  ← This is fine
```

### Step 2: Check Your Java Installation

Java is needed to compile Android apps.

```bash
java -version
```

Expected output:
```
openjdk version "17.0.1" 2021-10-19
OpenJDK Runtime Environment (build 17.0.1+12-39)
```

If you don't have Java 11 or 17:
- **Windows**: Download from https://adoptopenjdk.net/
- **macOS**: `brew install openjdk@17`
- **Linux**: `sudo apt-get install openjdk-17-jdk`

### Step 3: Install Android SDK

The Android SDK contains tools to build and run Android apps.

**On macOS:**
```bash
brew install android-sdk
```

**On Linux:**
```bash
sudo apt-get install android-sdk
```

**On Windows:**
Download Android Studio from https://developer.android.com/studio

### Step 4: Configure Android Environment Variables

These variables tell your computer where Android tools are located.

**On macOS/Linux:**
Add this to your `~/.bashrc`, `~/.zshrc`, or `~/.bash_profile`:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
# OR
export ANDROID_HOME=$HOME/Android/Sdk  # Linux

export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

Then reload your shell:
```bash
source ~/.bashrc  # or ~/.zshrc or ~/.bash_profile
```

**On Windows (PowerShell as Admin):**
```powershell
$env:ANDROID_HOME = "$env:USERPROFILE\AppData\Local\Android\Sdk"
$env:Path += ";$env:ANDROID_HOME\tools"
$env:Path += ";$env:ANDROID_HOME\tools\bin"
$env:Path += ";$env:ANDROID_HOME\platform-tools"
```

Verify it's set correctly:
```bash
echo $ANDROID_HOME
# Should output your Android SDK path
```

### Step 5: Install Git

Git is used for version control. Download from https://git-scm.com/

Verify:
```bash
git --version
# git version 2.40.0
```

---

## Part 3: Getting the Code

### Step 1: Clone the Repository

This downloads the entire Reimagine project to your computer.

```bash
# Navigate to where you want the project
cd ~/Projects  # or any folder you prefer

# Clone the repository
git clone https://github.com/yourusername/reimagine.git

# Navigate into the project
cd reimagine

# Go to the mobile folder
cd seeker_mobile
```

After this, your folder structure looks like:
```
reimagine/
├── components/        ← Web app components
├── app/              ← Web app pages
├── lib/              ← Shared utilities
├── seeker_mobile/    ← Mobile app (you are here)
│   ├── src/
│   ├── android/
│   ├── package.json
│   └── app.json
└── README.md
```

### Step 2: Verify You're in the Right Folder

```bash
# You should be in: reimagine/seeker_mobile
pwd

# You should see these files
ls -la
# package.json
# app.json
# tsconfig.json
# .env.example
# src/
# android/
```

---

## Part 4: Installing Dependencies

Dependencies are third-party libraries your app needs to run.

### Step 1: Install npm Packages

```bash
# From inside seeker_mobile/ folder
npm install

# This will take 2-5 minutes
# You'll see lots of output - this is normal
```

What's happening:
1. npm reads `package.json` (list of required libraries)
2. Downloads each library from npm registry
3. Installs them in `node_modules/` folder
4. Creates `package-lock.json` (record of what was installed)

Expected completion:
```
added 500 packages in 2m
```

### Step 2: Verify Installation

```bash
# Check if React Native is installed correctly
npx react-native --version

# Should output: react-native-cli: 12.1.0
```

---

## Part 5: Setting Up Environment Variables

Environment variables are configuration values your app reads at startup.

### Step 1: Create .env File

```bash
# From seeker_mobile/ folder
cp .env.example .env

# Now you have a .env file with defaults
```

### Step 2: Edit the .env File

Open `.env` in your text editor:

```env
# API Configuration - Points to the web backend
REACT_APP_API_BASE_URL=https://solana-reimagine.vercel.app/api

# Solana Network - Uses mainnet for real transactions
REACT_APP_NETWORK=mainnet-beta
REACT_APP_RPC_URL=https://api.mainnet-beta.solana.com

# Development
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_DEBUG_MODE=false
```

**Important**: These values tell the mobile app:
- Where to find the backend APIs (same as web version)
- Which Solana network to use (mainnet = real money, testnet = free test)
- Debug settings

### Understanding the API Connection

When your mobile app starts:

```
Mobile App (Android)
    ↓ (reads REACT_APP_API_BASE_URL)
    ↓
https://solana-reimagine.vercel.app/api
    ↓ (routes to)
    ├── /portfolio
    ├── /jupiter/swap
    ├── /jupiter/tokens
    ├── /agent
    └── ... (all same endpoints as web)
    ↓
Backend responses with data
```

---

## Part 6: Setting Up Android Development

### Step 1: Create an Android Emulator (Virtual Phone)

An emulator is a virtual Android phone that runs on your computer.

```bash
# List available emulators you already have
emulator -list-avds

# If empty, create a new one
avdmanager create avd \
  -n seeker_test \
  -k "system-images;android-33;default;arm64-v8a" \
  -d "pixel_4"
```

What this does:
- Creates a virtual device named "seeker_test"
- Uses Android 13 (API 33)
- Simulates a Pixel 4 phone

### Step 2: Start the Emulator

```bash
# Start the emulator
emulator -avd seeker_test

# This opens a window with a virtual phone
# Wait 1-2 minutes for it to fully boot
```

You should see a virtual Android phone start up on your screen.

### Step 3: Verify Emulator Connection

In a new terminal:
```bash
adb devices

# Should output:
# List of attached devices
# emulator-5554          device
```

If you see "emulator-5554" - congratulations! Your emulator is connected.

---

## Part 7: Running the App

### Step 1: Start the Metro Bundler (Terminal 1)

The Metro bundler compiles your JavaScript into a format Android can understand.

```bash
# From seeker_mobile/ folder
npm start

# You should see:
# ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
# │  Metro Bundler ready.  │
# ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
```

**Leave this terminal running** - it watches for file changes and recompiles.

### Step 2: Build and Run on Emulator (Terminal 2)

```bash
# From seeker_mobile/ folder (new terminal)
npm run android

# This will:
# 1. Compile the app (takes 1-3 minutes)
# 2. Install it on the emulator
# 3. Launch the app automatically
```

Expected output:
```
BUILD SUCCESSFUL in 45s
Installing APK 'app-debug.apk'...
app-debug.apk installed
Launching app...
```

You should see the app open on the emulator screen!

### Step 3: Testing the App

Once the app is open:

1. **Connect Wallet**
   - Tap the blue button
   - Choose your wallet provider
   - Approve connection

2. **Check Dashboard**
   - Should show your wallet balance
   - Lists your tokens
   - Shows portfolio value

3. **Try a Swap**
   - Go to Swap tab
   - Select token to pay
   - Select token to receive
   - See real-time quote from Jupiter
   - Review fees

4. **Check Copilot**
   - Type "analyze my portfolio"
   - Should show portfolio analysis
   - Try "swap 1 SOL for USDC"
   - Watch as it executes on blockchain

### Hot Reload (Live Updates)

While `npm start` is running, you can edit code and see changes instantly:

```bash
# In the emulator:
# Press 'r' to reload the app
# Or save a file - it auto-reloads
```

---

## Part 8: How Mobile App Uses Web Backend

### The Connection Flow

```
┌──────────────────────────────────────────────────┐
│  Reimagine Mobile App on Seeker Phone            │
│  (Running in emulator or real device)            │
│                                                  │
│  User taps "Swap" button                        │
│         ↓                                        │
│  Component sends request:                       │
│  POST /api/jupiter/quote                        │
│  { inputMint: "...", outputMint: "..." }        │
└──────────────────────────────────────────────────┘
                       ↓
            (HTTP request over internet)
                       ↓
┌──────────────────────────────────────────────────┐
│  Solana Reimagine Web Backend                    │
│  (https://solana-reimagine.vercel.app)          │
│                                                  │
│  Receives request at /api/jupiter/quote         │
│  Calls Jupiter API: fetch quotes                │
│  Returns: { price, fees, slippage }             │
└──────────────────────────────────────────────────┘
                       ↓
            (HTTP response over internet)
                       ↓
┌──────────────────────────────────────────────────┐
│  Mobile App receives data                       │
│  Displays quote to user                         │
│  User approves swap                             │
│  App sends transaction to blockchain            │
└──────────────────────────────────────────────────┘
```

### Key Endpoints Your App Uses

| Endpoint | Purpose | Example |
|----------|---------|---------|
| `/api/jupiter/quote` | Get swap price | Token A → Token B pricing |
| `/api/jupiter/tokens` | List all tokens | Populate dropdown |
| `/api/portfolio` | Get wallet balance | Show $5,000 portfolio |
| `/api/jupiter/swap` | Execute swap | Send transaction |
| `/api/agent` | AI Copilot | "Swap 1 SOL for USDC" |
| `/api/jupiter/limit-orders` | Manage orders | Create price alerts |

All these endpoints are already on your web backend, so mobile just calls them.

---

## Part 9: Troubleshooting Common Issues

### Issue: "command not found: node"

**Solution**: Node.js isn't installed or not in PATH

```bash
# Reinstall Node.js from https://nodejs.org/
# Then restart your terminal
node --version
```

### Issue: "ANDROID_HOME not set"

**Solution**: Environment variable missing

```bash
# Check if set
echo $ANDROID_HOME

# If empty, add to your ~/.bashrc or ~/.zshrc:
export ANDROID_HOME=$HOME/Library/Android/sdk
source ~/.bashrc
```

### Issue: "No connected devices found"

**Solution**: Emulator isn't running

```bash
# List running emulators
adb devices

# If empty, start emulator
emulator -avd seeker_test

# Wait 2 minutes for boot, then try again
adb devices
```

### Issue: "Metro bundler port 8081 in use"

**Solution**: Another process is using the port

```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9

# Or use different port
npm start -- --port 8082
```

### Issue: "Cannot find module '@react-native/...'"

**Solution**: Dependencies not installed properly

```bash
# From seeker_mobile/ folder
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Error: Could not connect to development server"

**Solution**: Metro bundler not running

```bash
# Make sure you have 2 terminals:
# Terminal 1: npm start (still running?)
# Terminal 2: npm run android

# If Terminal 1 closed, restart it
npm start
```

### Issue: App crashes when selecting tokens

**Solution**: API not responding or environment variables wrong

```bash
# Check .env file has correct URL
cat seeker_mobile/.env

# Should show:
# REACT_APP_API_BASE_URL=https://solana-reimagine.vercel.app/api

# If wrong, edit and save
# Then reload app (press 'r' in emulator)
```

---

## Part 10: Debugging

### Check Device Logs

```bash
# See all app logs
adb logcat

# Filter for your app
adb logcat | grep Reimagine

# Clear logs first, then run action
adb logcat -c
# (do something in app)
adb logcat
```

### Enable Debug Menu on Emulator

```bash
# In emulator, press Ctrl+M
# Select "Debug" from menu
# Check network requests being made
```

### Test API Directly

```bash
# Test if backend is working
curl https://solana-reimagine.vercel.app/api/jupiter/tokens

# Should return list of tokens
# If error, backend might be down
```

---

## Part 11: Running on Real Seeker Device

### Prerequisites

- Seeker phone with USB cable
- USB debugging enabled on phone
- Same npm/Android SDK setup

### Step 1: Enable USB Debugging

On your Seeker phone:
1. Settings → About Phone
2. Tap "Build Number" 7 times
3. Go back → Developer Options
4. Enable "USB Debugging"

### Step 2: Connect Device

```bash
# Connect via USB cable
adb devices

# Should see:
# H3mb_XXXX          device
```

### Step 3: Build and Deploy

```bash
# From seeker_mobile/ folder
npm run android

# Installs and runs on your physical phone
```

---

## Part 12: Production Build

When ready to deploy to users:

```bash
# Create optimized release build
./gradlew assembleRelease

# Output location:
# android/app/build/outputs/apk/release/app-release.apk

# This APK can be distributed via:
# - Google Play Store
# - Direct download
# - Enterprise distribution
```

---

## Part 13: What's Next

1. **Test all features**
   - Swap tokens
   - Create limit orders
   - Check portfolio
   - Use AI Copilot

2. **Connect to real wallet**
   - Download Mobile Wallet Adapter
   - Create Solana wallet
   - Approve mobile app connections

3. **Customize the app**
   - Edit colors in `src/theme.ts`
   - Add your branding
   - Customize features in `src/screens/`

4. **Deploy to Play Store**
   - Create Google Play Developer account
   - Build release APK
   - Upload and publish

---

## Quick Reference: All Commands

```bash
# Setup
npm install                    # Install dependencies
cp .env.example .env          # Create env file

# Development
npm start                      # Start Metro bundler
npm run android               # Run on emulator/device

# Debugging
adb devices                   # List connected devices
adb logcat                    # View device logs
adb logcat -c                 # Clear logs

# Building
./gradlew assembleDebug       # Debug build
./gradlew assembleRelease     # Release build

# Testing
npm test                      # Run tests
npm run lint                  # Check code quality

# Cleanup
rm -rf node_modules           # Remove dependencies
npm install                   # Reinstall
```

---

## Support Resources

1. **React Native Docs**: https://reactnative.dev/
2. **Solana Mobile Docs**: https://docs.solanamobile.com/
3. **Android Studio**: https://developer.android.com/studio
4. **Project README**: [../README.md](../README.md)
5. **GitHub Issues**: Create issue if stuck

---

Good luck! You're now ready to develop mobile DeFi apps. 🚀
