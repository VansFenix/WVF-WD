#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "========================================================"
echo "  WVF WD - Генерация Release Keystore для Android"
echo "========================================================"
echo ""

if [ -f "release.keystore" ]; then
    echo "[ИНФО] Файл release.keystore уже существует!"
    exit 0
fi

echo "Генерация ключа release.keystore..."
keytool -genkey -v -keystore release.keystore -alias wvf-wd-key -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass wvfwd2026 -keypass wvfwd2026 \
    -dname "CN=WVF WD, OU=Mobile, O=WVF, L=Moscow, C=RU"

echo ""
echo "✓ Keystore создан: release.keystore"
cat << 'EOF' >> local.properties
KEYSTORE_FILE=release.keystore
KEYSTORE_PASSWORD=wvfwd2026
KEY_ALIAS=wvf-wd-key
KEY_PASSWORD=wvfwd2026
EOF
echo "✓ Настройки подписи записаны в local.properties"
