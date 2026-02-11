#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BUNDLE_DIR="$ROOT_DIR/src-tauri/target/release/bundle"
OUT_FILE="$BUNDLE_DIR/SHA256SUMS.txt"

if [[ ! -d "$BUNDLE_DIR" ]]; then
  echo "Bundle directory not found: $BUNDLE_DIR" >&2
  exit 1
fi

find "$BUNDLE_DIR" -type f \
  \( -name "*.dmg" -o -name "*.msi" -o -name "*.exe" -o -name "*.deb" -o -name "*.AppImage" \) \
  -print0 | xargs -0 shasum -a 256 > "$OUT_FILE"

echo "Checksums written to $OUT_FILE"
