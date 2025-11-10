#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$ROOT_DIR/logs"
timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
cat <<MSG > "$ROOT_DIR/logs/health_checks_enabled"
Health diagnostics activated at $timestamp
MSG

echo "✅ Health diagnostics flag created in logs/health_checks_enabled"
