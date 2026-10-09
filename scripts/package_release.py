#!/usr/bin/env python3
"""
WVF WD - Release Packaging Tool
Creates ready-to-distribute ZIP and TAR.GZ archives for Windows and Linux desktop.
"""

import os
import sys
import shutil
import zipfile
import tarfile

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

VERSION = "2.0.0"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST_DIR = os.path.join(ROOT, "dist")

def make_windows_package():
    os.makedirs(DIST_DIR, exist_ok=True)
    zip_path = os.path.join(DIST_DIR, f"WVF-WD-Desktop-Windows-v{VERSION}.zip")
    
    print(f"[1/2] Создание пакета для Windows: {zip_path}...")
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
        # Batch launcher
        bat_file = os.path.join(ROOT, "run-windows.bat")
        if os.path.exists(bat_file):
            z.write(bat_file, "WVF-WD/Запуск WVF WD.bat")
            
        # Assets & Icons
        ico_file = os.path.join(ROOT, "assets", "icon.ico")
        if os.path.exists(ico_file):
            z.write(ico_file, "WVF-WD/assets/icon.ico")
            
        logo_file = os.path.join(ROOT, "assets", "logo.png")
        if os.path.exists(logo_file):
            z.write(logo_file, "WVF-WD/assets/logo.png")

        # Compiled Windows Engine Binary
        win_exe = os.path.join(ROOT, "wvf-wd.exe")
        if os.path.exists(win_exe):
            z.write(win_exe, "WVF-WD/wvf-wd.exe")

        # Desktop directory (excluding node_modules)
        desktop_dir = os.path.join(ROOT, "desktop")
        for root, dirs, files in os.walk(desktop_dir):
            if 'node_modules' in dirs:
                dirs.remove('node_modules')
            for f in files:
                full_path = os.path.join(root, f)
                rel_path = os.path.relpath(full_path, ROOT)
                z.write(full_path, f"WVF-WD/{rel_path}")

        # Scripts
        ps_proxy = os.path.join(ROOT, "scripts", "windows-proxy.ps1")
        if os.path.exists(ps_proxy):
            z.write(ps_proxy, "WVF-WD/scripts/windows-proxy.ps1")

        # Instructions
        readme_content = f"""✦ WVF WD Desktop Client (v{VERSION}) — Windows x64 ✦

Быстрый старт:
1. Запустите файл "Запуск WVF WD.bat"
2. Откроется окно браузера по адресу http://127.0.0.1:7474
3. Введите IP и порт вашего VPS сервера, пароль и VK хеш звонка
4. Нажмите большую кнопку «ПОДКЛЮЧИТЬ»
5. Трафик автоматически направляется через локальный SOCKS5 (127.0.0.1:1080)
   или через системный прокси Windows (включается переключателем в настройках).

Поддержка протокола QWDTT (WebRTC RTP AEAD).
"""
        z.writestr("WVF-WD/README.txt", readme_content)

    print(f"  ✓ Windows пакет создан: {os.path.getsize(zip_path):,} байт")

def make_linux_package():
    os.makedirs(DIST_DIR, exist_ok=True)
    tar_path = os.path.join(DIST_DIR, f"WVF-WD-Desktop-Linux-v{VERSION}.tar.gz")
    
    with tarfile.open(tar_path, "w:gz") as t:
        # Installer Setup Script
        setup_sh = os.path.join(ROOT, "setup-linux.sh")
        if os.path.exists(setup_sh):
            t.add(setup_sh, arcname="wvf-wd/setup-linux.sh")

        # Launcher
        sh_file = os.path.join(ROOT, "run-linux.sh")
        if os.path.exists(sh_file):
            t.add(sh_file, arcname="wvf-wd/run-linux.sh")

        desktop_entry = os.path.join(ROOT, "desktop", "wvf-wd.desktop")
        if os.path.exists(desktop_entry):
            t.add(desktop_entry, arcname="wvf-wd/wvf-wd.desktop")

        service_file = os.path.join(ROOT, "desktop", "wvf-wd.service")
        if os.path.exists(service_file):
            t.add(service_file, arcname="wvf-wd/wvf-wd.service")

        # Compiled Linux Binaries
        linux_bin = os.path.join(ROOT, "wvf-wd")
        if os.path.exists(linux_bin):
            t.add(linux_bin, arcname="wvf-wd/wvf-wd")

        linux_arm = os.path.join(ROOT, "wvf-wd-arm64")
        if os.path.exists(linux_arm):
            t.add(linux_arm, arcname="wvf-wd/wvf-wd-arm64")

        # Desktop folder (excluding node_modules)
        desktop_dir = os.path.join(ROOT, "desktop")
        for root, dirs, files in os.walk(desktop_dir):
            if 'node_modules' in dirs:
                dirs.remove('node_modules')
            for f in files:
                full_path = os.path.join(root, f)
                rel_path = os.path.relpath(full_path, ROOT)
                t.add(full_path, arcname=f"wvf-wd/{rel_path}")

        # Assets
        assets_dir = os.path.join(ROOT, "assets")
        t.add(assets_dir, arcname="wvf-wd/assets")

        proxy_sh = os.path.join(ROOT, "scripts", "linux-proxy.sh")
        if os.path.exists(proxy_sh):
            t.add(proxy_sh, arcname="wvf-wd/scripts/linux-proxy.sh")

    dist_setup = os.path.join(DIST_DIR, "setup-linux.sh")
    if os.path.exists(setup_sh):
        shutil.copy2(setup_sh, dist_setup)

    print(f"  ✓ Linux пакет создан: {os.path.getsize(tar_path):,} байт")

if __name__ == "__main__":
    print("=" * 60)
    print(f"  WVF WD — Сборка дистрибутивов для выпуска (v{VERSION})")
    print("=" * 60)
    make_windows_package()
    make_linux_package()
    print("\n✓ Все пакеты успешно собраны в папку dist/")
