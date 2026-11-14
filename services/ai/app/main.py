from datetime import datetime, timezone
from fastapi import FastAPI
app = FastAPI(title="Congo AI Studio AI Service", version="0.1.0", description="AI inference and workflow adapter service.")
@app.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    return {"status":"ok","service":"congo-ai-studio-ai","version":app.version,"timestamp":datetime.now(timezone.utc).isoformat()}
@app.get("/capabilities", tags=["system"])
async def capabilities() -> dict[str, object]:
    # Do not claim inference is ready until a real runtime/device probe is implemented.
    return {"inference_ready":False,"device":"not_detected","loaded_models":[],"message":"No model runtime has been configured yet."}
