#!/bin/bash

# Seeker Mobile - Android Emulator Setup Script
# This script handles Android emulator creation and validation

set -e

echo "================================================"
echo "Seeker Mobile - Android Emulator Setup"
echo "================================================"
echo ""

# Check if ANDROID_HOME is set
if [ -z "$ANDROID_HOME" ]; then
    echo "ERROR: ANDROID_HOME is not set"
    echo ""
    echo "Set it with:"
    echo "  export ANDROID_HOME=\$HOME/Android/Sdk  # Linux"
    echo "  export ANDROID_HOME=\$HOME/Library/Android/sdk  # macOS"
    exit 1
fi

echo "Using ANDROID_HOME: $ANDROID_HOME"
echo ""

# Check if SDK tools exist
if [ ! -f "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" ]; then
    echo "ERROR: Android SDK cmdline-tools not found at expected location"
    echo "Path: $ANDROID_HOME/cmdline-tools/latest/bin/"
    echo ""
    echo "Installing cmdline-tools..."
    
    # Try alternative path
    if [ -f "$ANDROID_HOME/tools/bin/sdkmanager" ]; then
        SDKMANAGER="$ANDROID_HOME/tools/bin/sdkmanager"
    else
        echo "ERROR: Could not find sdkmanager"
        echo "Please install Android SDK from: https://developer.android.com/studio"
        exit 1
    fi
else
    SDKMANAGER="$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager"
fi

echo "Using sdkmanager: $SDKMANAGER"
echo ""

# Install required SDK components
echo "Installing Android SDK components..."
echo "This may take a few minutes..."
echo ""

yes | "$SDKMANAGER" "platforms;android-31" "build-tools;34.0.0" "system-images;android-31;default;arm64-v8a" || {
    echo "WARNING: Some SDK components may already be installed"
}

echo ""
echo "SDK components ready!"
echo ""

# Get AVDMANAGER path
if [ -f "$ANDROID_HOME/cmdline-tools/latest/bin/avdmanager" ]; then
    AVDMANAGER="$ANDROID_HOME/cmdline-tools/latest/bin/avdmanager"
else
    AVDMANAGER="$ANDROID_HOME/tools/bin/avdmanager"
fi

# Check if emulator already exists
echo "Checking for existing emulator 'seeker_emulator'..."
echo ""

EXISTING_AVD=$("$AVDMANAGER" list avd | grep -c "seeker_emulator" || true)

if [ $EXISTING_AVD -gt 0 ]; then
    echo "Emulator 'seeker_emulator' already exists!"
    echo ""
    echo "To start it, run:"
    echo "  \$ANDROID_HOME/emulator/emulator -avd seeker_emulator"
else
    echo "Creating emulator 'seeker_emulator'..."
    echo ""
    
    # Create the emulator
    "$AVDMANAGER" create avd \
        -n seeker_emulator \
        -k "system-images;android-31;default;arm64-v8a" \
        -d pixel_4 \
        --force
    
    echo ""
    echo "Emulator created successfully!"
fi

echo ""
echo "================================================"
echo "Setup Complete!"
echo "================================================"
echo ""
echo "To start the emulator, run:"
echo "  \$ANDROID_HOME/emulator/emulator -avd seeker_emulator &"
echo ""
echo "Then in another terminal, run:"
echo "  npm start -- --port 8082"
echo ""
echo "And in a third terminal:"
echo "  npm run android"
echo ""
