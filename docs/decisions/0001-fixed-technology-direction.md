# ADR 0001: Initial Technology Direction

- **Status:** Accepted as the project baseline
- **Date:** 2026-11-14

## Context

The studio needs a maintainable web application, a structured application API, isolated AI inference services, asynchronous media processing, and persistent project data. The project prioritizes modularity and open-source-first operation.

## Decision

Use the following initial technology direction:

- Next.js, TypeScript, Tailwind CSS, shadcn/ui for the web application
- NestJS for the application API
- Python, FastAPI, and PyTorch for AI services
- ComfyUI for compatible AI workflows
- Wan 2.2 as the initial video-generation model direction
- ComfyUI-compatible diffusion models for image generation
- Piper TTS as the initial local voice direction, subject to quality evaluation
- FFmpeg for media processing
- PostgreSQL and Prisma for structured persistence
- Redis and BullMQ for asynchronous jobs
- Git and GitHub for version control

## Consequences

- Model execution remains separate from application-domain logic.
- Hardware and model compatibility must be checked before inference.
- The system can evolve individual model adapters without replacing the whole platform.
- Open-source licenses, hardware requirements, and deployment constraints must be checked for each selected component.
- This decision establishes a baseline; it does not mean the stack has already been installed or deployed.
