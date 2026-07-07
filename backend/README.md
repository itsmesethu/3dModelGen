# AI 3D Scanner — Backend (development wrapper)

Thin FastAPI service for **local development only**. It contains **no
reconstruction logic** — it stores uploads, calls
`engine.generate_model()`, and adapts the engine's callback-based progress
into a pollable HTTP job. All business logic lives in `../engine`
(see `../engine/README.md`).

**No auth. No database. No permanent storage.** Every job works inside
`temp/<job_id>/` and is deleted automatically (30 min TTL) or via
`DELETE /api/jobs/{id}`.

## Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows  (source .venv/bin/activate on mac/linux)
pip install -r requirements.txt   # -e ../engine + fastapi/uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000
```

Interactive docs: http://localhost:8000/docs

## API

| Method | Path                   | Description                                  |
| ------ | ---------------------- | -------------------------------------------- |
| GET    | `/api/health`          | Engine + optional module availability        |
| POST   | `/api/validate`        | Single-image quality check (guided capture)  |
| POST   | `/api/jobs`            | Multipart upload (`images[]`) → job id       |
| GET    | `/api/jobs/{id}`       | Stage-by-stage progress                      |
| GET    | `/api/jobs/{id}/model` | Download the generated GLB                   |
| GET    | `/api/jobs/{id}/preview` | Download the generated preview PNG         |
| DELETE | `/api/jobs/{id}`       | Delete job + temp files immediately          |

## Where the pipeline actually lives

All pipeline stages, the engine/geometry-backend plugin registries, and
engine configuration live in `../engine`. This wrapper only:

- validates upload request shape (`app/api/routes.py`)
- stores uploads in `temp/<job_id>/images/` and calls
  `engine.generate_model()` (`app/jobs.py`)
- mirrors the engine's progress callback into a pollable `JobStatus`

To add a new geometry backend or whole engine implementation, see
`../engine/README.md` — nothing here needs to change.

## Optional upgrades

Install extras on the engine (from the `backend` venv):

```bash
pip install -e "../engine[ai]"        # torch, rembg (AI bg removal)
pip install -e "../engine[meshing]"   # open3d (Poisson meshing)
```

Colmap-based photogrammetry activates automatically once the `colmap`
binary is on PATH.
