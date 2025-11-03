#!/bin/bash

echo "🔧 Fixing installation issues..."

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

echo "✅ All dependencies installed!"
echo "🚀 Now run: bun start"
