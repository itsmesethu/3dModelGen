"""AI 3D Scanner backend entrypoint.

Run with:
    uvicorn main:app --host 0.0.0.0 --port 8000
"""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
