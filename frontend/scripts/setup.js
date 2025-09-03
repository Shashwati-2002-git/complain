#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Complaint Management System...\n');

// Check if Node.js version is compatible
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 18) {
  console.error('❌ Node.js 18+ is required. Current version:', nodeVersion);
  process.exit(1);
}

console.log('✅ Node.js version:', nodeVersion);

try {
  // Setup Backend
  console.log('\n📦 Setting up Backend...');
  
  const backendDir = path.join(__dirname, '..', 'backend');
  const envPath = path.join(backendDir, '.env');
  const envExamplePath = path.join(backendDir, '.env.example');
  
  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    console.log('📄 Creating .env file from template...');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('⚠️  Please configure your .env file with database credentials');
  }
  
  console.log('📦 Installing backend dependencies...');
  execSync('npm install', { cwd: backendDir, stdio: 'inherit' });
  
  // Setup Frontend
  console.log('\n🎨 Setting up Frontend...');
  const frontendDir = path.join(__dirname, '..', 'frontend');
  
  console.log('📦 Installing frontend dependencies...');
  execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });
  
  console.log('\n✅ Setup complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Configure backend/.env with your database credentials');
  console.log('2. Start MongoDB service');
  console.log('3. Run "npm run dev" to start both servers');
  console.log('\n🎯 Happy coding!');
  
} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}
