@echo off
setlocal

set "ROOT=%~dp0"

echo Stopping any old BhashaVaani dev servers on ports 6001 and 6002...
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%scripts\stop-dev-ports.ps1"
timeout /t 2 /nobreak > nul

start "BhashaVaani Backend" powershell -NoProfile -ExecutionPolicy Bypass -Command "$Host.UI.RawUI.WindowTitle='BhashaVaani Backend'; Set-Location -LiteralPath '%ROOT%'; .\scripts\start-backend.ps1"

timeout /t 4 /nobreak > nul

start "BhashaVaani Frontend" powershell -NoProfile -ExecutionPolicy Bypass -Command "$Host.UI.RawUI.WindowTitle='BhashaVaani Frontend'; Set-Location -LiteralPath '%ROOT%'; .\scripts\start-frontend.ps1"

timeout /t 8 /nobreak > nul

start "" "http://127.0.0.1:6002"

echo BhashaVaani is starting.
echo Backend:  http://127.0.0.1:6001/health
echo Frontend: http://127.0.0.1:6002
echo.
echo Keep the opened backend and frontend windows running while using the app.
pause
