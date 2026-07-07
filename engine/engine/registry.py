"""Plugin registries.

Two levels of pluggability:

1. Engine registry — whole `ReconstructionEngine` implementations
   (python today; cpp / onnx / tflite tomorrow).
2. Geometry backend registry — algorithms for the reconstruction stage
   alone (visual_hull, colmap, instant_mesh, wonder3d, trellis, ...).

Adding a plugin never requires changes to the pipeline, the FastAPI
wrapper, the native bridge, or React Native — only a `register_*` call
inside the new implementation's module.
"""
import importlib.util
import logging
from typing import Callable, Dict, List, Optional

from engine.interfaces.engine import GeometryBackend, ReconstructionEngine

logger = logging.getLogger(__name__)

_ENGINES: Dict[str, Callable[[], ReconstructionEngine]] = {}
_BACKENDS: Dict[str, Callable[[], GeometryBackend]] = {}


def module_available(module_name: str) -> bool:
    return importlib.util.find_spec(module_name) is not None


# -- whole-engine registry -------------------------------------------------

def register_engine(name: str, factory: Callable[[], ReconstructionEngine]) -> None:
    _ENGINES[name] = factory


def create_engine(preferred: Optional[List[str]] = None) -> ReconstructionEngine:
    """Return the highest-priority engine that can run on this machine."""
    _ensure_default_implementations()
    order = preferred or list(_ENGINES.keys())
    for name in order:
        factory = _ENGINES.get(name)
        if factory is None:
            continue
        try:
            return factory()
        except Exception:  # pragma: no cover
            logger.warning("Engine %s failed to initialize", name, exc_info=True)
    raise RuntimeError("No reconstruction engine is available.")


def registered_engines() -> List[str]:
    _ensure_default_implementations()
    return list(_ENGINES.keys())


# -- geometry backend registry ----------------------------------------------

def register_backend(name: str, factory: Callable[[], GeometryBackend]) -> None:
    _BACKENDS[name] = factory


def create_best_backend(preferred: Optional[List[str]] = None) -> GeometryBackend:
    """Return the highest-priority geometry backend available."""
    order = preferred or list(_BACKENDS.keys())
    for name in order:
        factory = _BACKENDS.get(name)
        if factory is None:
            continue
        try:
            backend = factory()
            if backend.is_available():
                logger.info("Using geometry backend: %s", name)
                return backend
        except Exception:  # pragma: no cover
            logger.warning("Backend %s failed to initialize", name, exc_info=True)
    raise RuntimeError("No geometry backend is available.")


def registered_backends() -> List[str]:
    return list(_BACKENDS.keys())


def _ensure_default_implementations() -> None:
    """Import bundled implementations so they self-register (lazy)."""
    import engine.implementations.python  # noqa: F401
