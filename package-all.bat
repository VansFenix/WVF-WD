@echo off
setlocal
cd /d "%~dp0"
echo ========================================================
echo   WVF WD - Создание пакетов для релиза (Windows & Linux)
echo ========================================================
echo.
python scripts\package_release.py
echo.
pause
