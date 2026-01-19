@echo off
chcp 65001 >nul
echo ========================================
echo    СТАТУС ПРОЕКТА
echo ========================================
echo.

echo 📁 Текущая папка:
cd

echo.
echo 🔗 Подключенный репозиторий:
git remote -v

echo.
echo 📊 Статус файлов:
git status

echo.
echo 📝 Последние коммиты:
git log --oneline -5

echo.
echo 🌐 Ваш сайт: https://skaris123321.github.io
echo.
pause