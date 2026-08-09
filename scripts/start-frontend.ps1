$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$flutterRoot = Join-Path $root "apps\mobile_flutter"
$buildWebDir = Join-Path $flutterRoot "build\web"
$python = Join-Path $root "apps\api\.api-venv\Scripts\python.exe"

Set-Location $flutterRoot

# Build a WebAssembly release bundle instead of running the debug
# `flutter run -d web-server` dev server. This fixes two things:
#   1. The white-screen-on-first-load issue: the debug dev server compiles
#      on first request, and opening the browser before that finished
#      previously showed a blank page until a later hard refresh caught the
#      now-ready app. A pre-built static bundle has no such race.
#   2. Load time: WebAssembly (dart2wasm) generally starts up faster than
#      the JS dev build. flutter_bootstrap.js automatically falls back to
#      the JS build on browsers without WasmGC support.
Write-Host "Building BhashaVaani Flutter web (release, WebAssembly)..."
flutter build web --wasm --base-href / `
    --dart-define=BHASHAVAANI_API_URL=http://127.0.0.1:6001 `
    --dart-define=BHASHAVAANI_ENV=local

if (-not (Test-Path $python)) {
    Write-Host "Backend virtual environment python not found at:"
    Write-Host $python
    Write-Host "Falling back to 'python' on PATH to serve the build."
    $python = "python"
}

Write-Host "Serving BhashaVaani Flutter web on http://127.0.0.1:6002"
& $python -m http.server 6002 --bind 127.0.0.1 --directory $buildWebDir
