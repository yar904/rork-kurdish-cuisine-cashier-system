const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

const EMOJIS = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  rocket: '🚀',
  clock: '⏱️',
  server: '🌐',
  database: '🗄️',
  cache: '🧹',
  port: '🔌',
  font: '🔤',
  package: '📦'
};

async function ensureLogsDir() {
  const logsDir = path.join(process.cwd(), 'logs');
  try {
    await fs.mkdir(logsDir, { recursive: true });
  } catch (err) {
    console.error('Failed to create logs directory:', err);
  }
  return logsDir;
}

async function checkPort(port) {
  try {
    const isWindows = process.platform === 'win32';
    let cmd;
    
    if (isWindows) {
      cmd = `netstat -ano | findstr :${port}`;
    } else {
      cmd = `lsof -i :${port} -t`;
    }
    
    const { stdout } = await execAsync(cmd);
    
    if (stdout.trim()) {
      const pids = isWindows 
        ? stdout.trim().split('\n').map(line => line.trim().split(/\s+/).pop())
        : stdout.trim().split('\n');
      
      return {
        occupied: true,
        pids: [...new Set(pids)],
        killCommand: isWindows 
          ? `taskkill /PID ${pids[0]} /F`
          : `kill -9 ${pids[0]}`
      };
    }
    
    return { occupied: false };
  } catch (_err) {
    return { occupied: false };
  }
}

async function checkCommonPorts() {
  const portsToCheck = [8081, 8082, 19000, 19001, 19002, 3000];
  const results = {};
  
  for (const port of portsToCheck) {
    results[port] = await checkPort(port);
  }
  
  return results;
}

