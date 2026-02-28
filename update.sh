#!/bin/bash
# e-Kutuphane / e-Library - Update Script
# Linux/Mac icin guncelleme betigini calistirin: ./update.sh

set -e

echo ""
echo "======================================"
echo "  e-Kutuphane - Guncelleme / Update"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "[HATA/ERROR] docker-compose.yml bulunamadi!"
    echo "Bu scripti library-tracker klasorunun icinden calistirin."
    echo ""
    echo "Run this script from inside the library-tracker folder."
    exit 1
fi

# Check if git is available
if ! command -v git &> /dev/null; then
    echo "[HATA/ERROR] Git bulunamadi! Lutfen Git yukleyin."
    echo "Git not found! Please install Git."
    exit 1
fi

# Check if docker is available
if ! command -v docker &> /dev/null; then
    echo "[HATA/ERROR] Docker bulunamadi! Lutfen Docker yukleyin."
    echo "Docker not found! Please install Docker."
    exit 1
fi

# Show current version
if [ -f "VERSION" ]; then
    CURRENT=$(cat VERSION | tr -d '[:space:]')
    echo "Mevcut surum / Current version: v${CURRENT}"
fi

# Pull latest changes
echo ""
echo "[1/3] Son degisiklikler indiriliyor / Pulling latest changes..."
git pull origin master

# Show new version
if [ -f "VERSION" ]; then
    NEW=$(cat VERSION | tr -d '[:space:]')
    echo "Yeni surum / New version: v${NEW}"
fi

# Rebuild and restart
echo ""
echo "[2/3] Docker yeniden olusturuluyor / Rebuilding Docker..."
docker-compose up -d --build

# Done
echo ""
echo "[3/3] Tamamlandi! / Done!"
echo ""
echo "======================================"
echo "  Guncelleme basarili! / Update OK!"
echo "  http://localhost:3000"
echo "======================================"
echo ""
