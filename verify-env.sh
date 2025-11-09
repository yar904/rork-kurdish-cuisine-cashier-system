#!/bin/bash

# 🔍 Environment Variables Verification Script
# Checks if your local setup matches Vercel requirements

echo "🔍 Verifying Environment Configuration..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Check .env files exist
echo "📄 Checking environment files..."
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ ERROR: .env file not found${NC}"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✅ .env exists${NC}"
fi

if [ ! -f "backend/.env" ]; then
    echo -e "${RED}❌ ERROR: backend/.env file not found${NC}"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✅ backend/.env exists${NC}"
fi

echo ""

# Check for correct variable names in backend/.env
echo "🔑 Checking backend/.env variables..."
if [ -f "backend/.env" ]; then
    if grep -q "SUPABASE_PROJECT_URL" backend/.env; then
        echo -e "${GREEN}✅ SUPABASE_PROJECT_URL found${NC}"
    else
        echo -e "${RED}❌ ERROR: SUPABASE_PROJECT_URL not found${NC}"
        ERRORS=$((ERRORS+1))
    fi
    
    if grep -q "^SUPABASE_URL=" backend/.env; then
        echo -e "${RED}❌ ERROR: Old SUPABASE_URL found - should be SUPABASE_PROJECT_URL${NC}"
        ERRORS=$((ERRORS+1))
    else
        echo -e "${GREEN}✅ No old SUPABASE_URL variable${NC}"
    fi
    
    if grep -q "SUPABASE_ANON_KEY" backend/.env; then
        echo -e "${GREEN}✅ SUPABASE_ANON_KEY found${NC}"
    else
        echo -e "${RED}❌ ERROR: SUPABASE_ANON_KEY not found${NC}"
        ERRORS=$((ERRORS+1))
    fi
    
    if grep -q "DATABASE_URL" backend/.env; then
        echo -e "${GREEN}✅ DATABASE_URL found${NC}"
    else
        echo -e "${YELLOW}⚠️  WARNING: DATABASE_URL not found${NC}"
        WARNINGS=$((WARNINGS+1))
    fi
fi

echo ""

# Check for correct variable names in .env
echo "🔑 Checking .env variables..."
if [ -f ".env" ]; then
    if grep -q "EXPO_PUBLIC_SUPABASE_URL" .env; then
        echo -e "${GREEN}✅ EXPO_PUBLIC_SUPABASE_URL found${NC}"
    else
        echo -e "${RED}❌ ERROR: EXPO_PUBLIC_SUPABASE_URL not found${NC}"
        ERRORS=$((ERRORS+1))
    fi
    
    if grep -q "EXPO_PUBLIC_API_BASE_URL" .env; then
        echo -e "${GREEN}✅ EXPO_PUBLIC_API_BASE_URL found${NC}"
    else
        echo -e "${YELLOW}⚠️  WARNING: EXPO_PUBLIC_API_BASE_URL not found${NC}"
        WARNINGS=$((WARNINGS+1))
    fi
fi

echo ""

# Check code for SUPABASE_URL references (should only use SUPABASE_PROJECT_URL in backend)
echo "🔍 Checking code for old SUPABASE_URL references..."
if grep -r "process\.env\.SUPABASE_URL[^_]" backend/ --include="*.ts" --include="*.js" 2>/dev/null; then
    echo -e "${RED}❌ ERROR: Found process.env.SUPABASE_URL in backend code${NC}"
    echo -e "${YELLOW}   Should use process.env.SUPABASE_PROJECT_URL instead${NC}"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✅ No old SUPABASE_URL references in backend code${NC}"
fi

echo ""

# Check vercel.json
echo "📋 Checking vercel.json..."
if [ ! -f "vercel.json" ]; then
    echo -e "${RED}❌ ERROR: vercel.json not found at project root${NC}"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✅ vercel.json exists at root${NC}"
fi

echo ""

# Check api/index.ts
echo "📋 Checking API entry point..."
if [ ! -f "api/index.ts" ]; then
    echo -e "${RED}❌ ERROR: api/index.ts not found${NC}"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✅ api/index.ts exists${NC}"
fi

if [ ! -f "backend/api/index.ts" ]; then
    echo -e "${RED}❌ ERROR: backend/api/index.ts not found${NC}"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✅ backend/api/index.ts exists${NC}"
fi

echo ""
echo "════════════════════════════════════════"

# Summary
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 All checks passed! Ready for deployment.${NC}"
    echo ""
    echo "Next step: Run deployment script"
    echo "  bash DEPLOY_NOW.sh"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS warning(s) found, but no critical errors.${NC}"
    echo "You can proceed with deployment, but review warnings above."
    echo ""
    echo "Next step: Run deployment script"
    echo "  bash DEPLOY_NOW.sh"
else
    echo -e "${RED}❌ $ERRORS error(s) found. Please fix before deployment.${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}   $WARNINGS warning(s) also found.${NC}"
    fi
    echo ""
    echo "Review errors above and fix them before deploying."
    exit 1
fi

echo "════════════════════════════════════════"
