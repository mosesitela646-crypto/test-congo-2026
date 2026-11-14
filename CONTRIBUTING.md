# Contributing

## Development workflow

1. Inspect the existing structure and related code before editing.
2. Define the smallest useful implementation.
3. Create a focused branch for the change.
4. Keep dependencies minimal and justify new infrastructure.
5. Add or update tests for behavior changes.
6. Run relevant checks and fix failures before opening a pull request.
7. Document configuration and operational requirements.

## Security and assets

- Never commit secrets, tokens, passwords, or private user data.
- Never commit model weights, generated video, large media files, or private datasets.
- Use `.env.example` for sanitized configuration templates.
- Verify model licenses and service terms before integrating them.

## Pull requests

Describe the problem, implementation, verification performed, and any known limitations. Do not claim tests passed unless they were actually run.
