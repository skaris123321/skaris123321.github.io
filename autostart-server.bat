@echo off
REM ========================================
REM   АВТОЗАПУСК СЕРВЕРА ПРИ ВКЛЮЧЕНИИ
REM ========================================

cd /d C:\Users\nogovitsina.ea\Desktop\сайт\rosek-site\server

REM Проверка что сервер не запущен
tasklist /FI "WINDOWTITLE eq ROSEK Server*" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo Сервер уже запущен
    exit
)

REM Запуск сервера
start "ROSEK Server" /MIN cmd /k "npm start"

echo Сервер запущен в фоне
