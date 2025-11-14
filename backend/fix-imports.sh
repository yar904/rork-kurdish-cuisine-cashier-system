#!/bin/bash

# Fix all @/backend imports to use relative paths for Netlify compatibility

echo "🔧 Fixing backend import paths for Netlify..."

# Find all .ts files in routes directory
find backend/trpc/routes -name "*.ts" -type f | while read file; do
  # Calculate the depth (how many levels deep from routes/)
  depth=$(echo "$file" | sed 's|backend/trpc/routes/||' | tr '/' '\n' | wc -l)
  depth=$((depth - 1))
  
  # Build the relative path prefix (../../ for each level)
  prefix=""
  for ((i=0; i<depth+1; i++)); do
    prefix="${prefix}../"
  done
  
  # Check if file has @/backend imports
  if grep -q "@/backend" "$file"; then
    # Replace @/backend/trpc/create-context with relative path
    sed -i "s|@/backend/trpc/create-context|${prefix}create-context|g" "$file"
    
    # Replace @/backend/lib/supabase with relative path  
    sed -i "s|@/backend/lib/supabase|${prefix}lib/supabase|g" "$file"
    
    echo "✅ Fixed: $file"
  fi
done

echo "✨ Import path fixes complete!"
