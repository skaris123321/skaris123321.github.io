@echo off
chcp 65001 >nul
echo ========================================
echo    ОБНОВЛЕНИЕ САЙТА РОСЭК НА GITHUB
echo ========================================
echo.

echo Добавляем все изменения...
git add .

echo.
set /p commit_message="Введите описание изменений (или нажмите Enter): "

if "%commit_message%"=="" (
    set commit_message=Обновление сайта
)

echo.
echo Создаем коммит: "%commit_message%"
git commit -m "%commit_message%"

if %errorlevel% neq 0 (
    echo Нет изменений для отправки
    pause
    exit /b
)

echo.
echo Отправляем на GitHub...
git push origin master

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   САЙТ УСПЕШНО ОБНОВЛЕН!
    echo   Ссылка: https://skaris123321.github.io
    echo ========================================
    echo.
    echo Изменения появятся на сайте через 1-2 минуты
) else (
    echo.
    echo ОШИБКА при отправке на GitHub!
)

pause