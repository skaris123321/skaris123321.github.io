@echo off
echo ========================================
echo   ROSEK Order Server - Запуск
echo ========================================
echo.

REM Проверяем установлен ли Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ОШИБКА] Node.js не установлен!
    echo.
    echo Скачайте и установите Node.js с https://nodejs.org/
    echo Рекомендуемая версия: 18 LTS или выше
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js установлен
node --version
echo.

REM Проверяем установлены ли зависимости
if not exist "node_modules\" (
    echo [INFO] Устанавливаем зависимости...
    echo.
    call npm install
    echo.
)

REM Проверяем настроен ли .env файл
findstr /C:"your-app-password-here" .env >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [ВНИМАНИЕ] Файл .env не настроен!
    echo.
    echo Откройте файл server/.env и укажите:
    echo   EMAIL_PASS=ваш-пароль-приложения-gmail
    echo.
    echo Инструкция по получению пароля приложения:
    echo   1. Откройте https://myaccount.google.com/security
    echo   2. Включите двухфакторную аутентификацию
    echo   3. Создайте "Пароль приложения"
    echo   4. Вставьте его в .env файл
    echo.
    pause
    exit /b 1
)

echo [OK] Конфигурация настроена
echo.
echo ========================================
echo   Запускаем сервер...
echo ========================================
echo.

REM Запускаем сервер
node server.js

pause
