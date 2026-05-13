#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

VENV_DIR=".venv-fonttools"

if [[ ! -d "$VENV_DIR" ]]; then
    echo "Creating virtual environment with uv..."
    uv venv "$VENV_DIR"
fi

echo "Installing fonttools and brotli..."
uv pip install --python "$VENV_DIR/bin/python" fonttools brotli

echo "Running font subsetting..."
"$VENV_DIR/bin/python" scripts/subset-fonts.py
