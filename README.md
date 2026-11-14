# Congo AI Studio

An open-source-first, modular AI audiovisual production studio for the complete creative pipeline: story development, pre-production, image and video generation, voice, editing, and export.

> **Status:** Foundation implementation. Web workspace, API foundation, project CRUD endpoints, AI service health endpoints, and local development setup are being built incrementally. Full production and model-generation workflows are not yet implemented.

## Product vision

Congo AI Studio brings these workflows into one coherent workspace:

- Project, season, episode, scene, and shot management
- Story and screenplay development
- Character and environment design
- Storyboards and image generation
- AI video generation
- Voice and audio production
- Editing and FFmpeg export
- Asset and AI model management
- GPU infrastructure monitoring

**Character continuity is a core requirement:** characters need stable identities and versioned visual, descriptive, and voice references reusable across shots, scenes, and episodes.

## Technology direction

| Layer | Technology |
|---|---|
| Web | Next.js, TypeScript |
| Application API | NestJS |
| Validation | class-validator, class-transformer |
| AI services | Python, FastAPI, PyTorch (runtime integration pending) |
| AI workflows | ComfyUI (integration pending) |
| Video generation | Wan 2.2 (integration pending) |
| Voice | Piper TTS (integration pending) |
| Media processing | FFmpeg (integration pending) |
| Database | PostgreSQL, Prisma |
| Background jobs | Redis, BullMQ (integration pending) |
| Version control | Git and GitHub |

## Current implementation

- [x] Repository documentation and architecture baseline
- [x] Next.js web workspace foundation
- [x] NestJS API foundation and health endpoint
- [x] Initial Prisma domain schema
- [x] Project create, list, read, update, and delete endpoints
- [x] FastAPI health and conservative capability endpoints
- [x] Local PostgreSQL and Redis Compose configuration
- [x] Windows startup and stop scripts
- [ ] Local builds and runtime tests (must be run on a development machine)
- [ ] Database migration and API integration tests
- [ ] Authentication and authorization
- [ ] AI model and workflow integrations

## Start on Windows

Requirements: Node.js 20.11+, Python 3.11+, Docker Desktop (running), and Git.

Clone this repository, open PowerShell in its root folder, and run:

```powershell
npm run setup:windows
```

Then open http://localhost:3000.

Stop local services with:

```powershell
npm run stop:windows
```

Detailed instructions: [Development Setup](docs/architecture/development-setup.md).

## Architecture direction

Planned domain hierarchy:

`Project → Season (optional) → Episode (optional) → Scene → Shot`

The system separates the web application, application API, AI inference service, workflow execution, job processing, and media pipeline.

## Security

Keep secrets in local environment files. Commit sanitized examples only. Never upload API keys, passwords, access tokens, private user data, model weights, or large generated assets.
