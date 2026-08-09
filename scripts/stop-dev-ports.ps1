param(
    # 6001: backend, 6002: apps/mobile_flutter, 6003: apps/web_pwa (new
    # Vite/React frontend, running side-by-side during the migration -- see
    # .ai/handoffs/BV-WEBPWA-001.yaml).
    [int[]]$Ports = @(6001, 6002, 6003)
)

$ErrorActionPreference = "SilentlyContinue"

foreach ($port in $Ports) {
    $connections = Get-NetTCPConnection -LocalPort $port
    $processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique

    foreach ($processId in $processIds) {
        if ($processId -gt 0) {
            Write-Host "Stopping process $processId on port $port..."
            Stop-Process -Id $processId -Force
        }
    }
}
