param(
    [int[]]$Ports = @(6001, 6002)
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
