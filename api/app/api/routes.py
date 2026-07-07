"""HTTP API — development wrapper only.

Contains **no reconstruction logic**: it validates request format, stores
uploads in per-job temp directories, and delegates everything else to the
standalone `engine` package.
"""
import logging
from typing import List

from fastapi import APIRouter, BackgroundTasks, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

from engine import engine_info, validate_image_bytes

from app.api.schemas import HealthInfo, ImageValidation, JobCreated, JobStatus
from app.config import settings
from app.jobs import job_manager

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/health", response_model=HealthInfo)
async def health() -> HealthInfo:
    return HealthInfo(status="ok", engine=engine_info())


@router.post("/validate", response_model=ImageValidation)
async def validate(image: UploadFile = File(...)) -> ImageValidation:
    """Lightweight single-image quality check used during guided capture."""
    data = await image.read()
    if len(data) > settings.max_image_bytes:
        return ImageValidation(ok=False, reasons=["Image file is too large."])
    result = validate_image_bytes(data)
    return ImageValidation(**result.to_dict())


@router.post("/jobs", response_model=JobCreated, status_code=201)
async def create_job(
    background: BackgroundTasks,
    images: List[UploadFile] = File(...),
) -> JobCreated:
    if len(images) < settings.min_images:
        raise HTTPException(
            422,
            f"At least {settings.min_images} images are required "
            f"(got {len(images)}).",
        )
    if len(images) > settings.max_images:
        raise HTTPException(422, f"At most {settings.max_images} images are allowed.")

    payloads = []
    for upload in images:
        ext = ("." + upload.filename.rsplit(".", 1)[-1].lower()) if "." in (upload.filename or "") else ""
        if ext not in settings.allowed_extensions:
            raise HTTPException(415, f"Unsupported image type: {upload.filename}")
        data = await upload.read()
        if len(data) > settings.max_image_bytes:
            raise HTTPException(413, f"{upload.filename} exceeds the size limit.")
        payloads.append((upload.filename or "image.jpg", data))

    job = job_manager.create_job(payloads)
    background.add_task(job_manager.run_job, job.job_id)
    logger.info("Job %s created with %d images", job.job_id, len(payloads))
    return JobCreated(job_id=job.job_id, image_count=len(payloads))


@router.get("/jobs/{job_id}", response_model=JobStatus)
async def job_status(job_id: str) -> JobStatus:
    job = job_manager.get(job_id)
    if job is None:
        raise HTTPException(404, "Job not found (it may have expired).")
    return job.status()


@router.get("/jobs/{job_id}/model")
async def job_model(job_id: str) -> FileResponse:
    job = job_manager.get(job_id)
    if job is None:
        raise HTTPException(404, "Job not found (it may have expired).")
    if job.state != "done" or job.model_path is None or not job.model_path.exists():
        raise HTTPException(409, "Model is not ready yet.")
    return FileResponse(
        job.model_path,
        media_type="model/gltf-binary",
        filename="model.glb",
    )


@router.get("/jobs/{job_id}/preview")
async def job_preview(job_id: str) -> FileResponse:
    job = job_manager.get(job_id)
    if job is None:
        raise HTTPException(404, "Job not found (it may have expired).")
    if job.preview_path is None or not job.preview_path.exists():
        raise HTTPException(404, "No preview available for this job.")
    return FileResponse(job.preview_path, media_type="image/png")


@router.delete("/jobs/{job_id}", status_code=204)
async def delete_job(job_id: str) -> None:
    job_manager.delete(job_id)
