# Architecture Overview

## Goals

Congo AI Studio is a modular audiovisual production environment. It should coordinate creative project data, media assets, AI inference, asynchronous jobs, and final exports without coupling the user interface to individual model providers.

## Logical components

### Web application
Next.js and TypeScript provide the studio interface. Creative modules should share navigation, project context, asset selection, and job status patterns.

### Application API
NestJS owns application-domain rules, validation, persistence coordination, authorization boundaries, and orchestration. It exposes stable APIs to the web application.

### AI service
Python, FastAPI, and PyTorch provide model execution adapters. Model-specific code must remain behind explicit interfaces so models can be replaced without rewriting product workflows.

### Workflow execution
ComfyUI is the initial workflow execution direction for compatible image and video pipelines. Workflow definitions and model requirements must be versioned and documented.

### Persistence and jobs
PostgreSQL stores structured application data. Prisma manages schema access. Redis and BullMQ coordinate asynchronous generation and processing jobs.

### Media processing
FFmpeg handles media inspection, conversion, composition, and export. Long-running tasks must execute asynchronously and report progress and failure states.

## Domain model direction

The initial creative hierarchy is:

`Project → Season (optional) → Episode (optional) → Scene → Shot`

A project may also own characters, environments, props, assets, workflows, and export profiles.

## Character continuity

Character identity must be independent of a single generated image. A character record should eventually support:

- Stable identifier and canonical name
- Physical and descriptive attributes
- Versioned visual reference assets
- Clothing and appearance variants
- Voice profile references
- Links to scenes, shots, and episodes using the character

Changes to canonical references should be traceable rather than silently replacing historical production context.

## GPU and model management

Hardware must be detected at runtime. Record device type, available memory, supported execution backend, and relevant platform quotas before scheduling inference. Never assume CUDA or a local NVIDIA GPU is available. Provide clear queue, failure, and fallback states.

## Initial implementation sequence

1. Repository conventions and architecture documentation
2. Backend and web application foundations
3. Database schema and project management
4. Asset library and media metadata
5. AI service adapter and runtime capability detection
6. ComfyUI workflow integration
7. Story, character, and environment workflows
8. Storyboard, image, video, voice, and audio workflows
9. Editing, export, and operational hardening

Each stage must be implemented and verified before depending on it.
