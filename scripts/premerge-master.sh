#!/usr/bin/env bash

set -euo pipefail

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "premerge:master requires macOS because it validates the DMG build." >&2
  exit 1
fi

: "${COLTIDE_COGNITO_DOMAIN:?Missing COLTIDE_COGNITO_DOMAIN}"
: "${COLTIDE_COGNITO_CLIENT_ID:?Missing COLTIDE_COGNITO_CLIENT_ID}"
: "${COLTIDE_AWS_REGION:?Missing COLTIDE_AWS_REGION}"
: "${COLTIDE_API_ENDPOINT:?Missing COLTIDE_API_ENDPOINT}"
: "${COLTIDE_VAULT_API_ENDPOINT:?Missing COLTIDE_VAULT_API_ENDPOINT}"

if [[ "${CI:-}" == "true" ]]; then
  cargo clean -p ort-sys -p sherpa-rs-sys
fi

# Tauri's config loader requires the desktop dist directory to exist even for cargo check.
bun run --filter @colt/ide build:vite
bun run check
bun run test

cd apps/desktop
bunx tauri build \
  --target aarch64-apple-darwin \
  --bundles dmg \
  --config '{"bundle":{"createUpdaterArtifacts":false}}'
