import { spawnSync } from 'node:child_process';

const baseArgs = [
  '--prefix',
  'backend',
  'install',
  '--no-audit',
  '--prefer-offline',
  '--progress=false',
];

const runInstall = (extraArgs = []) => {
  const result = spawnSync('npm', [...baseArgs, ...extraArgs], {
    stdio: 'inherit',
    env: process.env,
  });

  return result.status ?? 1;
};

const exitCode = runInstall();

if (exitCode === 0) {
  process.exit(0);
}

console.warn('\n⚠️  Primary backend install failed, retrying with --force...\n');

const forcedExitCode = runInstall(['--force']);

if (forcedExitCode !== 0) {
  process.exit(forcedExitCode);
}
