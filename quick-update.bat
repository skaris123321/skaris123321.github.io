@echo off
chcp 65001 >nul
echo ⚡ Быстрое обновление сайта...
echo.

echo 📁 Добавляем файлы...
git add .

echo 💾 Создаем коммит...
git commit -m "Быстрое обновление %date% %time%"

if %errorlevel% neq 0 (
    echo ❌ Нет изменений для отправки
    timeout /t 3
    exit /b
)

echo 🚀 Отправляем на GitHub...
git push origin main

if %errorlevel% neq 0 (
    echo 🔄 Пробуем отправить на master...
    git push origin master
)

if %errorlevel% equ 0 (
    echo.
    echo ✅ Готово! Сайт обновлен
    echo 🌐 https://skaris123321.github.io
    echo.
    echo Изменения появятся через 1-2 минуты
) else (
    echo ❌ Ошибка при отправке!
    echo 💡 Проверьте подключение к интернету и настройки Git
)

timeout /t 5