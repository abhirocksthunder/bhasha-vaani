$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$apiRoot = Join-Path $root "apps\api"
$python = Join-Path $apiRoot ".api-venv\Scripts\python.exe"

if (-not (Test-Path $python)) {
    Write-Host "Backend virtual environment was not found at:"
    Write-Host $python
    Write-Host "Create it first from apps\api, then run this script again."
    exit 1
}

Set-Location $apiRoot
Write-Host "Starting BhashaVaani backend on http://127.0.0.1:6001"
& $python -m uvicorn app.main:app --host 127.0.0.1 --port 6001
