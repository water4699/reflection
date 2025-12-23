const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function setupDevelopment() {
  console.log('🚀 Setting up Reflection Log development environment...\n');

  try {
    // Check if we're in the right directory
    if (!fs.existsSync('package.json')) {
      console.error('❌ Error: package.json not found. Please run from project root.');
      process.exit(1);
    }

    // Install root dependencies
    console.log('📦 Installing root dependencies...');
    execSync('npm install', { stdio: 'inherit' });

    // Install frontend dependencies
    if (fs.existsSync('frontend')) {
      console.log('📦 Installing frontend dependencies...');
      execSync('cd frontend && npm install', { stdio: 'inherit' });
    }

    // Generate typechain types
    console.log('🔧 Generating contract types...');
    execSync('npm run typechain', { stdio: 'inherit' });

    // Compile contracts
    console.log('⚡ Compiling smart contracts...');
    execSync('npm run compile', { stdio: 'inherit' });

    // Run linting
    console.log('🔍 Running linter...');
    try {
      execSync('npm run lint', { stdio: 'inherit' });
    } catch (error) {
      console.warn('⚠️  Linting failed, but setup will continue');
    }

    // Check git status
    console.log('📊 Checking git status...');
    try {
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
      if (gitStatus.trim()) {
        console.log('📝 Uncommitted changes found');
      } else {
        console.log('✅ Working directory is clean');
      }
    } catch (error) {
      console.log('ℹ️  Git not initialized or not available');
    }

    console.log('\n✅ Development environment setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Copy config.example.json to config.json and configure your settings');
    console.log('2. Set up environment variables for wallet connection');
    console.log('3. Start local Hardhat node: npx hardhat node');
    console.log('4. Deploy contracts: npm run deploy:local');
    console.log('5. Start frontend: npm run dev');
    console.log('\n🔗 Useful commands:');
    console.log('- npm run compile    # Compile contracts');
    console.log('- npm run test       # Run tests');
    console.log('- npm run lint       # Run linter');
    console.log('- npm run type-check # TypeScript type checking');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  setupDevelopment();
}

module.exports = { setupDevelopment };

































