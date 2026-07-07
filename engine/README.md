# Reconstruction Engine

The **single home of all business logic**: photos in → GLB out.

- No HTTP. No Android. No React Native. No FastAPI. Only processing.
- Both the FastAPI dev wrapper (`backend/`) and the native Android bridge
  (`android/`) call the exact same entry point.
- Progress is reported via **callbacks**, never polling.

## Public API

```python
from engine import generate_model

result = generate_model(
    image_paths=["a.jpg", "b.jpg", "c.jpg"],
    output_directory="out/",
    progress_callback=lambda percent, stage: print(percent, stage),
)
result.model_path        # out/model.glb
result.preview_path      # out/preview.png (or None)
result.metadata          # vertices, faces, file_size_bytes, processing_seconds, ...
```

Every reconstruction runs inside a `temp/session_<uuid>/` directory that is
always deleted afterwards — only the exported GLB/preview survive, in the
caller's `output_directory`.

## Architecture

```
engine/
  interfaces/        ReconstructionEngine + GeometryBackend contracts
  models/            Frame, ReconstructionResult, canonical STAGES
  registry.py        plugin registries (engines + geometry backends)
  pipeline.py        generate_model() — the one and only pipeline
  utils/session.py   temp session lifecycle
  implementations/
    python/          the initial implementation
      validation/  preprocessing/  camera/  reconstruction/
      mesh/  texturing/  optimization/  export/
```

### Replacing a stage or the whole engine

Python is the *first* implementation, not the architecture. To replace any
part:

- **A geometry algorithm** (InstantMesh, Wonder3D, TRELLIS, Hunyuan3D, ...):
  implement `GeometryBackend` and `register_backend()`. Done.
- **A whole engine** (C++, Rust, ONNX Runtime, TensorFlow Lite): implement
  `ReconstructionEngine` in `implementations/<name>/` and
  `register_engine()`. The pipeline, FastAPI wrapper, native bridge and the
  React Native app require **zero changes**.
- **A single stage** in an otherwise-Python engine: subclass
  `PythonReconstructionEngine` and override just that method.

## Install

```bash
pip install -e .            # core (numpy, opencv, trimesh, scikit-image)
pip install -e .[ai]        # + torch, rembg
pip install -e .[meshing]   # + open3d
```

## Canonical stages

`preparing → validating → background_removal → camera_estimation →
reconstruction → mesh_repair → texturing → optimization → export`

Defined once in `engine/models/types.py` and mirrored in
`shared/contracts/stages.json` for the mobile app and native bridge.
