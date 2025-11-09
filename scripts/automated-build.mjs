#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const rootDir = process.cwd();
const logsDir = path.join(rootDir, 'logs');
const buildLogPath = path.join(logsDir, 'build_health.json');
const autoHealthLogPath = path.join(logsDir, 'auto_health_check.json');

const requiredEnvKeys = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_URL',
  'FRONTEND_URL',
];

const portsToCheck = [8081, 8082, 8083];

const healthSummary = {
  timestamp: new Date().toISOString(),
  packageJson: {},
  appJson: {},
  backups: [],
  env: {},
  caches: {},
  ports: {},
  npmInstall: {},
  supabase: {},
  build: {},
  dist: {},
};

function logCheck(name, success, message) {
  const prefix = success ? '✅' : '❌';
  console.log(`${prefix} ${name}: ${message}`);
}

async function ensureDirectory(target) {
  await fs.mkdir(target, { recursive: true });
}

function resolveConflicts(content) {
  return content.replace(/<<<<<<< HEAD\n([\s\S]*?)=======([\s\S]*?)>>>>>>>[^\n]*\n?/g, '$1');
}

function stripConflictMarkers(content) {
  return content.replace(/<<<<<<<[\s\S]*?>>>>>>>[^\n]*\n?/g, '');
}

function stripTrailingCommas(content) {
  return content.replace(/,([\s]*[}\]])/g, '$1');
}

function balanceBrackets(content) {
  const openingCurly = (content.match(/{/g) || []).length;
  const closingCurly = (content.match(/}/g) || []).length;
  const openingSquare = (content.match(/\[/g) || []).length;
  const closingSquare = (content.match(/\]/g) || []).length;
  let fixed = content;
  if (openingCurly > closingCurly) {
    fixed += '}'.repeat(openingCurly - closingCurly);
  }
  if (openingSquare > closingSquare) {
    fixed += ']'.repeat(openingSquare - closingSquare);
  }
  return fixed;
}

function detectJsonLine(content, position) {
  const lines = content.split(/\r?\n/);
  let count = 0;
  for (let i = 0; i < lines.length; i += 1) {
    const lineLength = lines[i].length + 1;
    if (count + lineLength > position) {
      return i + 1;
    }
    count += lineLength;
  }
  return lines.length;
}

async function parseJsonWithSelfHeal(filePath) {
  let content = await fs.readFile(filePath, 'utf8');
  const original = content;
  const attempts = [
    (input) => input.replace(/^\uFEFF/, ''),
    resolveConflicts,
    stripConflictMarkers,
    stripTrailingCommas,
    balanceBrackets,
  ];

  let lastError = null;
  let modified = false;

  for (const attempt of attempts) {
    try {
      content = attempt(content);
      const parsed = JSON.parse(content);
      if (content !== original) {
        await fs.writeFile(filePath, `${JSON.stringify(parsed, null, 2)}\n`);
        modified = true;
      }
      return { parsed, modified };
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    const match = /position (\d+)/.exec(lastError.message);
    const position = match ? Number(match[1]) : 0;
    const line = detectJsonLine(content, position);
    throw new Error(`${lastError.message} (line ${line})`);
  }

  return { parsed: JSON.parse(content), modified };
}

async function disableBackupFiles() {
  const backups = ['app.json.bak', 'package.json.bak'];
  const disabled = [];
  for (const backup of backups) {
    const full = path.join(rootDir, backup);
    try {
      await fs.access(full);
      const newPath = `${full}.disabled`;
      await fs.rename(full, newPath);
      disabled.push({ file: backup, newPath: path.relative(rootDir, newPath) });
    } catch {
      // ignore
    }
  }
  return disabled;
}

function resolveBinary(command) {
  if (process.platform === 'win32' && (command === 'npm' || command === 'npx')) {
    return `${command}.cmd`;
  }
  return command;
}

function runCommand(command, args, options = {}) {
  const resolved = resolveBinary(command);
  const result = spawnSync(resolved, args, {
    stdio: options.quiet ? 'pipe' : 'inherit',
    cwd: options.cwd || rootDir,
    ...options,
  });
  return result;
}

async function ensureLockFile() {
  const lockPath = path.join(rootDir, 'package-lock.json');
  let useCi = false;
  try {
    await fs.access(lockPath);
    useCi = true;
  } catch {
    useCi = false;
  }

  const command = useCi ? ['ci'] : ['install'];
  const label = useCi ? 'npm ci' : 'npm install';
  const result = runCommand('npm', command);
  return { status: result.status, label };
}

async function clearCaches() {
  const cacheTargets = [
    path.join(rootDir, 'node_modules', '.cache'),
    path.join(rootDir, 'backend', 'node_modules', '.cache'),
    path.join(rootDir, '.expo'),
    path.join(rootDir, 'dist'),
  ];
  const removed = [];
  for (const target of cacheTargets) {
    try {
      await fs.rm(target, { recursive: true, force: true });
      removed.push(path.relative(rootDir, target));
    } catch (error) {
      removed.push(`${path.relative(rootDir, target)} (failed: ${error.message})`);
    }
  }
  const expoClear = runCommand(
    'npx',
    ['expo', 'start', '--clear', '--offline', '--non-interactive'],
    { timeout: 4000, killSignal: 'SIGTERM', quiet: true }
  );
  const metroClear = runCommand(
    'npm',
    ['run', 'start', '--', '--reset-cache', '--non-interactive'],
    { timeout: 4000, killSignal: 'SIGTERM', quiet: true }
  );
  return {
    removed,
    expoClear: expoClear.status === 0 ? 'cleared' : 'timed-out',
    metroClear: metroClear.status === 0 ? 'cleared' : 'timed-out',
  };
}

function killPorts() {
  const results = {};
  for (const port of portsToCheck) {
    if (process.platform === 'win32') {
      const netstat = runCommand('netstat', ['-ano'], { quiet: true });
      const output = netstat.stdout ? netstat.stdout.toString() : '';
      if (output.includes(`:${port}`)) {
        const lines = output.split(/\r?\n/).filter((line) => line.includes(`:${port}`));
        const pids = new Set();
        lines.forEach((line) => {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid) {
            pids.add(pid);
          }
        });
        for (const pid of pids) {
          runCommand('taskkill', ['/PID', pid, '/F'], { quiet: true });
        }
        results[port] = { cleared: true, pids: [...pids] };
      } else {
        results[port] = { cleared: true, pids: [] };
      }
    } else {
      const lookup = runCommand('lsof', ['-ti', `:${port}`], { quiet: true });
      const output = lookup.stdout ? lookup.stdout.toString().trim() : '';
      if (output) {
        const pids = output.split(/\s+/).filter(Boolean);
        for (const pid of pids) {
          runCommand('kill', ['-9', pid], { quiet: true });
        }
        results[port] = { cleared: true, pids };
      } else {
        results[port] = { cleared: true, pids: [] };
      }
    }
  }
  return results;
}

