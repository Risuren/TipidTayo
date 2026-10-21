@echo off
title TipidTayo Full-Stack Launcher
echo ==============================================
echo        Starting TipidTayo Web App...
echo ==============================================
echo.

set "PATH=D:\BACKUP\Rian\xampp\nodejs;D:\BACKUP\Rian\xampp\php;%PATH%"

echo [1/2] Starting Laravel Backend on http://localhost:8000 ...
start "TipidTayo Backend (Laravel :8000)" cmd /k "cd /d D:\BACKUP\Rian\xampp\htdocs\TipidTayo\backend && php artisan serve --port=8000"

echo [2/2] Starting React Frontend on http://localhost:5173 ...
start "TipidTayo Frontend (React :5173)" cmd /k "cd /d D:\BACKUP\Rian\xampp\htdocs\TipidTayo\frontend && npm run dev -- --host 0.0.0.0 --port 5173"

echo.
echo Servers launched! Opening http://localhost:5173/ in your browser...
timeout /t 2 >nul
start http://localhost:5173/

echo TipidTayo is active!
pause
