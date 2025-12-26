@echo off
REM Seeker Mobile - Android Emulator Setup Script (Windows)

echo ================================================
echo Seeker Mobile - Android Emulator Setup
echo ================================================
echo.

REM Check if ANDROID_HOME is set
if "%ANDROID_HOME%"=="" (
    echo ERROR: ANDROID_HOME is not set
    echo.
    echo Set it with:
    echo   set ANDROID_HOME=C:\Users\YourUsername\AppData\Local\Android\Sdk
    echo.
    pause
    exit /b 1
)

echo Using ANDROID_HOME: %ANDROID_HOME%
echo.

REM Check if SDK tools exist
if not exist "%ANDROID_HOME%\cmdline-tools\latest\bin\sdkmanager.bat" (
    echo ERROR: Android SDK cmdline-tools not found
    echo Path: %ANDROID_HOME%\cmdline-tools\latest\bin\
    echo.
    echo Please install Android SDK from: https://developer.android.com/studio
    pause
    exit /b 1
)

set SDKMANAGER="%ANDROID_HOME%\cmdline-tools\latest\bin\sdkmanager.bat"
set AVDMANAGER="%ANDROID_HOME%\cmdline-tools\latest\bin\avdmanager.bat"

echo Using sdkmanager: %SDKMANAGER%
echo.

echo Installing Android SDK components...
echo This may take a few minutes...
echo.

%SDKMANAGER% "platforms;android-31" "build-tools;34.0.0" "system-images;android-31;default;arm64-v8a"

echo.
echo SDK components ready!
echo.

echo Checking for existing emulator 'seeker_emulator'...
echo.

%AVDMANAGER% list avd | find "seeker_emulator" >nul

if %errorlevel% equ 0 (
    echo Emulator 'seeker_emulator' already exists!
    echo.
) else (
    echo Creating emulator 'seeker_emulator'...
    echo.
    
    %AVDMANAGER% create avd ^
        -n seeker_emulator ^
        -k "system-images;android-31;default;arm64-v8a" ^
        -d pixel_4 ^
        --force
    
    echo.
    echo Emulator created successfully!
)

echo.
echo ================================================
echo Setup Complete!
echo ================================================
echo.
echo To start the emulator, run:
echo   %ANDROID_HOME%\emulator\emulator.exe -avd seeker_emulator
echo.
echo Then in another terminal, run:
echo   npm start -- --port 8082
echo.
echo And in a third terminal:
echo   npm run android
echo.
pause
