$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
Write-Host "Stopping Congo AI Studio application processes..." -ForegroundColor Yellow
Get-CimInstance Win32_Process |
  Where-Object { $_.CommandLine -match "next dev|nest start|uvicorn app.main:app" } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Write-Host "Stopping local PostgreSQL and Redis containers..." -ForegroundColor Yellow
docker compose stop
Write-Host "Congo AI Studio local services stopped." -ForegroundColor Green
