#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "========================================================"
echo "  WVF WD - Сборка исполняемых файлов для Windows и Linux"
echo "========================================================"
echo ""

if ! command -v go &>/dev/null; then
    echo "[ОШИБКА] Go не найден в PATH. Установите Go с https://go.dev"
    exit 1
fi

echo "[1/3] Сборка Linux x64 (wvf-wd)..."
GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o wvf-wd ./go_client
cp -f wvf-wd desktop/wvf-wd 2>/dev/null || true
echo "  ✓ wvf-wd собран!"

echo "[2/3] Сборка Windows x64 (wvf-wd.exe)..."
GOOS=windows GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o wvf-wd.exe ./go_client
cp -f wvf-wd.exe desktop/wvf-wd.exe 2>/dev/null || true
echo "  ✓ wvf-wd.exe собран!"

echo "[3/3] Сборка Linux ARM64 (wvf-wd-arm64)..."
GOOS=linux GOARCH=arm64 go build -trimpath -ldflags="-s -w" -o wvf-wd-arm64 ./go_client
echo "  ✓ wvf-wd-arm64 собран!"

echo ""
echo "========================================================"
echo "  Готово!"
echo "========================================================"
