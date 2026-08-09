@echo off
setlocal

set "ROOT=%~dp0"

echo Stopping any old BhashaVaani dev servers on ports 6001, 6002, and 6003...
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%scripts\stop-dev-ports.ps1"
timeout /t 2 /nobreak > nul

start "BhashaVaani Backend" powershell -NoProfile -ExecutionPolicy Bypass -Command "$Host.UI.RawUI.WindowTitle='BhashaVaani Backend'; Set-Location -LiteralPath '%ROOT%'; .\scripts\start-backend.ps1"

timeout /t 4 /nobreak > nul

start "BhashaVaani Frontend (Flutter, 6002)" powershell -NoProfile -ExecutionPolicy Bypass -Command "$Host.UI.RawUI.WindowTitle='BhashaVaani Frontend (Flutter, 6002)'; Set-Location -LiteralPath '%ROOT%'; .\scripts\start-frontend.ps1"

REM apps/web_pwa is the new Vite/React frontend being built side-by-side
REM with the Flutter app (see .ai/handoffs/BV-WEBPWA-001.yaml). It runs on
REM 6003 so both are reachable at once during the migration. Its own
REM window starts npm install on first run if needed, so give it a head
REM start before the wait-for-frontend below blocks on the Flutter build.
start "BhashaVaani Frontend (Web PWA, 6003)" powershell -NoProfile -ExecutionPolicy Bypass -Command "$Host.UI.RawUI.WindowTitle='BhashaVaani Frontend (Web PWA, 6003)'; Set-Location -LiteralPath '%ROOT%'; .\scripts\start-web-pwa.ps1"

echo The Flutter frontend now builds a WebAssembly release bundle before
echo serving, so first launch can take a minute or two. Waiting for it to be
echo ready before opening the browser (this replaces the old fixed timer,
echo which used to open a blank white page before the app had finished
echo loading)...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%scripts\wait-for-frontend.ps1"

echo BhashaVaani is starting.
echo Backend:        http://127.0.0.1:6001/health
echo Frontend (old):  http://127.0.0.1:6002  (Flutter)
echo Frontend (new):  http://127.0.0.1:6003  (Web PWA -- may still be installing/starting, check its window)
echo.
echo Keep the opened backend and frontend windows running while using the app.
pause
