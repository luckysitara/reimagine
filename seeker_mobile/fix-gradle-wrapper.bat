@echo off
REM Solana Seeker Mobile - Gradle Wrapper Fix Script (Windows)

setlocal enabledelayedexpansion

echo =========================================
echo Gradle Wrapper Fix Script
echo =========================================

set GRADLE_WRAPPER_DIR=android\gradle\wrapper
set GRADLE_WRAPPER_JAR=%GRADLE_WRAPPER_DIR%\gradle-wrapper.jar

if exist "%GRADLE_WRAPPER_JAR%" (
    echo Gradle wrapper jar already exists
    exit /b 0
)

echo Creating gradle wrapper directory...
if not exist "%GRADLE_WRAPPER_DIR%" mkdir "%GRADLE_WRAPPER_DIR%"

echo Downloading gradle-wrapper.jar...
cd "%GRADLE_WRAPPER_DIR%"

REM Add fallback download URL and validation
powershell -Command "try { Invoke-WebRequest -Uri 'https://repo.gradle.org/gradle/gradle-8.3-bin.zip' -OutFile 'gradle-8.3-bin.zip' -TimeoutSec 120 } catch { Invoke-WebRequest -Uri 'https://github.com/gradle/gradle/releases/download/v8.3/gradle-8.3-bin.zip' -OutFile 'gradle-8.3-bin.zip' -TimeoutSec 120 }"

REM Validate zip file before extracting
powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; try { [System.IO.Compression.ZipFile]::OpenRead('gradle-8.3-bin.zip').Dispose() } catch { echo 'ERROR: Corrupted zip file'; exit 1 }"

echo Extracting gradle wrapper...
powershell -Command "Expand-Archive -Path 'gradle-8.3-bin.zip' -DestinationPath '.' -Force"

if exist "gradle-8.3\lib\gradle-wrapper.jar" (
    move /Y "gradle-8.3\lib\gradle-wrapper.jar" "gradle-wrapper.jar"
    rmdir /S /Q gradle-8.3
    del gradle-8.3-bin.zip
)

cd ..\..\..

echo Gradle wrapper setup complete!
echo You can now run: npm run android
