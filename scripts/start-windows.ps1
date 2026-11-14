$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "=== Congo AI Studio: Windows startup ===" -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js is missing. Install Node.js 20.11 or newer, then run this script again."
}
$nodeMajor = [int]((node -p "process.versions.node.split('.')[0]"))
if ($nodeMajor -lt 20) { throw "Node.js 20 or newer is required." }

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw "npm was not found. Reinstall Node.js with npm included."
}
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "Docker Desktop is required for the local PostgreSQL and Redis services. Install and start Docker Desktop first."
}

if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host "Created local .env from .env.example."
}

Write-Host "Starting PostgreSQL and Redis..." -ForegroundColor Yellow
docker compose up -d
if ($LASTEXITCODE -ne 0) { throw "Docker Compose could not start. Check that Docker Desktop is running." }

Write-Host "Installing JavaScript dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) { throw "npm install failed. Fix the reported dependency error before continuing." }

Write-Host "Generating Prisma Client..." -ForegroundColor Yellow
npm run db:generate
if ($LASTEXITCODE -ne 0) { throw "Prisma Client generation failed." }

# Load DATABASE_URL from the repository root .env into this process so Prisma
# can read it even though npm runs the Prisma CLI from apps/api.
$databaseLine = Get-Content ".env" | Where-Object { $_ -match '^\s*DATABASE_URL\s*=' } | Select-Object -First 1
if (-not $databaseLine) { throw "DATABASE_URL is missing from the root .env file." }
$env:DATABASE_URL = ($databaseLine -replace '^\s*DATABASE_URL\s*=\s*', '').Trim().Trim('"').Trim("'")

Write-Host "Checking database schema..." -ForegroundColor Yellow
npm run db:validate
if ($LASTEXITCODE -ne 0) { throw "Prisma schema validation failed." }

Write-Host "Applying database migrations..." -ForegroundColor Yellow
npm run db:migrate:init
if ($LASTEXITCODE -ne 0) { throw "Database migration failed." }

Write-Host "Opening web, API and AI service terminals..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root'; npm run dev:web"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root'; npm run dev:api"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\services\ai'; if (!(Test-Path '.venv')) { python -m venv .venv }; .\.venv\Scripts\Activate.ps1; pip install -r requirements.txt; uvicorn app.main:app --reload --port 8000"

Write-Host ""
Write-Host "Startup commands completed. Wait for all three services to report ready." -ForegroundColor Green
Write-Host "Web: http://localhost:3000"
Write-Host "API health: http://localhost:4000/api/health"
Write-Host "AI health: http://localhost:8000/health"
Write-Host "If a terminal shows an error, copy its full message and send it with ERREUR."
