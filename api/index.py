"""AI 3D Scanner backend entrypoint for Vercel.

Run with:
    uvicorn api.index:app --host 0.0.0.0 --port 8000
"""
import logging
import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Add paths for imports
api_dir = Path(__file__).parent
project_root = api_dir.parent

# Add api directory for local app imports
sys.path.insert(0, str(api_dir))
# Add project root for engine imports
sys.path.insert(0, str(project_root))

from app.api.routes import router as api_router
from app.config import settings
from app.jobs import job_manager

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
)

app = FastAPI(
    title="AI 3D Scanner",
    description="Offline-first photogrammetry / AI reconstruction service. "
    "No auth, no database, no permanent storage.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.on_event("startup")
async def startup() -> None:
    settings.temp_dir.mkdir(parents=True, exist_ok=True)
    job_manager.start_reaper()


@app.on_event("shutdown")
async def shutdown() -> None:
    job_manager.shutdown()
