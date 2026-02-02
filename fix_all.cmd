@echo off
echo Исправляю все контакторы...

REM Читаем файл и делаем замены
powershell -Command "(Get-Content 'data\products.json' -Raw) -replace '\"inputs_count\": \"2\",', '\"phase_type\": \"single_phase\", \"pole_count\": \"single_phase\", \"connection_type\": \"poles\", \"climate_type\": \"U2\",' | Set-Content 'data\products.json'"

echo Замены завершены!
pause