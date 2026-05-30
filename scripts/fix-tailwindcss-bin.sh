#!/usr/bin/env bash
set -euo pipefail

# Hugo v0.161.0's css.TailwindCSS pipe expects a Node.js script in
# node_modules/.bin/tailwindcss, but pnpm installs a POSIX shell script.
# Replace it with a tiny Node.js wrapper that imports the real ESM entry.

BIN="node_modules/.bin/tailwindcss"

# Find the actual @tailwindcss/cli entry point (version-independent)
TARGET=$(find ../.pnpm -path '*/@tailwindcss/cli/dist/index.mjs' 2>/dev/null | head -1)

if [[ -z "$TARGET" ]]; then
  echo "Warning: @tailwindcss/cli entry point not found, skipping fix"
  exit 0
fi

if [[ -f "$BIN" ]] && head -1 "$BIN" | grep -q '^#!/bin/sh'; then
  cat > "$BIN" <<EOF
#!/usr/bin/env node
const path = require('path');
const target = path.join(__dirname, '${TARGET}');
import(target);
EOF
  chmod +x "$BIN"
  echo "Fixed $BIN for Hugo css.TailwindCSS compatibility"
fi
