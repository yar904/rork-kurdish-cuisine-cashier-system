#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const {
  ensureLogsDir,
  checkCommonPorts,
  clearMetroCache,
  verifyEnvVariables,
  pingSupabase,
  checkFontsAndAssets,
  printReport,
  EMOJIS
} = require('./health-utils');

async function preBuildCheck() {
  console.log(`\n${EMOJIS.rocket} Starting Pre-Build Health Check...\n`);
  
  const startTime = Date.now();
  const report = {
    type: 'pre-build',
    timestamp: new Date().toISOString(),
    startTime
  };
  
  console.log(`${EMOJIS.info} Checking ports...`);
  report.ports = await checkCommonPorts();
  
  console.log(`${EMOJIS.cache} Clearing cache...`);
  report.cache = await clearMetroCache();
  
  console.log(`${EMOJIS.info} Verifying environment variables...`);
  report.env = await verifyEnvVariables();
  
  if (report.env.allPresent && process.env.EXPO_PUBLIC_SUPABASE_URL) {
    console.log(`${EMOJIS.database} Pinging Supabase...`);
    report.supabase = await pingSupabase(process.env.EXPO_PUBLIC_SUPABASE_URL);
  }
  
  console.log(`${EMOJIS.font} Checking fonts and assets...`);
  report.assets = await checkFontsAndAssets();
  
  report.duration = Date.now() - startTime;
  
  const logsDir = await ensureLogsDir();
  const reportPath = path.join(logsDir, 'build_health.json');
  
  await fs.writeFile(
    reportPath,
    JSON.stringify(report, null, 2),
    'utf8'
  );
  
  printReport(report);
  
  console.log(`${EMOJIS.info} Report saved to: ${reportPath}\n`);
  
  const hasBlockingIssues = 
    (report.env && !report.env.allPresent) ||
    (report.supabase && !report.supabase.ok);
  
  if (hasBlockingIssues) {
    console.error(`${EMOJIS.error} Blocking issues detected. Build may fail.\n`);
    process.exit(1);
  }
  
  console.log(`${EMOJIS.success} Pre-build check passed!\n`);
}

preBuildCheck().catch(err => {
  console.error(`${EMOJIS.error} Pre-build check failed:`, err);
  process.exit(1);
});
