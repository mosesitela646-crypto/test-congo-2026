# Development Setup

## Prerequisites

- Node.js 20.11 or newer
- npm workspaces
- Python 3.11 or newer
- Docker Engine with Docker Compose (optional; for PostgreSQL and Redis)

## Infrastructure

Copy `.env.example` to `.env`, then run `docker compose up -d`. The default database password is for local development only; change it before exposing services beyond your machine.

## Install and run

```bash
npm install
npm run dev:web
npm run dev:api
```

Run the AI service in another terminal:

```bash
cd services/ai
python -m venv .venv
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Local endpoints

- Web: http://localhost:3000
- API health: http://localhost:4000/api/health
- AI health: http://localhost:8000/health
- AI capabilities: http://localhost:8000/capabilities

The Prisma schema is at `apps/api/prisma/schema.prisma`. Prisma CLI/client integration and migrations are intentionally not yet enabled; validate the database connection and schema before creating the first migration.
