#!/bin/bash
# Build script for Vercel deployment

set -e

echo "Installing Python dependencies..."

# Install main requirements
pip install -r requirements.txt

echo "Build completed successfully!"
