# AI Service

FastAPI boundary for model inference, ComfyUI orchestration, and runtime capability discovery.

```bash
python -m venv .venv
# Activate the environment, then:
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Health: `GET /health`
- Runtime capabilities: `GET /capabilities`

The capability endpoint reports inference unavailable until hardware and model runtimes are explicitly detected. Startup must not download model weights or assume CUDA.
