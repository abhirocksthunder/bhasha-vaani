$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$flutterRoot = Join-Path $root "apps\mobile_flutter"

Set-Location $flutterRoot
Write-Host "Starting BhashaVaani Flutter web on http://127.0.0.1:6002"
flutter run -d web-server --web-hostname 127.0.0.1 --web-port 6002
