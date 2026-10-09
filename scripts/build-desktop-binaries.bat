@echo off
setlocal
cd /d "%~dp0\.."

echo ========================================================
echo   WVF WD - Сборка исполняемых файлов для Windows и Linux
echo ========================================================
echo.

where go >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ОШИБКА] Go не найден в PATH. Установите Go с https://go.dev
    pause
    exit /b 1
)

echo [1/3] Сборка Windows x64 (wvf-wd.exe)...
set GOOS=windows
set GOARCH=amd64
go build -trimpath -ldflags="-s -w" -o wvf-wd.exe ./go_client
if %ERRORLEVEL% EQU 0 (
    echo   ✓ wvf-wd.exe успешно собран!
    copy /y wvf-wd.exe desktop\wvf-wd.exe >nul
) else (
    echo   ✗ Ошибка сборки для Windows!
)

echo [2/3] Сборка Linux x64 (wvf-wd)...
set GOOS=linux
set GOARCH=amd64
go build -trimpath -ldflags="-s -w" -o wvf-wd ./go_client
if %ERRORLEVEL% EQU 0 (
    echo   ✓ wvf-wd (Linux x64) успешно собран!
    copy /y wvf-wd desktop\wvf-wd >nul
) else (
    echo   ✗ Ошибка сборки для Linux!
)

echo [3/3] Сборка Linux ARM64 (wvf-wd-arm64)...
set GOOS=linux
set GOARCH=arm64
go build -trimpath -ldflags="-s -w" -o wvf-wd-arm64 ./go_client
if %ERRORLEVEL% EQU 0 (
    echo   ✓ wvf-wd-arm64 (Linux ARM64) успешно собран!
) else (
    echo   ✗ Ошибка сборки для Linux ARM64!
)

echo.
echo ========================================================
echo   Сборка завершена!
echo ========================================================
pause
