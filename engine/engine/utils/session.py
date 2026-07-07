"""Temporary session directories.

Every reconstruction runs inside `temp_root/session_<uuid>/` which holds
copies of nothing permanent — intermediate files only. The session is
always deleted afterwards; only the exported GLB (written to the caller's
output directory) survives.
"""
import shutil
import uuid
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from engine.config import settings


@contextmanager
def reconstruction_session() -> Iterator[Path]:
    session_dir = settings.temp_root / f"session_{uuid.uuid4().hex[:12]}"
    session_dir.mkdir(parents=True, exist_ok=True)
    try:
        yield session_dir
    finally:
        shutil.rmtree(session_dir, ignore_errors=True)
