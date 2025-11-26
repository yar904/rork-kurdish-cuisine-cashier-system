#!/usr/bin/env node

require("dotenv").config();
const fs = require("fs").promises;
const path = require("path");
const { ensureLogsDir, EMOJIS } = require("./health-utils");

const ROOT = process.cwd();
const REQUIRED_SUPABASE_URL = "https://opsqnzswjxzvywvqjvjv.supabase.co";
const REQUIRED_FUNCTIONS_URL = "https://opsqnzswjxzvywvqjvjv.functions.supabase.co";
const REQUIRED_TRPC_URL = `${REQUIRED_FUNCTIONS_URL}/tapse-backend/trpc`;
const CORE_DIRECTORIES = [
  { label: "Frontend App", path: "app" },
  { label: "Components", path: "components" },
  { label: "Contexts", path: "contexts" },
  { label: "Hooks", path: "hooks" },
  { label: "Backend Edge", path: "backend" },
  { label: "Supabase Functions", path: "supabase/functions" },
  { label: "API Routes", path: "api" },
  { label: "Rescue Artifacts", path: ".rescue" },
];
const FLAGGED_PATTERNS = [
  { regex: /\.bak$/i, reason: "Backup artifact" },
  { regex: /backup/i, reason: "Restore artifact" },
  { regex: /deploy/i, reason: "Deployment doc" },
  { regex: /quick/i, reason: "Quick-start doc" },
  { regex: /summary/i, reason: "Summary doc" },
  { regex: /fix/i, reason: "Fix log" },
  { regex: /^#/i, reason: "Scratch file" },
];
const SKIP_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  ".expo",
  "dist",
  "build",
  ".next",
]);
const MAX_FLAGGED_RESULTS = 60;
const MAX_SCAN_DEPTH = 5;

const redactValue = (value) => {
  if (!value) {
    return "NOT_SET";
  }
  if (value.length <= 12) {
    return value;
  }
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
};

const captureEnvSnapshot = () => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const functionsUrl = process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL;
  const trpcUrl = process.env.EXPO_PUBLIC_TRPC_URL;
  const rorkUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  const snapshot = {
    timestamp: new Date().toISOString(),
    variables: {
      EXPO_PUBLIC_SUPABASE_URL: { value: redactValue(supabaseUrl), matches: supabaseUrl === REQUIRED_SUPABASE_URL },
      EXPO_PUBLIC_SUPABASE_ANON_KEY: { value: redactValue(anonKey), present: Boolean(anonKey) },
      EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL: {
        value: redactValue(functionsUrl),
        matches: functionsUrl === REQUIRED_FUNCTIONS_URL,
      },
      EXPO_PUBLIC_TRPC_URL: {
        value: redactValue(trpcUrl),
        matches: trpcUrl === REQUIRED_TRPC_URL,
      },
      EXPO_PUBLIC_RORK_API_BASE_URL: { value: redactValue(rorkUrl), matches: rorkUrl === REQUIRED_FUNCTIONS_URL },
    },
  };
  snapshot.issues = Object.entries(snapshot.variables)
    .filter(([, meta]) => meta.matches === false || meta.present === false || meta.value === "NOT_SET")
    .map(([key]) => key);
  return snapshot;
};

const fetchWithTiming = async (url, options = {}) => {
  if (!url) {
    return { url, ok: false, skipped: true, reason: "missing url" };
  }
  const started = Date.now();
  try {
    const response = await fetch(url, options);
    const duration = Date.now() - started;
    let preview;
    try {
      preview = (await response.text()).slice(0, 140);
    } catch (error) {
      preview = error.message;
    }
    return {
      url,
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      duration,
      preview,
    };
  } catch (error) {
    return { url, ok: false, error: error.message, duration: Date.now() - started };
  }
};

