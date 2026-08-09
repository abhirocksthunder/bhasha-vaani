param(
    [string]$Url = "http://127.0.0.1:6002",
    [int]$TimeoutSeconds = 240
)

# Opens the browser only once the frontend is actually responding, instead
# of guessing with a fixed timer. The old fixed-timeout approach opened the
# browser before the (now-removed) debug dev server had finished compiling,
# which showed a blank white page until a later hard refresh caught up.
# Now that the frontend does a full `flutter build web --wasm` first, the
# wait can legitimately take a minute or two on a cold build.

$ErrorActionPreference = "SilentlyContinue"
$deadline = (Get-Date).AddSeconds($TimeoutSeconds)

Write-Host "Waiting for BhashaVaani frontend to finish building and start serving at $Url ..."
Write-Host "(First launch builds a WebAssembly release bundle, so this can take a minute or two.)"

while ((Get-Date) -lt $deadline) {
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
        if ($response.StatusCode -eq 200) {
            Write-Host "Frontend is ready."
            Start-Process $Url
            exit 0
        }
    } catch {
        Start-Sleep -Seconds 2
    }
}

Write-Host "Timed out after $TimeoutSeconds seconds waiting for the frontend."
Write-Host "It may still be building -- check the 'BhashaVaani Frontend' window, then open $Url manually once it says it is serving."
Start-Process $Url
