# Congo AI Studio

An open-source-first, modular AI audiovisual production studio for the complete creative pipeline: story development, pre-production, image and video generation, voice, editing, and export.

> **Status:** Foundation stage. This repository currently establishes the product direction and architecture. The production modules are not yet implemented.

## Product vision

Congo AI Studio will bring these workflows into one coherent workspace:

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
| Web | Next.js, TypeScript, Tailwind CSS, shadcn/ui |
| Application API | NestJS |
| AI services | Python, FastAPI, PyTorch |
| AI workflows | ComfyUI |
| Video generation | Wan 2.2 |
| Image generation | ComfyUI-compatible diffusion models |
| Voice | Piper TTS; alternatives evaluated separately |
| Media processing | FFmpeg |
| Database | PostgreSQL, Prisma |
| Background jobs | Redis, BullMQ |
| Version control | Git and GitHub |

This is the target stack, not a claim that every component is installed or deployed. Model versions, hardware support, and licenses must be validated before use.

## Architecture direction

- **Web app:** creative workspaces and user experience.
- **API:** project domain, persistence, authorization, and orchestration.
- **AI services:** inference and media-generation adapters.
- **Workflow engine:** ComfyUI workflow execution.
- **Job system:** asynchronous generation and processing.
- **Media pipeline:** validation, transformation, editing, and export.

Planned domain hierarchy:

`Project → Season (optional) → Episode (optional) → Scene → Shot`

## Planned modules

1. Dashboard
2. Project Management
3. Story Studio
4. Character Studio
5. Environment Studio
6. Storyboard Studio
7. Image Studio
8. Video Studio
9. Voice Studio
10. Audio Studio
11. Editing Studio
12. Asset Library
13. AI Model Manager
14. GPU Infrastructure Manager
15. Export Studio

## Target repository layout

```text
apps/
  web/
  api/
services/
  ai/
packages/
  shared/
infrastructure/
docs/
  architecture/
  decisions/
scripts/
```

Directories will be introduced as their corresponding implementation begins.

## Engineering principles

1. Inspect the existing code before changing it.
2. Build one coherent, testable feature at a time.
3. Keep modules separated and interfaces explicit.
4. Detect available hardware, VRAM, quotas, and runtime capabilities before loading models.
5. Prefer free and open-source components; paid services must never be mandatory.
6. Never commit secrets, credentials, private datasets, generated media, or model weights.
7. Test and verify behavior before calling a feature complete.
8. Record important architectural decisions.

## Security

Keep secrets in local environment files. Commit sanitized examples only. Never upload API keys, passwords, access tokens, private user data, model weights, or large generated assets.