const collectDirectorySnapshot = async ({ label, path: relPath }) => {
  const absPath = path.join(ROOT, relPath);
  const snapshot = { label, path: relPath, exists: false };
  try {
    const stats = await fs.stat(absPath);
    if (!stats.isDirectory()) {
      snapshot.error = "not a directory";
      return snapshot;
    }
    snapshot.exists = true;
    const entries = await fs.readdir(absPath, { withFileTypes: true });
    let directories = 0;
    let files = 0;
    let latest = stats.mtimeMs;
    for (const entry of entries) {
      const childPath = path.join(absPath, entry.name);
      const childStats = await fs.stat(childPath);
      latest = Math.max(latest, childStats.mtimeMs);
      if (entry.isDirectory()) {
        directories += 1;
      } else {
        files += 1;
      }
    }
    snapshot.directories = directories;
    snapshot.files = files;
    snapshot.lastModified = new Date(latest).toISOString();
  } catch (error) {
    snapshot.error = error.message;
  }
  return snapshot;
};

const shouldFlag = (name) => FLAGGED_PATTERNS.find(({ regex }) => regex.test(name));

const scanFlaggedArtifacts = async () => {
  const flagged = [];
  let scanned = 0;
  const walk = async (current, depth = 0) => {
    if (depth > MAX_SCAN_DEPTH || scanned > 5000) {
      return;
    }
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      if (flagged.length >= MAX_FLAGGED_RESULTS) {
        return;
      }
      const entryPath = path.join(current, entry.name);
      const relPath = path.relative(ROOT, entryPath);
      if (entry.isDirectory()) {
        if (SKIP_DIRECTORIES.has(entry.name)) {
          continue;
        }
        scanned += 1;
        await walk(entryPath, depth + 1);
      } else {
        scanned += 1;
        const pattern = shouldFlag(entry.name);
        if (pattern) {
          const stats = await fs.stat(entryPath);
          flagged.push({ path: relPath, reason: pattern.reason, bytes: stats.size });
        }
      }
    }
  };
  await walk(ROOT);
  return flagged.sort((a, b) => b.bytes - a.bytes).slice(0, MAX_FLAGGED_RESULTS);
};

const buildReport = async () => {
  const envSnapshot = captureEnvSnapshot();
  const directories = await Promise.all(CORE_DIRECTORIES.map(collectDirectorySnapshot));
  const endpointTargets = [];
  const functionsUrl = process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL || REQUIRED_FUNCTIONS_URL;
  endpointTargets.push({ name: "Supabase REST", url: `${REQUIRED_SUPABASE_URL}/rest/v1/`, headers: { apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "" } });
  endpointTargets.push({ name: "Edge Health", url: `${functionsUrl}/tapse-backend/health` });
  endpointTargets.push({ name: "tRPC Health", url: `${functionsUrl}/tapse-backend/trpc/health` });
  endpointTargets.push({ name: "Configured tRPC", url: process.env.EXPO_PUBLIC_TRPC_URL });
  const endpoints = [];
  for (const target of endpointTargets) {
    endpoints.push({ name: target.name, ...(await fetchWithTiming(target.url, target.headers ? { headers: target.headers } : undefined)) });
  }
  const flaggedArtifacts = await scanFlaggedArtifacts();
  return { generatedAt: new Date().toISOString(), env: envSnapshot, directories, endpoints, flaggedArtifacts };
};

const main = async () => {
  console.log(`\n${EMOJIS.rocket} Running Platform Reset Audit...`);
  const report = await buildReport();
  const logsDir = await ensureLogsDir();
  const reportPath = path.join(logsDir, `system-audit-${Date.now()}.json`);
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`${EMOJIS.info} Audit snapshot saved to ${reportPath}`);
  const failingEndpoints = report.endpoints.filter((endpoint) => !endpoint.ok);
  const flaggedCount = report.flaggedArtifacts.length;
  console.log(`${EMOJIS.info} Env issues: ${report.env.issues.length}`);
  console.log(`${EMOJIS.info} Endpoint failures: ${failingEndpoints.length}`);
  console.log(`${EMOJIS.info} Flagged artifacts: ${flaggedCount}`);
  if (failingEndpoints.length > 0) {
    failingEndpoints.forEach((endpoint) => {
      console.log(`${EMOJIS.error} ${endpoint.name}: ${endpoint.error || endpoint.status}`);
    });
  }
  console.log(`${EMOJIS.success} Review report to decide removals.`);
};

main().catch((error) => {
  console.error(`${EMOJIS.error} System audit failed`, error);
  process.exit(1);
});
