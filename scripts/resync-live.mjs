#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

const steps = [
  {
    name: 'Fetch latest main branch',
    command: ['git', ['fetch', 'origin', 'main']],
  },
  {
    name: 'Reset local tree to origin/main',
    command: ['git', ['reset', '--hard', 'origin/main']],
  },
  {
    name: 'Remove workspace node_modules',
    command: ['rm', ['-rf', 'node_modules', 'package-lock.json']],
    windows: ['cmd', ['/c', 'rmdir /s /q node_modules & del /f /q package-lock.json']],
  },
  {
    name: 'Remove backend node_modules',
    command: ['rm', ['-rf', path.join('backend', 'node_modules'), path.join('backend', 'package-lock.json')]],
    windows: ['cmd', ['/c', 'rmdir /s /q backend\\node_modules & del /f /q backend\\package-lock.json']],
  },
  {
    name: 'Install dependencies',
    command: ['npm', ['install']],
  },
];

const fallbackCommand = ['npx', ['expo', 'start', '--web', '--tunnel']];

function resolveBinary(command) {
  if (process.platform === 'win32' && ['npm', 'npx'].includes(command)) {
    return `${command}.cmd`;
  }
  return command;
}

function run(label, [cmd, args], windowsOverride) {
  let command = resolveBinary(cmd);
  let parameters = args;

  if (process.platform === 'win32' && windowsOverride) {
    [command, parameters] = windowsOverride;
  }

  console.log(`\n🔁 ${label}`);
  const result = spawnSync(command, parameters, { stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status}`);
  }
}

async function ensureExpoCacheClear() {
  try {
    await fs.rm(path.join(projectRoot, '.expo'), { recursive: true, force: true });
    await fs.rm(path.join(projectRoot, 'dist'), { recursive: true, force: true });
  } catch (error) {
    console.warn('⚠️  Failed to clear Expo cache directories:', error.message);
  }
}

async function main() {
  for (const step of steps) {
    run(step.name, step.command, step.windows);
  }

  await ensureExpoCacheClear();

  console.log('\n🚀 Running npm run build');
  const build = spawnSync(resolveBinary('npm'), ['run', 'build'], { stdio: 'inherit' });

  if (build.status === 0) {
    console.log('\n✅ Build completed successfully.');
    return;
  }

  console.warn('\n⚠️ npm run build failed, launching Expo web tunnel instead.');
  const fallback = spawnSync(resolveBinary(fallbackCommand[0]), fallbackCommand[1], { stdio: 'inherit' });
  if (fallback.status !== 0) {
    throw new Error('Expo tunnel fallback also failed.');
  }
}

main().catch((error) => {
  console.error(`\n❌ Resync failed: ${error.message}`);
  process.exit(1);
});
