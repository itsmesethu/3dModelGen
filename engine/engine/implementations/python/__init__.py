"""Python implementation of the reconstruction engine (the initial one).

Registers itself and its geometry backends with `engine.registry`.
Future implementations (cpp / onnx / tflite) live as sibling packages and
register the same way — nothing else in the project changes.
"""
from engine.registry import register_backend, register_engine

from engine.implementations.python.engine import PythonReconstructionEngine
from engine.implementations.python.reconstruction.photogrammetry import (
    PhotogrammetryBackend,
)
from engine.implementations.python.reconstruction.visual_hull import VisualHullBackend

# Geometry backends — highest quality first; the registry picks the first
# one whose is_available() returns True.
register_backend("photogrammetry", PhotogrammetryBackend)
register_backend("visual_hull", VisualHullBackend)

# Whole-engine implementations.
register_engine("python", PythonReconstructionEngine)
