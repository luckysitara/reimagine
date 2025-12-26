#!/bin/bash

# Solana Seeker Mobile - Gradle Wrapper Fix Script
# This script downloads the gradle-wrapper.jar file which is required for building

set -e

echo "========================================="
echo "Gradle Wrapper Fix Script"
echo "========================================="

GRADLE_WRAPPER_DIR="android/gradle/wrapper"
GRADLE_WRAPPER_JAR="$GRADLE_WRAPPER_DIR/gradle-wrapper.jar"

# Check if already exists
if [ -f "$GRADLE_WRAPPER_JAR" ]; then
    echo "✓ gradle-wrapper.jar already exists"
    exit 0
fi

# Create directory if it doesn't exist
mkdir -p "$GRADLE_WRAPPER_DIR"

echo "Downloading gradle-wrapper.jar..."
echo "Source: https://repo.gradle.org/gradle/gradle-8.3-bin.zip"

# Download gradle distribution
cd "$GRADLE_WRAPPER_DIR"
curl -L -o gradle-8.3-bin.zip "https://repo.gradle.org/gradle/gradle-8.3-bin.zip" || \
curl -L -o gradle-8.3-bin.zip "https://github.com/gradle/gradle/releases/download/v8.3/gradle-8.3-bin.zip"

# Validate the zip file is not corrupted
if ! unzip -t gradle-8.3-bin.zip > /dev/null 2>&1; then
    echo "ERROR: Downloaded file is corrupted. Trying alternative download..."
    rm -f gradle-8.3-bin.zip
    curl -L -o gradle-8.3-bin.zip "https://github.com/gradle/gradle/releases/download/v8.3/gradle-8.3-bin.zip"
    
    if ! unzip -t gradle-8.3-bin.zip > /dev/null 2>&1; then
        echo "ERROR: Failed to download valid gradle distribution"
        exit 1
    fi
fi

# Extract the jar
unzip -q gradle-8.3-bin.zip "gradle-8.3/lib/gradle-wrapper.jar"
mv gradle-8.3/lib/gradle-wrapper.jar .
rm -rf gradle-8.3 gradle-8.3-bin.zip

# Make sure gradlew is executable
cd ../..
chmod +x android/gradlew

echo ""
echo "✓ Gradle wrapper setup complete!"
echo "You can now run: npm run android"
