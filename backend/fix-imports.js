#!/usr/bin/env node

/**
 * Script to fix @/backend path aliases with relative imports for Netlify
 * This ensures imports work correctly in the serverless environment
 */

const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'trpc', 'routes');

// Map of file locations to their correct relative imports
const getRelativePaths = (filePath) => {
  const depth = filePath.split('/').filter(p => p && p !== 'routes').length;
  const prefix = '../'.repeat(depth + 1);
  
  return {
    createContext: `${prefix}create-context`,
    supabase: `${prefix}lib/supabase`,
  };
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Calculate relative paths based on file depth
  const relativeTo = path.relative(routesDir, path.dirname(filePath));
  const paths = getRelativePaths(relativeTo);
  
  // Replace @/backend/trpc/create-context
  if (content.includes('@/backend/trpc/create-context')) {
    content = content.replace(
      /@\/backend\/trpc\/create-context/g,
      paths.createContext
    );
    modified = true;
  }
  
  // Replace @/backend/lib/supabase
  if (content.includes('@/backend/lib/supabase')) {
    content = content.replace(
      /@\/backend\/lib\/supabase/g,
      paths.supabase
    );
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${path.relative(__dirname, filePath)}`);
    return true;
  }
  
  return false;
}

function walkDirectory(dir) {
  let fixedCount = 0;
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixedCount += walkDirectory(filePath);
    } else if (file.endsWith('.ts')) {
      if (processFile(filePath)) {
        fixedCount++;
      }
    }
  }
  
  return fixedCount;
}

console.log('🔧 Fixing import paths in backend routes...\n');
const count = walkDirectory(routesDir);
console.log(`\n✨ Fixed ${count} files`);
