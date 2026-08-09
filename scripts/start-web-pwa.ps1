$root = Split-Path -Parent $PSScriptRoot
$webPwaRoot = Join-Path $root "apps\web_pwa"

Set-Location $webPwaRoot

# apps/web_pwa (Vite/React) is the new frontend being built side-by-side
# with apps/mobile_flutter (Flutter Web on 6002) -- see
# .ai/handoffs/BV-WEBPWA-001.yaml for the migration plan. It runs on 6003,
# not 6002, so both can be open at once during the migration.
#
# Deliberately NOT using $ErrorActionPreference = "Stop" here: on newer
# PowerShell, that turns any native-command stderr/non-zero-exit (which npm
# produces routinely, even for warnings) into a terminating error, and a
# terminating error in a non-interactive `-Command` window closes the
# window immediately with no chance to read what went wrong. Each step
# below checks $LASTEXITCODE explicitly instead, and the very end always
# pauses so the window never just vanishes.

function Fail($message) {
    Write-Host ""
    Write-Host "ERROR: $message" -ForegroundColor Red
    Write-Host ""
    Write-Host "Press any key to close this window..."
    [void][System.Console]::ReadKey($true)
    exit 1
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Fail "npm was not found on PATH. Install Node.js (https://nodejs.org) and re-run Start BhashaVaani.cmd."
}

$nodeModules = Join-Path $webPwaRoot "node_modules"
$viteBin = Join-Path $nodeModules ".bin\vite.cmd"

if ((-not (Test-Path $nodeModules)) -or (-not (Test-Path $viteBin))) {
    if (Test-Path $nodeModules) {
        Write-Host "apps/web_pwa/node_modules exists but looks incomplete (missing vite) -- reinstalling."
        Write-Host "(This can happen if a previous install was interrupted.)"
    } else {
        Write-Host "apps/web_pwa/node_modules not found -- running npm install first..."
        Write-Host "(This can take a couple of minutes on first run.)"
    }
    npm install
    if ($LASTEXITCODE -ne 0) {
        Fail "npm install failed with exit code $LASTEXITCODE. See the output above for details."
    }
}

Write-Host "Serving BhashaVaani Web PWA (Vite dev server) on http://127.0.0.1:6003"
npm run dev
$devExitCode = $LASTEXITCODE

Write-Host ""
Write-Host "The Web PWA dev server stopped (exit code $devExitCode)."
Write-Host "Press any key to close this window..."
[void][System.Console]::ReadKey($true)
