# Shared Models & Contracts

Language-neutral definitions shared by the engine, the FastAPI dev wrapper,
the native Android bridge and the React Native app.

- `contracts/reconstruction.md` — the full reconstruction contract
  (entry point, progress callback, result metadata, error semantics).
- `contracts/stages.json` — canonical pipeline stage keys and labels.

The **engine is the source of truth** (`engine/engine/models/types.py`);
files here document the contract for non-Python consumers. When changing
stages or metadata, update every mirror listed in
`contracts/reconstruction.md`.
