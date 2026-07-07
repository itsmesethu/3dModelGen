"""Development-transport job registry.

The engine reports progress via callbacks (no polling in the engine). HTTP,
however, is a pull transport — so this wrapper adapts the engine callback
into an in-memory, pollable job object. This file contains **no
reconstruction logic**; it only stores uploads, invokes
`engine.generate_model`, and mirrors its progress.
"""
import logging
import shutil
import threading
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from engine import generate_model
from engine.models import STAGES

from app.api.schemas import JobStatus, ModelMetadata, StageStatus
from app.config import settings

logger = logging.getLogger(__name__)

_STAGE_KEYS = [stage.key for stage in STAGES]


@dataclass
class Job:
    job_id: str
    workdir: Path
    image_paths: List[Path]
    created_at: float = field(default_factory=time.time)
    state: str = "queued"          # queued | processing | done | failed
    progress: float = 0.0          # 0..1
    stage: Optional[str] = None
    error: Optional[str] = None
    model_path: Optional[Path] = None
    preview_path: Optional[Path] = None
    metadata: Optional[ModelMetadata] = None
    lock: threading.Lock = field(default_factory=threading.Lock, repr=False)

    def on_progress(self, percent: float, stage_key: str) -> None:
        """Engine progress callback -> pollable state."""
        with self.lock:
            self.progress = max(self.progress, percent / 100.0)
            self.stage = stage_key

    def status(self) -> JobStatus:
        with self.lock:
            current = _STAGE_KEYS.index(self.stage) if self.stage in _STAGE_KEYS else -1
            stages = []
            for position, stage in enumerate(STAGES):
                if self.state == "done":
                    stage_state = "done"
                elif self.state == "failed" and position == current:
                    stage_state = "failed"
                elif position < current:
                    stage_state = "done"
                elif position == current and self.state == "processing":
                    stage_state = "running"
                else:
                    stage_state = "waiting"
                stages.append(
                    StageStatus(key=stage.key, label=stage.label, state=stage_state)
                )
            return JobStatus(
                job_id=self.job_id,
                state=self.state,
                progress=round(self.progress, 3),
                stage=self.stage,
                stages=stages,
                error=self.error,
                elapsed_seconds=round(time.time() - self.created_at, 1),
                metadata=self.metadata,
            )


class JobManager:
    def __init__(self) -> None:
        self._jobs: Dict[str, Job] = {}
        self._lock = threading.Lock()
        self._reaper: Optional[threading.Thread] = None
        self._stop = threading.Event()

    # -- lifecycle -----------------------------------------------------
    def create_job(self, images: List[Tuple[str, bytes]]) -> Job:
        job_id = uuid.uuid4().hex[:12]
        workdir = settings.temp_dir / job_id
        (workdir / "images").mkdir(parents=True, exist_ok=True)

        image_paths: List[Path] = []
        for index, (name, data) in enumerate(images):
            ext = ("." + name.rsplit(".", 1)[-1].lower()) if "." in name else ".jpg"
            path = workdir / "images" / f"{index:03d}{ext}"
            path.write_bytes(data)
            image_paths.append(path)

        job = Job(job_id=job_id, workdir=workdir, image_paths=image_paths)
        with self._lock:
            self._jobs[job_id] = job
        return job

    def run_job(self, job_id: str) -> None:
        job = self.get(job_id)
        if job is None:
            return
        job.state = "processing"
        try:
            result = generate_model(
                image_paths=job.image_paths,
                output_directory=job.workdir / "output",
                progress_callback=job.on_progress,
            )
            job.model_path = result.model_path
            job.preview_path = result.preview_path
            job.metadata = ModelMetadata(**result.metadata.to_dict())
            job.state = "done"
            job.progress = 1.0
        except Exception as exc:  # noqa: BLE001 - surface any failure to client
            logger.exception("Job %s failed", job_id)
            job.state = "failed"
            job.error = str(exc)

    def get(self, job_id: str) -> Optional[Job]:
        with self._lock:
            return self._jobs.get(job_id)

    def delete(self, job_id: str) -> None:
        with self._lock:
            job = self._jobs.pop(job_id, None)
        if job is not None:
            shutil.rmtree(job.workdir, ignore_errors=True)
            logger.info("Job %s deleted, temp files removed", job_id)

    # -- reaper --------------------------------------------------------
    def start_reaper(self) -> None:
        if self._reaper is not None:
            return
        self._stop.clear()
        self._reaper = threading.Thread(target=self._reap_loop, daemon=True)
        self._reaper.start()

    def shutdown(self) -> None:
        self._stop.set()
        with self._lock:
            ids = list(self._jobs.keys())
        for job_id in ids:
            self.delete(job_id)

    def _reap_loop(self) -> None:
        while not self._stop.wait(settings.reaper_interval_seconds):
            cutoff = time.time() - settings.job_ttl_seconds
            with self._lock:
                expired = [j for j in self._jobs.values() if j.created_at < cutoff]
            for job in expired:
                self.delete(job.job_id)


job_manager = JobManager()
