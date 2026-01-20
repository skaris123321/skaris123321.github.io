@echo off
chcp 65001 >nul
echo 🔧 Исправляем настройки Git...
echo.

echo 📍 Текущие удаленные репозитории:
git remote -v

echo.
echo 🗑️ Удаляем неправильный origin...
git remote remove origin

echo.
echo ➕ Добавляем правильный origin...
git remote add origin https://github.com/skaris123321/skaris123321.github.io.git

echo.
echo ✅ Новые настройки:
git remote -v

echo.
echo 🚀 Отправляем изменения...
git push -u origin master

if %errorlevel% equ 0 (
    echo.
    echo ✅ Готово! Репозиторий исправлен
    echo 🌐 https://skaris123321.github.io
) else (
    echo ❌ Ошибка при отправке
)

pause