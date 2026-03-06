@echo off
chcp 65001 >nul
echo ========================================
echo   ROSEK Order Server - Zapusk
echo ========================================
echo.

REM Proveryaem ustanovlen li Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [OSHIBKA] Node.js ne ustanovlen!
    echo.
    echo Skachayte i ustanovite Node.js s https://nodejs.org/
    echo Rekomenduemaya versiya: 18 LTS ili vyshe
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js ustanovlen
node --version
echo.

REM Proveryaem ustanovleny li zavisimosti
if not exist "node_modules\" (
    echo [INFO] Ustanavlivaem zavisimosti...
    echo.
    call npm install
    echo.
)

REM Proveryaem nastroen li .env fayl
if exist ".env" (
    findstr /C:"your-app-password-here" .env >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo [VNIMANIE] Email ne nastroen, no server zapustitsya!
        echo.
        echo Dlya otpravki zakazov na pochtu nastroyte .env fayl:
        echo   EMAIL_PASS=vash-parol-prilozheniya-gmail
        echo.
        echo Obnovlenie tsen rabotaet bez email!
        echo.
    )
) else (
    echo [VNIMANIE] Fayl .env ne nayden, sozdaem...
    echo PORT=3000 > .env
    echo EMAIL_USER=enogovicina167@gmail.com >> .env
    echo EMAIL_PASS=your-app-password-here >> .env
    echo ORDER_EMAIL=enogovicina167@gmail.com >> .env
    echo.
    echo [OK] Fayl .env sozdan
    echo.
)

echo [OK] Konfiguratsiya nastroena
echo.
echo ========================================
echo   Zapuskaem server...
echo ========================================
echo.

REM Zapuskaem server
node server.js

pause
