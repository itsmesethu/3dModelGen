#!/bin/bash
# Vercel build script for Python backend

set -e

echo "=== Building 3D Model Gen Backend ==="
echo "Current directory: $(pwd)"
echo "Project root: $(dirname $(pwd))"

# Ensure we're in the api directory
cd "$(dirname "$0")"

echo "Installing Python dependencies..."

# Install all dependencies including the engine
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

echo "=== Build completed successfully ==="
