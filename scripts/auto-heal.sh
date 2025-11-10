#!/bin/bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="${PROJECT_ROOT}/build_log.txt"

# ensure log file exists and is truncated for the current run
: >"${LOG_FILE}"

log() {
  local message="$1"
  local timestamp
  timestamp="$(date -Iseconds)"
  echo "[${timestamp}] ${message}" | tee -a "${LOG_FILE}"
}

run_cmd() {
  local exit_on_fail=${2:-true}
  log "→ $1"
  set +e
  bash -lc "$1" 2>&1 | tee -a "${LOG_FILE}"
  local status=${PIPESTATUS[0]}
  set -e
  if [[ ${status} -ne 0 ]]; then
    log "✗ Command failed (${status}): $1"
    if [[ "${exit_on_fail}" == true ]]; then
      return ${status}
    fi
    return ${status}
  fi
  log "✓ Command succeeded: $1"
  return 0
}

log "🧠 Checking for outdated or corrupted build..."

log "🌐 Resetting npm registry configuration"
run_cmd "npm config set registry https://registry.npmjs.org/" || true
run_cmd "npm config set always-auth false" || true
run_cmd "npm config delete proxy" false || true
run_cmd "npm config delete https-proxy" false || true
run_cmd "npm cache clean --force" false || true

log "🔄 Fetching latest origin/main state"
run_cmd "git fetch origin main"

LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse origin/main)

if [[ "${LOCAL_COMMIT}" != "${REMOTE_COMMIT}" ]]; then
  log "🔁 Version mismatch detected — restoring latest main"
  run_cmd "git reset --hard origin/main"
else
  log "✅ Already up to date"
fi

log "🧹 Removing existing dependency installs"
run_cmd "rm -rf \"${PROJECT_ROOT}/node_modules\" \"${PROJECT_ROOT}/package-lock.json\""
run_cmd "rm -rf \"${PROJECT_ROOT}/backend/node_modules\" \"${PROJECT_ROOT}/backend/package-lock.json\""

log "📦 Installing dependencies with npm (legacy peer deps)"
if ! run_cmd "npm install --legacy-peer-deps" false; then
  if command -v bun >/dev/null 2>&1; then
    log "⚠️ npm install failed, attempting bun install"
    run_cmd "bun install"
  else
    log "❌ Bun is not installed; unable to complete dependency installation"
    exit 1
  fi
fi

log "📦 Installing backend dependencies"
if ! run_cmd "npm --prefix backend install --legacy-peer-deps" false; then
  if command -v bun >/dev/null 2>&1; then
    log "⚠️ Backend npm install failed, attempting bun install"
    run_cmd "(cd backend && bun install)"
  else
    log "❌ Bun is not installed; unable to complete backend dependency installation"
    exit 1
  fi
fi

log "🏗️ Running project build"
if ! run_cmd "npm run build" false; then
  if command -v bun >/dev/null 2>&1; then
    log "⚠️ npm run build failed, attempting bun run build"
    run_cmd "bun run build"
  else
    log "❌ Bun is not installed; unable to complete build"
    exit 1
  fi
fi

log "🩺 Running Expo doctor"
run_cmd "npx expo doctor" false || log "ℹ️ Expo doctor check skipped or unavailable"

log "🏁 Auto-heal complete. Logs available at ${LOG_FILE}"
