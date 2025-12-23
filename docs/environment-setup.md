# Environment Setup Guide

## Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js**: Version 20.x or higher
- **npm**: Version 7.x or higher (comes with Node.js)
- **Git**: Latest version

## Quick Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/RoseJudd/secure-reflection-log.git
   cd secure-reflection-log
   ```

2. **Run the automated setup**
   ```bash
   node scripts/setup-dev.js
   ```

3. **Configure environment variables**
   ```bash
   cp docs/.env.template .env
   # Edit .env with your configuration
   ```

## Manual Setup

If you prefer to set up manually:

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Generate Contract Types

```bash
npm run typechain
```

### 3. Compile Contracts

```bash
npm run compile
```

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the project root with:

```env
# Frontend
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
VITE_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000

# Backend/Deployment
INFURA_API_KEY=your_infura_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key
MNEMONIC=your_wallet_mnemonic

# Network
DEFAULT_NETWORK=hardhat
DEPLOY_NETWORK=sepolia
```

### WalletConnect Setup

1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project
3. Copy the Project ID to your `.env` file

### Infura Setup

1. Go to [Infura](https://infura.io/)
2. Create a new project
3. Copy the API key to your `.env` file

## Development Workflow

### Starting Development

```bash
# Terminal 1: Start local blockchain
npx hardhat node

# Terminal 2: Deploy contracts locally
npm run deploy:local

# Terminal 3: Start frontend
npm run dev
```

### Testing

```bash
# Run all tests
npm test

# Run tests on Sepolia
npm run test:sepolia
```

### Building for Production

```bash
# Build frontend
npm run build

# Preview production build
npm run preview
```

## Troubleshooting

### Common Issues

1. **Node version errors**
   - Ensure you're using Node.js 20.x
   - Use `nvm` to manage Node versions

2. **Contract compilation fails**
   - Run `npm run clean` and try again
   - Check for missing dependencies

3. **Frontend won't start**
   - Ensure port 5173 is available
   - Check that all dependencies are installed

4. **Wallet connection issues**
   - Verify WalletConnect Project ID
   - Check network configuration

### Getting Help

- Check the [README.md](../README.md) for detailed documentation
- Review [DEPLOYMENT.md](../DEPLOYMENT.md) for deployment instructions
- Check existing issues on GitHub

## Security Notes

- Never commit `.env` files with real credentials
- Use hardware wallets for mainnet deployments
- Test thoroughly on testnets before mainnet
- Keep dependencies updated for security patches

































