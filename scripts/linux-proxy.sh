#!/usr/bin/env bash
# WVF WD - Linux System Proxy Manager (GNOME / Environment)

ACTION="${1:-status}"
SOCKS_ADDR="${2:-127.0.0.1:1080}"
HOST="$(echo "$SOCKS_ADDR" | cut -d: -f1)"
PORT="$(echo "$SOCKS_ADDR" | cut -d: -f2)"

case "$ACTION" in
    enable)
        if command -v gsettings &>/dev/null; then
            gsettings set org.gnome.system.proxy mode 'manual'
            gsettings set org.gnome.system.proxy.socks host "$HOST"
            gsettings set org.gnome.system.proxy.socks port "$PORT"
            echo "✓ GNOME системный прокси включен: $SOCKS_ADDR"
        fi
        export all_proxy="socks5://$SOCKS_ADDR"
        export ALL_PROXY="socks5://$SOCKS_ADDR"
        echo "✓ Переменные окружения ALL_PROXY установлены: socks5://$SOCKS_ADDR"
        ;;
    disable)
        if command -v gsettings &>/dev/null; then
            gsettings set org.gnome.system.proxy mode 'none'
            echo "✓ GNOME системный прокси выключен"
        fi
        unset all_proxy ALL_PROXY
        echo "✓ Переменные окружения ALL_PROXY очищены"
        ;;
    status)
        if command -v gsettings &>/dev/null; then
            MODE="$(gsettings get org.gnome.system.proxy mode)"
            echo "GNOME Proxy Mode: $MODE"
        else
            echo "ALL_PROXY: ${ALL_PROXY:-not set}"
        fi
        ;;
    *)
        echo "Использование: $0 {enable|disable|status} [host:port]"
        exit 1
        ;;
esac
