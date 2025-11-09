#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const rootDir = process.cwd();
const logsDir = path.join(rootDir, 'logs');
const logPath = path.join(logsDir, 'auto_health_check.json');
const requiredEnvKeys = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_URL',
  'FRONTEND_URL',
];

function logCheck(name, success, message) {
  const prefix = success ? '✅' : '❌';
  console.log(`${prefix} ${name}: ${message}`);
}

async function ensureLogsDirectory() {
  await fs.mkdir(logsDir, { recursive: true });
}

async function readJson(file) {
  try {
    const content = await fs.readFile(path.join(rootDir, file), 'utf8');
    JSON.parse(content);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function readEnv(file) {
  try {
    const raw = await fs.readFile(path.join(rootDir, file), 'utf8');
    const values = {};
    raw.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        return;
      }
      const [key, ...rest] = trimmed.split('=');
      values[key] = rest.join('=').trim();
    });
    return values;
  } catch {
    return null;
  }
}

function validateEnv(envMaps) {
  const missing = new Set(requiredEnvKeys);
  Object.values(envMaps).forEach((map) => {
    if (map) {
      requiredEnvKeys.forEach((key) => {
        if (map[key]) {
          missing.delete(key);
        }
      });
    }
  });
  return { valid: missing.size === 0, missing: [...missing] };
}

async function checkSupabase(envMaps) {
  const envMap = envMaps['.env'] || envMaps['.env.stable'] || {};
  const url = envMap.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = envMap.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return { status: 'skipped', reason: 'Missing Supabase credentials' };
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(url, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timeout);
    const ok = response.status < 400;
    return { status: ok ? 'ok' : 'unreachable', httpStatus: response.status };
  } catch (error) {
    return { status: 'error', reason: error.message };
  }
}

async function main() {
  await ensureLogsDirectory();

  const packageStatus = await readJson('package.json');
  logCheck('package.json', packageStatus.success, packageStatus.success ? 'valid JSON' : packageStatus.error);

  const appStatus = await readJson('app.json');
  logCheck('app.json', appStatus.success, appStatus.success ? 'valid JSON' : appStatus.error);

  const envMaps = {
    '.env': await readEnv('.env'),
    '.env.stable': await readEnv('.env.stable'),
  };
  const envStatus = validateEnv(envMaps);
  logCheck('environment variables', envStatus.valid, envStatus.valid ? 'all required keys present' : `missing keys: ${envStatus.missing.join(', ')}`);

  const supabaseStatus = await checkSupabase(envMaps);
  const supabaseMessage = supabaseStatus.status === 'ok'
    ? `HEAD ${supabaseStatus.httpStatus}`
    : supabaseStatus.reason || `HTTP ${supabaseStatus.httpStatus}`;
  logCheck('Supabase connectivity', supabaseStatus.status === 'ok', supabaseMessage);

  const ports = [8081, 8082, 8083];
  const portSummary = {};
  for (const port of ports) {
    let status = 'unknown';
    if (process.platform === 'win32') {
      const netstat = spawnSync('netstat', ['-ano'], { stdio: 'pipe' });
      if (netstat.status === 0) {
        const output = netstat.stdout.toString();
        status = output.includes(`:${port}`) ? 'occupied' : 'free';
      }
    } else {
      const lsof = spawnSync('lsof', ['-ti', `:${port}`], { stdio: 'pipe' });
      if (lsof.status === 0) {
        const output = lsof.stdout.toString().trim();
        status = output.length > 0 ? 'occupied' : 'free';
      } else {
        try {
          const server = await fs.readFile('/proc/net/tcp', 'utf8');
          status = server.includes(port.toString(16).toUpperCase()) ? 'occupied' : 'free';
        } catch {
          status = 'unknown';
        }
      }
    }
    portSummary[port] = status;
  }
  logCheck('port scan', !Object.values(portSummary).includes('occupied'), JSON.stringify(portSummary));

  const payload = {
    checkedAt: new Date().toISOString(),
    packageJson: packageStatus,
    appJson: appStatus,
    env: {
      ...envStatus,
      files: Object.fromEntries(
        Object.entries(envMaps).map(([file, values]) => [file, values ? Object.keys(values) : null])
      ),
    },
    supabase: supabaseStatus,
    ports: portSummary,
    nextCheckSuggestedAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  await fs.writeFile(logPath, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`\nHealth summary written to ${path.relative(rootDir, logPath)}`);
}

main().catch((error) => {
  console.error('Health check failed:', error);
  process.exit(1);
});
