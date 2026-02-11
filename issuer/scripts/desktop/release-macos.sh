#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "This script only runs on macOS (Darwin)." >&2
  exit 1
fi

required_env=(
  APPLE_SIGNING_IDENTITY
  APPLE_ID
  APPLE_TEAM_ID
)

for var in "${required_env[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    echo "Missing required env var: $var" >&2
    exit 1
  fi
done

for cmd in npm cargo codesign xcrun shasum; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing required command: $cmd" >&2
    exit 1
  fi
done

if [[ -z "${APPLE_APP_SPECIFIC_PASSWORD:-}" ]]; then
  KEYCHAIN_ITEM="${APPLE_KEYCHAIN_ITEM:-ampa-issuer-notarytool}"
  if command -v security >/dev/null 2>&1; then
    APPLE_APP_SPECIFIC_PASSWORD="$(security find-generic-password -a "$APPLE_ID" -s "$KEYCHAIN_ITEM" -w 2>/dev/null || true)"
  fi
fi

if [[ -z "${APPLE_APP_SPECIFIC_PASSWORD:-}" ]]; then
  read -r -s -p "Apple app-specific password (input hidden): " APPLE_APP_SPECIFIC_PASSWORD
  echo
fi

if [[ -z "${APPLE_APP_SPECIFIC_PASSWORD:-}" ]]; then
  echo "Missing app-specific password. Set APPLE_APP_SPECIFIC_PASSWORD or store it in Keychain." >&2
  exit 1
fi

echo "[1/7] Building macOS DMG bundle..."
cargo tauri build --bundles dmg

BUNDLE_DIR="$ROOT_DIR/src-tauri/target/release/bundle"
APP_PATH="$(find "$BUNDLE_DIR/macos" -maxdepth 1 -type d -name "*.app" | head -n 1 || true)"
DMG_PATH="$(find "$BUNDLE_DIR/dmg" -maxdepth 1 -type f -name "*.dmg" | head -n 1 || true)"

if [[ -z "$APP_PATH" || -z "$DMG_PATH" ]]; then
  echo "Could not find generated .app/.dmg artifacts under $BUNDLE_DIR" >&2
  exit 1
fi

echo "[2/7] Signing app bundle..."
codesign --deep --force --options runtime --sign "$APPLE_SIGNING_IDENTITY" "$APP_PATH"

echo "[3/7] Verifying app signature..."
codesign --verify --deep --strict --verbose=2 "$APP_PATH"

echo "[4/7] Signing DMG..."
codesign --force --sign "$APPLE_SIGNING_IDENTITY" "$DMG_PATH"

echo "[5/7] Submitting for notarization (this can take a few minutes)..."
xcrun notarytool submit "$DMG_PATH" \
  --apple-id "$APPLE_ID" \
  --team-id "$APPLE_TEAM_ID" \
  --password "$APPLE_APP_SPECIFIC_PASSWORD" \
  --wait

echo "[6/7] Stapling notarization ticket..."
xcrun stapler staple "$APP_PATH"
xcrun stapler staple "$DMG_PATH"

echo "[7/7] Final Gatekeeper check + checksums"
spctl --assess --type execute --verbose "$APP_PATH"
spctl --assess --type open --verbose "$DMG_PATH"

RELEASE_DIR="$ROOT_DIR/release/macos"
mkdir -p "$RELEASE_DIR"
cp -f "$DMG_PATH" "$RELEASE_DIR/"
cp -f "$APP_PATH/Contents/Info.plist" "$RELEASE_DIR/AMPA-Issuer-Info.plist"

cd "$RELEASE_DIR"
shasum -a 256 ./*.dmg > SHA256SUMS.txt

cat <<MSG

macOS signed release ready:
- Artifact: $RELEASE_DIR/$(basename "$DMG_PATH")
- Checksums: $RELEASE_DIR/SHA256SUMS.txt

MSG
