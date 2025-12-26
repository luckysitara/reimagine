@echo off
setlocal enabledelayedexpansion

echo ================================================
echo Seeker Mobile - Android SDK Setup
echo ================================================
echo.

if not defined ANDROID_HOME (
  set "ANDROID_HOME=%USERPROFILE%\AppData\Local\Android\Sdk"
)

echo Using ANDROID_HOME: %ANDROID_HOME%
echo.

if not exist "%ANDROID_HOME%" (
  echo ERROR: ANDROID_HOME directory not found at: %ANDROID_HOME%
  echo.
  echo Please install Android SDK from: https://developer.android.com/studio
  pause
  exit /b 1
)

REM Find sdkmanager in multiple possible locations
set "SDKMANAGER="
if exist "%ANDROID_HOME%\cmdline-tools\latest\bin\sdkmanager.bat" (
  set "SDKMANAGER=%ANDROID_HOME%\cmdline-tools\latest\bin\sdkmanager.bat"
) else if exist "%ANDROID_HOME%\tools\bin\sdkmanager.bat" (
  set "SDKMANAGER=%ANDROID_HOME%\tools\bin\sdkmanager.bat"
) else (
  echo ERROR: sdkmanager not found
  echo Please download cmdline-tools from: https://developer.android.com/studio/command-line
  pause
  exit /b 1
)

echo Using sdkmanager: %SDKMANAGER%
echo.

echo Accepting Android SDK licenses...
%SDKMANAGER% --licenses < nul > nul 2>&1

echo Installing required SDK packages...
echo This may take several minutes...
echo.

%SDKMANAGER% ^
  "platforms;android-31" ^
  "build-tools;34.0.0" ^
  "system-images;android-31;default;arm64-v8a" ^
  "emulator"

echo.
echo ================================================
echo SUCCESS: Android SDK is ready!
echo ================================================
echo.
echo Next step: Create an Android Virtual Device
echo Run: setup-android-emulator.bat
echo.
pause
