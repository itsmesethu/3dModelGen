# Reconstruction Contract

The language-neutral contract every transport (FastAPI dev wrapper, native
Android bridge, future implementations) must honor. The engine is the
source of truth — this document mirrors `engine/engine/models/types.py`.

## Entry point

```
generate_model(image_paths, output_directory, progress_callback) -> ReconstructionResult
```

- `image_paths` — ordered list of absolute paths. Order matters: guided
  capture order is Front, Front-Left, Left, Back, Right, Front-Right, Top,
  then extras.
- `output_directory` — where `model.glb` (and `preview.png` when possible)
  are written. Everything else is session-temporary and always deleted.
- `progress_callback(percent, current_stage)` — `percent` is `0..100`
  (float), `current_stage` is a stage key from `stages.json`.

## Result

```jsonc
{
  "model_path": "<output_directory>/model.glb",
  "preview_path": "<output_directory>/preview.png",   // may be null
  "metadata": {
    "vertices": 12345,
    "faces": 24000,
    "file_size_bytes": 1048576,
    "processing_seconds": 42.5,
    "engine": "python",
    "image_count": 7
  }
}
```

## Errors

Failures raise/return a single human-readable message suitable for direct
display to the user (e.g. "Image validation failed: photo 2 is too blurry").
Transports must not rewrite these messages.

## Single-image validation (guided capture)

```
validate_image_bytes(data) -> { ok, reasons[], blur_score, brightness }
```

## Stage/progress states (client-side rendering)

Stage display states: `waiting | running | done | failed`. A client derives
them from the callback: stages before `current_stage` are `done`, the
current one is `running`, the rest `waiting`; on error the current stage is
`failed`.

## Mirrors to keep in sync

- `engine/engine/models/types.py` (source of truth)
- `shared/contracts/stages.json`
- `backend/app/api/schemas.py` (dev wrapper DTOs)
- `mobile/src/services/reconstruction/types.ts` + `stages.ts`
- `android/bridge/` Kotlin constants
