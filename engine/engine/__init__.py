"""Reconstruction Engine — the single home of all business logic.

Public API (everything else is internal):

    from engine import generate_model, validate_image_bytes, engine_info
    from engine.models import ReconstructionResult, ValidationResult

Design rules (enforced by convention and code review):
- No HTTP, no Android, no React Native, no FastAPI imports — ever.
- Every stage is hidden behind `engine.interfaces` so any stage can be
  re-implemented in C++/Rust/ONNX/TFLite without touching callers.
- Progress is reported via callbacks, never polling.
"""
from engine.pipeline import engine_info, generate_model
from engine.implementations.python.validation.quality import validate_image_bytes

__all__ = ["generate_model", "engine_info", "validate_image_bytes"]
