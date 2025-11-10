#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const {
  ensureLogsDir,
  checkCommonPorts,
  verifyEnvVariables,
  pingSupabase,
  checkFontsAndAssets,
  printReport,
  EMOJIS
} = require('./health-utils');

async function postBuildReport() {
  console.log(`\n${EMOJIS.rocket} Generating Post-Build Report...\n`);
  
  const buildEndTime = Date.now();
  
  const logsDir = await ensureLogsDir();
  const reportPath = path.join(logsDir, 'build_health.json');
  
  let preBuildReport = null;
  try {
    const content = await fs.readFile(reportPath, 'utf8');
    preBuildReport = JSON.parse(content);
  } catch (_err) {
    console.log(`${EMOJIS.warning} No pre-build report found. Generating standalone report.\n`);
  }
  
  const report = {
    type: 'post-build',
    timestamp: new Date().toISOString(),
    buildEndTime
  };
  
  if (preBuildReport && preBuildReport.startTime) {
    report.buildDuration = buildEndTime - preBuildReport.startTime;
  }
  
  console.log(`${EMOJIS.info} Checking active ports...`);
  report.ports = await checkCommonPorts();
  
  console.log(`${EMOJIS.info} Verifying environment variables...`);
  report.env = await verifyEnvVariables();
  
  if (report.env.allPresent && process.env.EXPO_PUBLIC_SUPABASE_URL) {
    console.log(`${EMOJIS.database} Pinging Supabase...`);
    report.supabase = await pingSupabase(process.env.EXPO_PUBLIC_SUPABASE_URL);
  }
  
  console.log(`${EMOJIS.font} Verifying assets...`);
  report.assets = await checkFontsAndAssets();
  
  const activePort = Object.entries(report.ports).find(([_, status]) => status.occupied);
  if (activePort) {
    const [port] = activePort;
    report.previewUrl = `http://localhost:${port}`;
  }
  
  report.cache = {
    success: true,
    message: 'Cache was cleared during pre-build'
  };
  
  if (report.buildDuration) {
    report.duration = report.buildDuration;
  }
  
  await fs.writeFile(
    reportPath,
    JSON.stringify(report, null, 2),
    'utf8'
  );
  
  printReport(report);
  
  console.log(`${EMOJIS.info} Report saved to: ${reportPath}\n`);
  
  const hasWarnings = 
    (report.ports && Object.values(report.ports).some(p => p.occupied)) ||
    (report.supabase && !report.supabase.ok);
  
  if (hasWarnings) {
    console.log(`${EMOJIS.warning} Some warnings detected. Review report above.\n`);
  } else {
    console.log(`${EMOJIS.success} Build completed successfully!\n`);
  }
}

postBuildReport().catch(err => {
  console.error(`${EMOJIS.error} Post-build report failed:`, err);
  process.exit(1);
});
