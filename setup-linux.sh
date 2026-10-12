#!/usr/bin/env bash
# ==============================================================================
#  WVF WD - Linux Installer & Setup Script
#  Multiplatform Client for QWDTT Protocol
# ==============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
PINK='\033[1;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${PINK}=====================================================${NC}"
echo -e "${PINK}    ✦ WVF WD — Установщик для Linux (v2.1.0) ✦${NC}"
echo -e "${PINK}    Клиент протокола QWDTT (TURN VK) в стиле Pink Noir${NC}"
echo -e "${PINK}=====================================================${NC}"
echo ""

# Detect architecture
ARCH=$(uname -m)
case "$ARCH" in
    x86_64|amd64)
        BIN_NAME="wvf-wd"
        ;;
    aarch64|arm64)
        BIN_NAME="wvf-wd-arm64"
        ;;
    *)
        echo -e "${RED}[!] Неподдерживаемая архитектура: $ARCH${NC}"
        echo "Поддерживаются x86_64 и arm64 (aarch64)."
        exit 1
        ;;
esac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if running as root or user
if [ "$EUID" -eq 0 ]; then
    INSTALL_DIR="/opt/wvf-wd"
    BIN_DIR="/usr/local/bin"
    APP_DIR="/usr/share/applications"
    ICON_DIR="/usr/share/icons/hicolor"
else
    INSTALL_DIR="$HOME/.local/share/wvf-wd"
    BIN_DIR="$HOME/.local/bin"
    APP_DIR="$HOME/.local/share/applications"
    ICON_DIR="$HOME/.local/share/icons/hicolor"
    mkdir -p "$BIN_DIR" "$APP_DIR"
fi

echo -e "${CYAN}[*] Каталог установки: ${INSTALL_DIR}${NC}"
echo -e "${CYAN}[*] Архитектура: ${ARCH} (Бинарник: ${BIN_NAME})${NC}"

# Create installation directory
mkdir -p "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR/assets"
mkdir -p "$INSTALL_DIR/desktop"

# Copy files
echo -e "${CYAN}[*] Копирование компонентов WVF WD...${NC}"
cp -r "$SCRIPT_DIR/desktop"/* "$INSTALL_DIR/desktop/" 2>/dev/null || true
cp -r "$SCRIPT_DIR/assets"/* "$INSTALL_DIR/assets/" 2>/dev/null || true
cp "$SCRIPT_DIR/run-linux.sh" "$INSTALL_DIR/" 2>/dev/null || true

# Copy selected binary as executable
if [ -f "$SCRIPT_DIR/$BIN_NAME" ]; then
    cp "$SCRIPT_DIR/$BIN_NAME" "$INSTALL_DIR/wvf-wd"
    chmod +x "$INSTALL_DIR/wvf-wd"
elif [ -f "$SCRIPT_DIR/wvf-wd" ]; then
    cp "$SCRIPT_DIR/wvf-wd" "$INSTALL_DIR/wvf-wd"
    chmod +x "$INSTALL_DIR/wvf-wd"
fi

# Create launcher script in BIN_DIR
echo -e "${CYAN}[*] Создание команды запуска: ${BIN_DIR}/wvf-wd...${NC}"
cat << 'EOF' > "$BIN_DIR/wvf-wd"
#!/usr/bin/env bash
WVF_DIR="INSTALL_DIR_PLACEHOLDER"
cd "$WVF_DIR"
if command -v node >/dev/null 2>&1; then
    echo "Запуск графического веб-интерфейса WVF WD..."
    node desktop/server.js "$@"
else
    echo "Node.js не найден. Запуск консольного демона WVF WD..."
    ./wvf-wd "$@"
fi
EOF
sed -i "s|INSTALL_DIR_PLACEHOLDER|$INSTALL_DIR|g" "$BIN_DIR/wvf-wd"
chmod +x "$BIN_DIR/wvf-wd"

# Install Desktop Entry and Icons
echo -e "${CYAN}[*] Регистрация ярлыка в системном меню приложений...${NC}"
for SIZE in 16 24 32 48 64 128 256 512; do
    if [ -f "$SCRIPT_DIR/assets/icons/hicolor/${SIZE}x${SIZE}/apps/wvf-wd.png" ]; then
        mkdir -p "$ICON_DIR/${SIZE}x${SIZE}/apps"
        cp "$SCRIPT_DIR/assets/icons/hicolor/${SIZE}x${SIZE}/apps/wvf-wd.png" "$ICON_DIR/${SIZE}x${SIZE}/apps/wvf-wd.png"
    fi
done
if [ -f "$SCRIPT_DIR/assets/logo.png" ]; then
    mkdir -p "$ICON_DIR/512x512/apps"
    cp "$SCRIPT_DIR/assets/logo.png" "$ICON_DIR/512x512/apps/wvf-wd.png"
fi

cat << EOF > "$APP_DIR/wvf-wd.desktop"
[Desktop Entry]
Version=1.0
Type=Application
Name=WVF WD
GenericName=QWDTT VPN Client
Comment=Мультиплатформенный клиент протокола QWDTT (TURN VK) в стиле Pink Noir
Exec=$BIN_DIR/wvf-wd
Icon=wvf-wd
Terminal=false
Categories=Network;Security;VPN;
Keywords=VPN;Proxy;SOCKS5;VK;TURN;WireGuard;QWDTT;WVF;
StartupWMClass=wvf-wd
EOF
chmod +x "$APP_DIR/wvf-wd.desktop"

# Update icon and desktop databases if tools are present
if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "$APP_DIR" 2>/dev/null || true
fi
if command -v gtk-update-icon-cache >/dev/null 2>&1; then
    gtk-update-icon-cache -f -t "$ICON_DIR" 2>/dev/null || true
fi

# Create Uninstaller
cat << EOF > "$INSTALL_DIR/uninstall.sh"
#!/usr/bin/env bash
echo "Удаление WVF WD..."
rm -rf "$INSTALL_DIR"
rm -f "$BIN_DIR/wvf-wd"
rm -f "$APP_DIR/wvf-wd.desktop"
echo "WVF WD успешно удален."
EOF
chmod +x "$INSTALL_DIR/uninstall.sh"

echo ""
echo -e "${GREEN}=====================================================${NC}"
echo -e "${GREEN}    ✓ WVF WD успешно установлен в систему!${NC}"
echo -e "${GREEN}=====================================================${NC}"
echo -e "✦ Запуск из любого терминала: ${PINK}wvf-wd${NC}"
echo -e "✦ Запуск из меню приложений: ${PINK}WVF WD (Иконка с розовым щитом)${NC}"
echo -e "✦ Удаление: ${CYAN}$INSTALL_DIR/uninstall.sh${NC}"
echo ""
