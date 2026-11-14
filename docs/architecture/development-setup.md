# Development Setup (Windows)

## One-time prerequisites

- Windows 10/11 64-bit
- Node.js 20.11 or newer (Node.js 24 LTS/current supported releases are suitable)
- Python 3.11 or newer
- Docker Desktop with WSL 2 backend enabled
- Git

## Start the studio

1. Clone the repository.
2. Open the repository folder in File Explorer.
3. Open PowerShell in that folder.
4. Run:

```powershell
npm run setup:windows
```

The script creates a local `.env`, starts PostgreSQL and Redis, installs JavaScript packages, generates Prisma Client, validates the Prisma schema, and opens separate terminals for the web app, API, and AI service.

The first startup requires an internet connection to install packages. Docker Desktop must already be running. The AI service installs its small Python dependencies on first launch. No AI model weights are downloaded.

## Open the local studio

- Web: http://localhost:3000
- API health: http://localhost:4000/api/health
- AI health: http://localhost:8000/health
- AI capabilities: http://localhost:8000/capabilities

## Stop the studio

Run this from the repository folder:

```powershell
npm run stop:windows
```

This stops app processes and the local database/cache containers. Data remains in Docker volumes.

## Manual checks

```powershell
npm run typecheck:web
npm run typecheck:api
npm run build:web
npm run build:api
npm run db:validate
```

## Important

The startup script does not create a database migration or production data. The Prisma schema must be validated before the first migration. Do not expose the local development database to a public network. Do not put real secrets in Git.
