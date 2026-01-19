@echo off
chcp 65001 >nul
echo ⚡ Быстрое обновление сайта...
echo.

git add .
git commit -m "Быстрое обновление"

if %errorlevel% neq 0 (
    echo ❌ Нет изменений для отправки
    timeout /t 3
    exit /b
)

git push origin master

if %errorlevel% equ 0 (
    echo.
    echo ✅ Готово! Сайт обновлен
    echo 🌐 https://skaris123321.github.io
    echo.
    echo Изменения появятся через 1-2 минуты
) else (
    echo ❌ Ошибка при отправке!
)

timeout /t 5