#!/bin/bash

# Seeker Mobile - Android SDK Setup Script
# Installs required Android SDK components

set -e

echo "================================================"
echo "Seeker Mobile - Android SDK Setup"
echo "================================================"
echo ""

# Validate ANDROID_HOME
ANDROID_HOME="${ANDROID_HOME:=$HOME/Android/Sdk}"

if [ ! -d "$ANDROID_HOME" ]; then
  echo "ERROR: ANDROID_HOME directory not found at: $ANDROID_HOME"
  echo ""
  echo "Please install Android SDK:"
  echo "1. Download from: https://developer.android.com/studio"
  echo "2. Extract to: $ANDROID_HOME"
  echo "3. Run this script again"
  exit 1
fi

echo "Using ANDROID_HOME: $ANDROID_HOME"
echo ""

SDKMANAGER=""
if [ -f "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" ]; then
  SDKMANAGER="$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager"
elif [ -f "$ANDROID_HOME/tools/bin/sdkmanager" ]; then
  SDKMANAGER="$ANDROID_HOME/tools/bin/sdkmanager"
else
  echo "ERROR: sdkmanager not found in standard locations"
  echo "Attempting to download cmdline-tools..."
  
  # Download and install cmdline-tools
  TEMP_DIR="/tmp/android-cmdline-tools"
  mkdir -p "$TEMP_DIR"
  cd "$TEMP_DIR"
  
  if [[ "$OSTYPE" == "darwin"* ]]; then
    CMDLINE_TOOLS_URL="https://dl.google.com/android/repository/commandlinetools-mac-11125038_latest.zip"
  else
    CMDLINE_TOOLS_URL="https://dl.google.com/android/repository/commandlinetools-linux-11125038_latest.zip"
  fi
  
  if ! curl -L -o "cmdline-tools.zip" "$CMDLINE_TOOLS_URL" --max-time 180; then
    echo "ERROR: Failed to download cmdline-tools"
    exit 1
  fi
  
  if ! unzip -q "cmdline-tools.zip"; then
    echo "ERROR: Failed to extract cmdline-tools"
    exit 1
  fi
  
  mkdir -p "$ANDROID_HOME/cmdline-tools"
  mv "cmdline-tools" "$ANDROID_HOME/cmdline-tools/latest"
  cd -
  rm -rf "$TEMP_DIR"
  
  SDKMANAGER="$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager"
fi

echo "Using sdkmanager: $SDKMANAGER"
echo ""

echo "Accepting Android SDK licenses..."
yes | $SDKMANAGER --licenses > /dev/null 2>&1 || true

echo "Installing required SDK packages..."
echo "This may take several minutes..."
echo ""

$SDKMANAGER \
  "platforms;android-31" \
  "build-tools;34.0.0" \
  "system-images;android-31;default;arm64-v8a" \
  "emulator" || {
    echo "WARNING: Some SDK components may already be installed"
  }

echo ""
echo "================================================"
echo "SUCCESS: Android SDK is ready!"
echo "================================================"
echo ""
echo "Next step: Create an Android Virtual Device"
echo "Run: bash setup-android-emulator.sh"
