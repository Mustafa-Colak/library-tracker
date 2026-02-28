@echo off
chcp 65001 >nul 2>&1
REM e-Kutuphane / e-Library - Update Script
REM Windows icin guncelleme: update.bat dosyasina cift tiklayin

echo.
echo ======================================
echo   e-Kutuphane - Guncelleme / Update
echo ======================================
echo.

REM Check if we're in the right directory
if not exist "docker-compose.yml" (
    echo [HATA/ERROR] docker-compose.yml bulunamadi!
    echo Bu scripti library-tracker klasorunun icinden calistirin.
    echo Run this script from inside the library-tracker folder.
    echo.
    pause
    exit /b 1
)

REM Check if git is available
where git >nul 2>&1
if errorlevel 1 (
    echo [HATA/ERROR] Git bulunamadi! Lutfen Git yukleyin.
    echo Git not found! Please install Git.
    echo.
    pause
    exit /b 1
)

REM Check if docker is available
where docker >nul 2>&1
if errorlevel 1 (
    echo [HATA/ERROR] Docker bulunamadi! Lutfen Docker yukleyin.
    echo Docker not found! Please install Docker.
    echo.
    pause
    exit /b 1
)

REM Show current version
if exist "VERSION" (
    set /p CURRENT=<VERSION
    echo Mevcut surum / Current version: v%CURRENT%
)

REM Pull latest changes
echo.
echo [1/3] Son degisiklikler indiriliyor / Pulling latest changes...
git pull origin master
if errorlevel 1 (
    echo [HATA/ERROR] Git pull basarisiz! / Git pull failed!
    echo.
    pause
    exit /b 1
)

REM Show new version
if exist "VERSION" (
    set /p NEW=<VERSION
    echo Yeni surum / New version: v%NEW%
)

REM Rebuild and restart
echo.
echo [2/3] Docker yeniden olusturuluyor / Rebuilding Docker...
docker-compose up -d --build
if errorlevel 1 (
    echo [HATA/ERROR] Docker build basarisiz! / Docker build failed!
    echo.
    pause
    exit /b 1
)

REM Done
echo.
echo [3/3] Tamamlandi! / Done!
echo.
echo ======================================
echo   Guncelleme basarili! / Update OK!
echo   http://localhost:3000
echo ======================================
echo.
pause
