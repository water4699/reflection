# Deployment Guide for Reflection Log

## Prerequisites

- Node.js >= 20
- npm >= 7.0.0
- Hardhat environment with FHEVM support
- Wallet with testnet/mainnet funds

## Local Development

### 1. Start Local Hardhat Node

```bash
npx hardhat node
```

### 2. Deploy Contract Locally

```bash
npm run deploy:local
```

### 3. Start Frontend

```bash
npm run dev
```

## Sepolia Testnet Deployment

### 1. Configure Environment

Create `.env` file with:

```env
INFURA_API_KEY=your_infura_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key
MNEMONIC=your_wallet_mnemonic
```

### 2. Deploy to Sepolia

```bash
npm run deploy:sepolia
```

### 3. Verify Contract

```bash
npm run verify:sepolia
```

### 4. Check Deployment

```bash
node scripts/check-deployment.js sepolia
```

## Mainnet Deployment

### 1. Update Configuration

Modify `hardhat.config.ts` with mainnet settings and real mnemonic.

### 2. Deploy to Mainnet

```bash
npx hardhat deploy --network mainnet
```

### 3. Verify on Etherscan

```bash
npx hardhat verify --network mainnet CONTRACT_ADDRESS
```

## Frontend Configuration

### 1. Update Contract Address

Update `VITE_CONTRACT_ADDRESS` in frontend `.env.local`:

```env
VITE_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
```

### 2. Configure WalletConnect

Get project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/) and update:

```env
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```

### 3. Build and Deploy Frontend

```bash
npm run build
npm run preview
```

## Troubleshooting

### Common Issues

1. **FHEVM Not Available**: Ensure using supported Hardhat version
2. **Out of Gas**: Increase gas limit in deployment script
3. **Verification Failed**: Check constructor arguments and API keys
4. **Frontend Not Connecting**: Verify contract address and network

### Network Information

- **Localhost**: http://127.0.0.1:8545 (Chain ID: 31337)
- **Sepolia**: https://sepolia.infura.io/v3/... (Chain ID: 11155111)
- **Mainnet**: https://mainnet.infura.io/v3/... (Chain ID: 1)

### Contract Addresses

Keep track of deployed contract addresses:

```json
{
  "localhost": "0x...",
  "sepolia": "0x...",
  "mainnet": "0x..."
}
```

## Security Considerations

- Never commit private keys or mnemonics
- Use hardware wallets for mainnet deployments
- Test thoroughly on testnets before mainnet
- Verify all contract interactions

































