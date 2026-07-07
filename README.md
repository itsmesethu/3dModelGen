# AI Mobile 3D Scanner (Offline-First MVP)

React Native app that lets a user **visualize** an existing 3D model or
**create** a new one from a handful of photos. All reconstruction logic
lives in a single, platform-independent **engine** — no authentication, no
database, no cloud storage, no persistence. Every upload and intermediate
file is temporary and cleaned up automatically.

## Structure

```
engine/     Reconstruction Engine (photos -> GLB)   — see engine/README.md
            The ONLY place with business logic. No HTTP/Android/RN imports.
backend/    Thin FastAPI dev wrapper over the engine — see backend/README.md
android/    Native bridge scaffold for the production APK — see android/README.md
shared/     Language-neutral contracts (stages, result shape) — see shared/README.md
mobile/     React Native (TypeScript) app            — see mobile/README (below)
```

```
React Native ──HTTP (dev)──> FastAPI wrapper ──> engine.generate_model()
             ──native (prod)──> Android bridge ──> engine.generate_model()
```

Both transports call the *exact same* engine entry point. Screens never
know which transport is active.

## Quick start (development mode — HTTP)

### 1. Backend (run first)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt   # installs the engine as an editable dep
uvicorn main:app --host 0.0.0.0 --port 8000
```

Details, API reference: `backend/README.md`. Engine internals and how to
swap/extend reconstruction stages: `engine/README.md`.

### 2. Mobile app

```bash
cd mobile
npm install
npx react-native run-android   # or: run-ios (macOS only)
```

The app talks to the backend at `http://10.0.2.2:8000` (Android emulator) or
`http://localhost:8000` (iOS simulator) by default — see
`mobile/src/config.ts`. For a physical device, set `BACKEND_URL` to your
computer's LAN IP.

## App flow

```
Home ──┬── Visualize 3D ── pick GLB/GLTF/OBJ ── 3D Viewer
       └── Create 3D ── Capture/Select Images ── Review ── Generate ── 3D Result ── Download
```

## Architecture notes

- **`engine/`** is the single home of all business logic: validation,
  background removal, camera pose estimation, geometry reconstruction,
  mesh repair, texturing, optimization, GLB export. Pluggable at two
  levels — whole engines (`ReconstructionEngine`) and geometry backends
  (`GeometryBackend`) — via `engine/engine/registry.py`. See
  `engine/README.md`.
- **`backend/`** is a thin FastAPI wrapper for local development only: it
  stores uploads, calls `engine.generate_model()`, and adapts its
  callback-based progress into a pollable HTTP job. **No reconstruction
  logic.** Jobs live in memory with a TTL; files live under
  `backend/temp/<job_id>/` and are deleted after completion, download, or
  timeout.
- **`android/`** is the native bridge for the production APK: React
  Native calls a Kotlin module, which calls the same `engine` package
  in-process (via Chaquopy by default) — no network involved. See
  `android/README.md`.
- **`shared/`** documents the transport-agnostic contract (stages, result
  metadata) both transports and the mobile app must honor.
- **Mobile** (`mobile/src`): screens, reusable components
  (`ModelViewer`, `CameraOverlay`, `ProgressStepper`, `ImageGrid`,
  `BottomToolbar`), and a `services/reconstruction` layer built around a
  transport-agnostic `ReconstructionService` interface
  (`HttpReconstructionService` / `NativeReconstructionService`), selected
  automatically at runtime by `getReconstructionService()`. Screens never
  poll — progress arrives via callback either way.
