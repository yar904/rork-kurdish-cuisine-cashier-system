#!/usr/bin/env node

/**
 * Environment Configuration Validator
 * Run this before deploying to verify all env vars are set correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Environment Configuration...\n');

const requiredVars = {
  'Root .env': [
    'EXPO_PUBLIC_RORK_API_BASE_URL',
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    'FRONTEND_URL'
  ],
  'Backend .env': [
    'NODE_ENV',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'DATABASE_URL',
    'FRONTEND_URL',
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    'EXPO_PUBLIC_API_BASE_URL'
  ]
};

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const vars = {};
  
  content.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      vars[match[1].trim()] = match[2].trim();
    }
  });
  
  return vars;
}

function validateEnvFile(filePath, requiredKeys, label) {
  console.log(`\n📄 Checking ${label}...`);
  
  const vars = parseEnvFile(filePath);
  
  if (!vars) {
    console.log(`❌ File not found: ${filePath}`);
    return false;
  }
  
  let allPresent = true;
  
  requiredKeys.forEach(key => {
    if (!vars[key] || vars[key].includes('your_') || vars[key].includes('xxxx')) {
      console.log(`❌ Missing or placeholder: ${key}`);
      allPresent = false;
    } else {
      const value = vars[key].length > 50 
        ? vars[key].substring(0, 47) + '...'
        : vars[key];
      console.log(`✅ ${key} = ${value}`);
    }
  });
  
  return allPresent;
}

function checkProductionUrls(vars) {
  console.log('\n🌐 Checking Production URLs...');
  
  const prodUrl = 'https://rork-kurdish-cuisine-cashier-system.vercel.app';
  const checks = [
    ['EXPO_PUBLIC_RORK_API_BASE_URL', prodUrl],
    ['FRONTEND_URL', prodUrl],
    ['EXPO_PUBLIC_API_BASE_URL', prodUrl]
  ];
  
  let allCorrect = true;
  
  checks.forEach(([key, expected]) => {
    if (vars[key] === expected) {
      console.log(`✅ ${key} points to production`);
    } else if (vars[key]?.includes('localhost')) {
      console.log(`⚠️  ${key} is still pointing to localhost`);
      allCorrect = false;
    } else {
      console.log(`ℹ️  ${key} = ${vars[key]}`);
    }
  });
  
  return allCorrect;
}

// Run validations
const rootEnv = parseEnvFile(path.join(__dirname, '.env'));
const backendEnv = parseEnvFile(path.join(__dirname, 'backend', '.env'));

const rootValid = validateEnvFile(
  path.join(__dirname, '.env'),
  requiredVars['Root .env'],
  'Root .env'
);

const backendValid = validateEnvFile(
  path.join(__dirname, 'backend', '.env'),
  requiredVars['Backend .env'],
  'Backend .env'
);

if (backendEnv) {
  checkProductionUrls(backendEnv);
}

console.log('\n' + '='.repeat(60));

if (rootValid && backendValid) {
  console.log('✅ All environment variables are configured correctly!');
  console.log('\n📋 Next steps:');
  console.log('1. Copy these variables to Vercel (see VERCEL_ENV_FIX_GUIDE.md)');
  console.log('2. Apply to Production, Preview, and Development');
  console.log('3. Trigger a fresh deployment');
  console.log('4. Test: curl https://rork-kurdish-cuisine-cashier-system.vercel.app/api/health');
  process.exit(0);
} else {
  console.log('❌ Some environment variables are missing or invalid!');
  console.log('\nPlease fix the issues above before deploying.');
  process.exit(1);
}
