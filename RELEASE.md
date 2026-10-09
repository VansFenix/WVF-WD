# 🌸 WVF WD — Release v2.0.0 (Pink Noir Edition)

Официальный мультиплатформенный релиз клиента и сервера для протокола **QWDTT** (туннелирование через TURN-инфраструктуру медиазвонков VK).

---

## 📦 Содержимое релиза по операционным системам

### 1. 📱 Android (версия 2.0.0, API 28+)
* **Готовый интерфейс**: Jetpack Compose (Material 3) в фирменной черно-нежно-розовой теме **Pink Noir**.
* **Режимы подключения**:
  * Системный VPN туннель (`android.net.VpnService`)
  * Прямой Raw TUN сокет
  * Локальный SOCKS5
* **Виджеты и интеграции**:
  * Виджет быстрого переключения для рабочего стола
  * Плитка быстрого доступа (Quick Settings Tile) в системной шторке
  * Поддержка ассоциации файлов `.qwdtt` и `.conf`
* **Файлы релиза**:
  * `wvf-wd-universal-v2.0.0.apk` — универсальный APK для всех архитектур
  * `wvf-wd-arm64-v8a-v2.0.0.apk` — оптимизированная сборка под 64-битные телефоны

---

### 2. 🪟 Windows (Windows 10 / 11 x64)
* **Архив**: `WVF-WD-Desktop-Windows-v2.0.0.zip` (содержится в папке `dist/`)
* **Особенности**:
  * Не требует прав Администратора для базового туннелирования (режим userspace WireGuard `netstack`).
  * Графический интерфейс в браузере или нативном окне (`http://127.0.0.1:7474`) со светящейся кнопкой подключения, таймером и графиком скорости.
  * **Авто-настройка системного прокси Windows**: автоматическое переключение настроек Internet Settings для направления браузеров и программ через туннель.
  * Встроенная фирменная иконка `assets/icon.ico`.
* **Запуск**:
  Распакуйте архив и запустите `Запуск WVF WD.bat` (или `run-windows.bat`).

---

### 3. 🐧 Linux (x86_64 / ARM64)
* **Архив**: `WVF-WD-Desktop-Linux-v2.0.0.tar.gz` (содержится в папке `dist/`)
* **Особенности**:
  * Ярлык запуска для рабочего стола: `wvf-wd.desktop` (GNOME, KDE, XFCE).
  * Системный сервис systemd: `wvf-wd.service` для headless серверов или автозапуска.
  * Скрипт автоматического переключения системного прокси GNOME и переменных `ALL_PROXY`: `scripts/linux-proxy.sh`.
  * Бинарные файлы ядра под Linux AMD64 и Linux ARM64.
* **Запуск**:
  ```bash
  tar -xzf WVF-WD-Desktop-Linux-v2.0.0.tar.gz
  cd wvf-wd
  chmod +x run-linux.sh
  ./run-linux.sh
  ```

---

### 4. 🖥️ Серверная часть (VPS)
* Папка `server/` содержит сервер QWDTT на Go:
  * Поддержка нескольких клиентов и профилей.
  * Защита трафика через RTP HKDF + AEAD шифрование.
  * Встроенный Telegram-бот и веб-API для мониторинга статистики.
* Компиляция для сервера Linux:
  ```bash
  cd server
  GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -trimpath -o server .
  ```

---

## 🚀 Как опубликовать релиз на GitHub

1. Зафиксируйте все изменения в git:
   ```bash
   git add .
   git commit -m "feat: release v2.0.0 WVF WD Pink Noir edition"
   ```
2. Создайте и отправьте тег версии:
   ```bash
   git tag -a v2.0.0 -m "WVF WD Release 2.0.0"
   git push origin master --tags
   ```
3. GitHub Actions автоматически запустит воркфлоу [`.github/workflows/multiplatform-release.yml`](.github/workflows/multiplatform-release.yml), соберет все бинарники и APK, и опубликует официальный релиз в разделе **Releases** репозитория.