async function clearMetroCache() {
  try {
    
    const isWindows = process.platform === 'win32';
    if (isWindows) {
      await execAsync('rd /s /q .expo 2>nul || echo Cache cleared');
      await execAsync('rd /s /q node_modules\\.cache 2>nul || echo Cache cleared');
    } else {
      await execAsync('rm -rf .expo node_modules/.cache 2>/dev/null || true');
    }
    
    return { success: true, message: 'Cache cleared successfully' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

async function pingSupabase(url) {
  try {
    const startTime = Date.now();
    const response = await fetch(url + '/rest/v1/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const duration = Date.now() - startTime;
    
    return {
      ok: response.ok,
      status: response.status,
      duration: `${duration}ms`
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err.message
    };
  }
}

async function verifyEnvVariables() {
  const requiredVars = [
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    'EXPO_PUBLIC_RORK_API_BASE_URL'
  ];
  
  const results = {};
  const missing = [];
  
  const EXPO_PUBLIC_SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const EXPO_PUBLIC_SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const EXPO_PUBLIC_RORK_API_BASE_URL = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  
  const values = {
    EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY,
    EXPO_PUBLIC_RORK_API_BASE_URL
  };
  
  for (const varName of requiredVars) {
    const value = values[varName];
    results[varName] = {
      exists: !!value,
      value: value ? (value.substring(0, 20) + '...') : 'NOT SET'
    };
    
    if (!value) {
      missing.push(varName);
    }
  }
  
  return {
    allPresent: missing.length === 0,
    results,
    missing
  };
}

async function checkFontsAndAssets() {
  const assetsDir = path.join(process.cwd(), 'assets');
  const fonts = [];
  const images = [];
  
  try {
    const items = await fs.readdir(assetsDir, { withFileTypes: true, recursive: true });
    
    for (const item of items) {
      if (item.isFile()) {
        const ext = path.extname(item.name).toLowerCase();
        if (['.ttf', '.otf', '.woff', '.woff2'].includes(ext)) {
          fonts.push(item.name);
        } else if (['.png', '.jpg', '.jpeg', '.svg', '.webp'].includes(ext)) {
          images.push(item.name);
        }
      }
    }
    
    return {
      fonts: fonts.slice(0, 5),
      images: images.slice(0, 5),
      totalFonts: fonts.length,
      totalImages: images.length
    };
  } catch (err) {
    return {
      fonts: [],
      images: [],
      totalFonts: 0,
      totalImages: 0,
      error: err.message
    };
  }
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
}

function printReport(report) {
  console.log('\n' + '='.repeat(60));
  console.log(`${EMOJIS.rocket} BUILD HEALTH REPORT ${EMOJIS.rocket}`);
  console.log('='.repeat(60));
  
  console.log(`\n${EMOJIS.clock} Timestamp: ${report.timestamp}`);
  if (report.duration) {
    console.log(`${EMOJIS.clock} Duration: ${formatDuration(report.duration)}`);
  }
  
  if (report.ports) {
    console.log(`\n${EMOJIS.port} PORT STATUS:`);
    Object.entries(report.ports).forEach(([port, status]) => {
      if (status.occupied) {
        console.log(`  ${EMOJIS.error} Port ${port} is occupied (PID: ${status.pids.join(', ')})`);
        console.log(`    Fix: ${status.killCommand}`);
      } else {
        console.log(`  ${EMOJIS.success} Port ${port} is available`);
      }
    });
  }
  
  if (report.cache) {
    console.log(`\n${EMOJIS.cache} CACHE STATUS:`);
    if (report.cache.success) {
      console.log(`  ${EMOJIS.success} ${report.cache.message}`);
    } else {
      console.log(`  ${EMOJIS.error} ${report.cache.message}`);
    }
  }
  
  if (report.env) {
    console.log(`\n${EMOJIS.info} ENVIRONMENT VARIABLES:`);
    if (report.env.allPresent) {
      console.log(`  ${EMOJIS.success} All required variables present`);
    } else {
      console.log(`  ${EMOJIS.error} Missing variables: ${report.env.missing.join(', ')}`);
    }
  }
  
  if (report.supabase) {
    console.log(`\n${EMOJIS.database} SUPABASE CONNECTION:`);
    if (report.supabase.ok) {
      console.log(`  ${EMOJIS.success} Connected (${report.supabase.status}) - ${report.supabase.duration}`);
    } else {
      console.log(`  ${EMOJIS.error} Failed (${report.supabase.status || 'Network Error'})`);
      if (report.supabase.error) {
        console.log(`    Error: ${report.supabase.error}`);
      }
    }
  }
  
  if (report.assets) {
    console.log(`\n${EMOJIS.font} ASSETS:`);
    console.log(`  ${EMOJIS.success} Fonts: ${report.assets.totalFonts} loaded`);
    if (report.assets.fonts.length > 0) {
      console.log(`    Top fonts: ${report.assets.fonts.join(', ')}`);
    }
    console.log(`  ${EMOJIS.success} Images: ${report.assets.totalImages} loaded`);
    if (report.assets.images.length > 0) {
      console.log(`    Top images: ${report.assets.images.join(', ')}`);
    }
  }
  
  if (report.previewUrl) {
    console.log(`\n${EMOJIS.server} Preview URL: ${report.previewUrl}`);
  }
  
  console.log('\n' + '='.repeat(60));
  
  const hasErrors = 
    (report.ports && Object.values(report.ports).some(p => p.occupied)) ||
    (report.cache && !report.cache.success) ||
    (report.env && !report.env.allPresent) ||
    (report.supabase && !report.supabase.ok);
  
  if (hasErrors) {
    console.log(`${EMOJIS.warning} Some issues detected. Review above for fixes.`);
  } else {
    console.log(`${EMOJIS.success} All systems healthy!`);
  }
  
  console.log('='.repeat(60) + '\n');
}

module.exports = {
  ensureLogsDir,
  checkPort,
  checkCommonPorts,
  clearMetroCache,
  pingSupabase,
  verifyEnvVariables,
  checkFontsAndAssets,
  formatDuration,
  printReport,
  EMOJIS
};
