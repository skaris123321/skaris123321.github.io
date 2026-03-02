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
if exist ".env" (
    findstr /C:"your-app-password-here" .env >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo [ВНИМАНИЕ] Email не настроен, но сервер запустится!
        echo.
        echo Для отправки заказов на почту настройте .env файл:
        echo   EMAIL_PASS=ваш-пароль-приложения-gmail
        echo.
        echo Обновление цен работает без email!
        echo.
    )
) else (
    echo [ВНИМАНИЕ] Файл .env не найден, создаем...
    echo PORT=3000 > .env
    echo EMAIL_USER=enogovicina167@gmail.com >> .env
    echo EMAIL_PASS=your-app-password-here >> .env
    echo ORDER_EMAIL=enogovicina167@gmail.com >> .env
    echo.
    echo [OK] Файл .env создан
    echo.
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
