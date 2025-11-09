const { spawnSync } = require('node:child_process');

const baseArgs = [
  '--prefix',
  'backend',
  'install',
  '--no-audit',
  '--prefer-offline',
  '--progress=false',
];

const registries = [
  {
    label: 'npm registry',
    args: [],
  },
  {
    label: 'npm community mirror',
    args: ['--registry', process.env.NPM_FALLBACK_REGISTRY || 'https://registry.npmmirror.com/'],
  },
];

const runInstall = (extraArgs = []) =>
  spawnSync('npm', [...baseArgs, ...extraArgs], {
    stdio: 'inherit',
    env: process.env,
  }).status ?? 1;

for (const registry of registries) {
  const result = runInstall(registry.args);
  if (result === 0) {
    process.exit(0);
  }

  console.warn(`\n⚠️  Backend install via ${registry.label} failed (exit ${result}).`);
  console.warn('   Retrying with --force...\n');

  const forcedResult = runInstall([...registry.args, '--force']);
  if (forcedResult === 0) {
    process.exit(0);
  }

  console.warn(`❌  Forced install via ${registry.label} also failed (exit ${forcedResult}).`);
}

console.error('\nBackend dependencies could not be installed from any configured registry.');
process.exit(1);
