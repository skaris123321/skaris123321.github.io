@echo off
echo ========================================
echo   ЗАПУСК СЕРВЕРА И NGROK
echo ========================================
echo.

REM Запуск сервера в новом окне
start "ROSEK Server" cmd /k "cd /d C:\Users\nogovitsina.ea\Desktop\сайт\rosek-site\server && npm start"

echo Сервер запускается...
timeout /t 5 /nobreak > nul

REM Запуск ngrok в новом окне
start "NGROK" cmd /k "cd /d C:\Users\nogovitsina.ea\Desktop\сайт\rosek-site && ngrok.exe http 3000"

echo.
echo ========================================
echo   ГОТОВО!
echo ========================================
echo.
echo Сервер: http://localhost:3000
echo Ngrok URL: Смотрите в окне NGROK
echo.
echo Дайте программисту 1С URL из ngrok!
echo.
pause
