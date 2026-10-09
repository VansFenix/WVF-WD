@echo off
setlocal
cd /d "%~dp0\.."

echo ========================================================
echo   WVF WD - Генерация Release Keystore для Android
echo ========================================================
echo.

if exist "release.keystore" (
    echo [ИНФО] Файл release.keystore уже существует!
    pause
    exit /b 0
)

echo Генерация ключа release.keystore (RSA 2048, 10000 дней)...
keytool -genkey -v -keystore release.keystore -alias wvf-wd-key -keyalg RSA -keysize 2048 -validity 10000 -storepass wvfwd2026 -keypass wvfwd2026 -dname "CN=WVF WD, OU=Mobile, O=WVF, L=Moscow, C=RU"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ Keystore успешно создан: release.keystore
    echo   Пароль хранилища: wvfwd2026
    echo   Алиас ключа: wvf-wd-key
    echo   Пароль ключа: wvfwd2026
    echo.
    echo Запись local.properties...
    (
        echo KEYSTORE_FILE=release.keystore
        echo KEYSTORE_PASSWORD=wvfwd2026
        echo KEY_ALIAS=wvf-wd-key
        echo KEY_PASSWORD=wvfwd2026
    ) >> local.properties
    echo ✓ Настройки добавлены в local.properties!
) else (
    echo ✗ Ошибка генерации keystore. Убедитесь, что keytool доступен в PATH.
)

pause
