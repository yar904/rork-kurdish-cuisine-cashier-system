#!/bin/bash

# ============================================
# BACKEND IMPORT PATH FIX SCRIPT
# Replaces @/backend paths with relative paths
# for Netlify Functions compatibility
# ============================================

echo "🔧 Fixing backend import paths for Netlify deployment..."

# Counter for fixed files
fixed_count=0

# Function to fix a single file
fix_file() {
  local file="$1"
  
  if grep -q "@/backend" "$file"; then
    # Replace both patterns
    sed -i "s|@/backend/trpc/create-context|../../../create-context|g" "$file"
    sed -i "s|@/backend/lib/supabase|../../../lib/supabase|g" "$file"
    
    echo "  ✅ $file"
    ((fixed_count++))
  fi
}

# Fix all route files in employees/
echo ""
echo "📁 Fixing employees routes..."
for file in backend/trpc/routes/employees/*/route.ts; do
  fix_file "$file"
done

# Fix all route files in inventory/
echo ""
echo "📁 Fixing inventory routes..."
for file in backend/trpc/routes/inventory/*/route.ts; do
  fix_file "$file"
done

# Fix all route files in reports/
echo ""
echo "📁 Fixing reports routes..."
for file in backend/trpc/routes/reports/*/route.ts; do
  fix_file "$file"
done

# Fix ratings if not done already
echo ""
echo "📁 Fixing ratings routes..."
for file in backend/trpc/routes/ratings/*/route.ts; do
  fix_file "$file"
done

# Fix service-requests if not done already
echo ""
echo "📁 Fixing service-requests routes..."
for file in backend/trpc/routes/service-requests/*/route.ts; do
  fix_file "$file"
done

# Fix suppliers if not done already
echo ""
echo "📁 Fixing suppliers routes..."
for file in backend/trpc/routes/suppliers/*/route.ts; do
  fix_file "$file"
done

echo ""
echo "✨ Complete! Fixed $fixed_count files"
echo ""
echo "🚀 Next steps:"
echo "   1. Review the changes"
echo "   2. Test locally if needed"
echo "   3. Deploy to Netlify"
