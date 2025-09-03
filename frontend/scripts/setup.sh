#!/bin/bash

# Development setup script for Complaint Management System

echo "🚀 Setting up Complaint Management System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Setup Backend
echo "📦 Setting up Backend..."
cd backend

if [ ! -f ".env" ]; then
    echo "📄 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please configure your .env file with database credentials"
fi

echo "📦 Installing backend dependencies..."
npm install

echo "🏗️  Building backend..."
npm run build

cd ..

# Setup Frontend
echo "🎨 Setting up Frontend..."
cd frontend

echo "📦 Installing frontend dependencies..."
npm install

echo "🏗️  Building frontend..."
npm run build

cd ..

echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Configure backend/.env with your database credentials"
echo "2. Start MongoDB service"
echo "3. Run 'npm run dev' in backend directory"
echo "4. Run 'npm run dev' in frontend directory"
echo ""
echo "🎯 Happy coding!"
