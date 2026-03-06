@echo off
chcp 65001 >nul
echo ========================================
echo   Загрузка изменений на GitHub
echo ========================================
echo.

git add .
git commit -m "Обновление сайта"
git push

echo.
echo ========================================
echo   Готово!
echo ========================================
echo.
echo Сайт обновится через 1-2 минуты на:
echo https://skaris123321.github.io/
echo.
pause
