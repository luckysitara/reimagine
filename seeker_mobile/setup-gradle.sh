#!/bin/bash

# Solana Seeker Mobile - Gradle Setup Script
# This script initializes the Gradle wrapper for Android builds

set -e

echo "======================================"
echo "Solana Seeker Mobile - Gradle Setup"
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if gradle/wrapper directory exists
if [ ! -d "android/gradle/wrapper" ]; then
  echo -e "${YELLOW}Creating gradle/wrapper directory...${NC}"
  mkdir -p android/gradle/wrapper
fi

# Download gradle wrapper jar if it doesn't exist
if [ ! -f "android/gradle/wrapper/gradle-wrapper.jar" ]; then
  echo -e "${YELLOW}Downloading Gradle wrapper jar...${NC}"
  cd android/gradle/wrapper
  
  # Download gradle-wrapper.jar
  curl -L -o gradle-wrapper.jar https://services.gradle.org/distributions/gradle-8.3-all.zip.sha256
  
  # Extract just the jar from the distribution
  wget -q https://services.gradle.org/distributions/gradle-8.3-all.zip -O /tmp/gradle.zip
  unzip -q -j /tmp/gradle.zip "gradle-8.3/lib/gradle-core-*.jar" -d .
  mv gradle-core-*.jar gradle-wrapper.jar 2>/dev/null || {
    # Alternative method: download pre-packaged wrapper jar
    curl -L -o gradle-wrapper.jar https://raw.githubusercontent.com/gradle/gradle/master/gradle/wrapper/gradle-wrapper.jar
  }
  rm -f /tmp/gradle.zip
  
  cd ../../..
fi

# Make gradlew executable
echo -e "${YELLOW}Setting executable permissions...${NC}"
chmod +x android/gradlew

# Verify setup
if [ -f "android/gradle/wrapper/gradle-wrapper.jar" ] && [ -x "android/gradlew" ]; then
  echo -e "${GREEN}✓ Gradle wrapper setup complete!${NC}"
  echo -e "${GREEN}You can now run: npm run android${NC}"
else
  echo -e "${RED}✗ Gradle wrapper setup failed${NC}"
  echo "Please ensure you have curl/wget installed and try again"
  exit 1
fi