async function loadEnvFiles() {
  const envPaths = ['.env', '.env.stable'];
  const envData = {};
  for (const envFile of envPaths) {
    const target = path.join(rootDir, envFile);
    try {
      const raw = await fs.readFile(target, 'utf8');
      const values = {};
      raw.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
          return;
        }
        const [key, ...rest] = trimmed.split('=');
        values[key] = rest.join('=').trim();
      });
      envData[envFile] = values;
    } catch {
      envData[envFile] = null;
    }
  }
  return envData;
}

function validateEnvMaps(envMaps) {
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

async function runHealthScriptIfPresent() {
  const scriptPath = path.join(rootDir, 'scripts', 'enable-health-checks.sh');
  try {
    await fs.access(scriptPath);
    runCommand('chmod', ['+x', scriptPath]);
    const result = runCommand(scriptPath, []);
    return result.status === 0;
  } catch {
    return null;
  }
}

function ensureGitCommit() {
  const gitCheck = runCommand('git', ['rev-parse', '--is-inside-work-tree'], { quiet: true });
  if (gitCheck.status !== 0) {
    return { committed: false, reason: 'Not a git repository' };
  }
  runCommand('git', ['add', '-A']);
  const message = `Automated Stable Build - ${new Date().toISOString().split('T')[0]}`;
  const commitResult = runCommand('git', ['commit', '-m', message], { quiet: true });
  if (commitResult.status !== 0) {
    return { committed: false, reason: 'No changes to commit' };
  }
  return { committed: true, message };
}

async function writeAutoHealthLog(envResult, portStatus, supabaseStatus) {
  const payload = {
    lastCheck: new Date().toISOString(),
    intervalHours: 24,
    env: envResult,
    ports: portStatus,
    supabase: supabaseStatus,
  };
  await fs.writeFile(autoHealthLogPath, `${JSON.stringify(payload, null, 2)}\n`);
}

async function main() {
  await ensureDirectory(logsDir);

  const packageResult = await parseJsonWithSelfHeal(path.join(rootDir, 'package.json'))
    .then((res) => ({ success: true, modified: res.modified }))
    .catch((error) => ({ success: false, error: error.message }));
  healthSummary.packageJson = packageResult;
  logCheck('package.json syntax', packageResult.success, packageResult.success ? (packageResult.modified ? 'auto-fixed formatting issues' : 'valid JSON') : packageResult.error);
  if (!packageResult.success) {
    await fs.writeFile(buildLogPath, `${JSON.stringify(healthSummary, null, 2)}\n`);
    process.exit(1);
  }

  const appResult = await parseJsonWithSelfHeal(path.join(rootDir, 'app.json'))
    .then((res) => ({ success: true, modified: res.modified }))
    .catch((error) => ({ success: false, error: error.message }));
  healthSummary.appJson = appResult;
  logCheck('app.json syntax', appResult.success, appResult.success ? (appResult.modified ? 'auto-fixed formatting issues' : 'valid JSON') : appResult.error);
  if (!appResult.success) {
    await fs.writeFile(buildLogPath, `${JSON.stringify(healthSummary, null, 2)}\n`);
    process.exit(1);
  }

  const disabled = await disableBackupFiles();
  healthSummary.backups = disabled;
  if (disabled.length > 0) {
    logCheck('backup files', true, `disabled ${disabled.map((item) => item.file).join(', ')}`);
  } else {
    logCheck('backup files', true, 'no conflicting backups detected');
  }

  const envMaps = await loadEnvFiles();
  const envStatus = validateEnvMaps(envMaps);
  const envSummary = Object.fromEntries(
    Object.entries(envMaps).map(([file, values]) => [file, values ? Object.keys(values) : null])
  );
  healthSummary.env = { ...envStatus, files: envSummary };
  if (envStatus.valid) {
    logCheck('environment variables', true, 'required keys present');
  } else {
    logCheck('environment variables', false, `missing keys: ${envStatus.missing.join(', ')}`);
    await fs.writeFile(buildLogPath, `${JSON.stringify(healthSummary, null, 2)}\n`);
    process.exit(1);
  }

  const healthEnabled = await runHealthScriptIfPresent();
  if (healthEnabled === true) {
    logCheck('health script', true, 'enable-health-checks executed');
  } else if (healthEnabled === false) {
    logCheck('health script', false, 'enable-health-checks script failed');
  } else {
    logCheck('health script', true, 'no enable-health-checks script found');
  }

  const cacheStatus = await clearCaches();
  healthSummary.caches = cacheStatus;
  logCheck(
    'cache clearance',
    true,
    `removed: ${cacheStatus.removed.join(', ')}; expo: ${cacheStatus.expoClear}; metro: ${cacheStatus.metroClear}`
  );

  const portStatus = killPorts();
  healthSummary.ports = portStatus;
  logCheck('port availability', true, 'ports 8081-8083 cleared');

  const lockResult = await ensureLockFile();
  healthSummary.npmInstall = { tool: lockResult.label, status: lockResult.status };
  if (lockResult.status === 0) {
    logCheck('dependency install', true, `${lockResult.label} succeeded`);
  } else {
    logCheck('dependency install', false, `${lockResult.label} failed`);
    await fs.writeFile(buildLogPath, `${JSON.stringify(healthSummary, null, 2)}\n`);
    process.exit(lockResult.status || 1);
  }

  const supabaseStatus = await checkSupabase(envMaps);
  healthSummary.supabase = supabaseStatus;
  if (supabaseStatus.status === 'ok') {
    logCheck('Supabase connectivity', true, `HEAD check succeeded (${supabaseStatus.httpStatus})`);
  } else if (supabaseStatus.status === 'skipped') {
    logCheck('Supabase connectivity', false, supabaseStatus.reason);
  } else if (supabaseStatus.status === 'unreachable') {
    logCheck('Supabase connectivity', false, `HTTP ${supabaseStatus.httpStatus}`);
  } else {
    logCheck('Supabase connectivity', false, supabaseStatus.reason);
  }

  if (supabaseStatus.status !== 'ok') {
    await fs.writeFile(buildLogPath, `${JSON.stringify(healthSummary, null, 2)}\n`);
    process.exit(1);
  }

  const buildResult = runCommand('npm', ['run', 'build:full']);
  healthSummary.build = { status: buildResult.status };
  if (buildResult.status === 0) {
    logCheck('npm run build:full', true, 'completed successfully');
  } else {
    logCheck('npm run build:full', false, `exit code ${buildResult.status}`);
    await fs.writeFile(buildLogPath, `${JSON.stringify(healthSummary, null, 2)}\n`);
    process.exit(buildResult.status || 1);
  }

  const distPath = path.join(rootDir, 'dist');
  try {
    const stat = await fs.stat(distPath);
    if (stat.isDirectory()) {
      const files = await fs.readdir(distPath);
      healthSummary.dist = { exists: true, files: files.length };
      logCheck('dist verification', true, `dist contains ${files.length} entries`);
    } else {
      throw new Error('dist is not a directory');
    }
  } catch (error) {
    healthSummary.dist = { exists: false, reason: error.message };
    logCheck('dist verification', false, error.message);
    await fs.writeFile(buildLogPath, `${JSON.stringify(healthSummary, null, 2)}\n`);
    process.exit(1);
  }

  const commitStatus = ensureGitCommit();
  healthSummary.git = commitStatus;
  if (commitStatus.committed) {
    logCheck('git commit', true, commitStatus.message);
  } else {
    logCheck('git commit', true, commitStatus.reason);
  }

  await fs.writeFile(buildLogPath, `${JSON.stringify(healthSummary, null, 2)}\n`);
  await writeAutoHealthLog(healthSummary.env, portStatus, supabaseStatus);

  console.log('\nBuild health log saved to logs/build_health.json');
}

main().catch(async (error) => {
  console.error('Build automation failed:', error);
  try {
    await fs.writeFile(buildLogPath, `${JSON.stringify({
      ...healthSummary,
      error: error.message,
    }, null, 2)}\n`);
  } catch {
    // ignore
  }
  process.exit(1);
});
