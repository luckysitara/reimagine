@echo off
REM Solana Seeker Mobile - Gradle Setup Script (Windows)
REM This script initializes the Gradle wrapper for Android builds

setlocal enabledelayedexpansion

echo ======================================
echo Solana Seeker Mobile - Gradle Setup
echo ======================================

REM Create gradle/wrapper directory if it doesn't exist
if not exist "android\gradle\wrapper" (
  echo Creating gradle/wrapper directory...
  mkdir android\gradle\wrapper
)

REM Check if gradle-wrapper.jar exists
if not exist "android\gradle\wrapper\gradle-wrapper.jar" (
  echo Downloading Gradle wrapper jar...
  
  REM Download using PowerShell
  powershell -Command "^
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; ^
    Invoke-WebRequest -Uri 'https://services.gradle.org/distributions/gradle-8.3-all.zip' -OutFile '$env:TEMP\gradle.zip'; ^
    Expand-Archive -Path '$env:TEMP\gradle.zip' -DestinationPath '$env:TEMP\gradle-extract'; ^
    Copy-Item '$env:TEMP\gradle-extract\gradle-8.3\lib\gradle-core-*.jar' -Destination 'android\gradle\wrapper\gradle-wrapper.jar' -Force; ^
    Remove-Item -Path '$env:TEMP\gradle*' -Recurse -Force"
  
  if !ERRORLEVEL! neq 0 (
    echo Download failed. Trying alternative method...
    powershell -Command "^
      [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; ^
      Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/gradle/gradle/master/gradle/wrapper/gradle-wrapper.jar' -OutFile 'android\gradle\wrapper\gradle-wrapper.jar'"
  )
)

REM Verify setup
if exist "android\gradle\wrapper\gradle-wrapper.jar" (
  echo.
  echo Gradle wrapper setup complete!
  echo You can now run: npm run android
  exit /b 0
) else (
  echo.
  echo Gradle wrapper setup failed
  echo Please ensure you have PowerShell and internet connection
  exit /b 1
)
