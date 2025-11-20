# Reflection Log - Encrypted Habit-Mood Tracker

A fully homomorphic encryption (FHE) based application for tracking habits and moods with complete privacy. All data remains encrypted even during analysis operations.

## Features

- 🔐 **End-to-End Encryption**: Mood (1-5) and habit completion rate (0-100%) are encrypted on-chain
- 📝 **Batch Operations**: Efficiently add multiple records in a single transaction
- 📊 **Encrypted Analysis**:
  - Correlation analysis between mood improvement and habit completion
  - Stress reduction trend tracking
  - Habit completion trend analysis with weighted calculations
  - Daily averages calculation for period-based insights
  - Timestamp range queries for record management
  - All analysis performed on encrypted data
- 🔒 **Privacy First**: No data is ever exposed in plaintext on the blockchain
- 💼 **Multi-Network Support**: Deploy on Ethereum Mainnet, Sepolia testnet, or local Hardhat
- 🎨 **Modern UI**: Responsive React frontend with Tailwind CSS and Radix UI components
- 📱 **Wallet Integration**: Rainbow Kit integration for seamless wallet connections
- ⚡ **Performance Optimized**: IR-based compilation and optimized gas usage

## Project Structure

```
reflection-log/
├── contracts/              # Solidity smart contracts
│   └── EncryptedHabitMoodTracker.sol
├── deploy/                 # Deployment scripts
│   └── 001_deploy_EncryptedHabitMoodTracker.ts
├── test/                   # Test suites
│   ├── EncryptedHabitMoodTracker.ts        # Local network tests
│   └── EncryptedHabitMoodTrackerSepolia.ts # Sepolia testnet tests
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── HabitMoodLogger.tsx      # Submit daily records (single & batch)
│   │   │   ├── HabitMoodViewer.tsx      # View and decrypt records with filtering
│   │   │   ├── HabitMoodAnalysis.tsx    # Display correlation & trend analysis
│   │   │   ├── WalletConnect.tsx        # Rainbow wallet connection
│   │   │   └── Logo.tsx                 # App logo
│   │   ├── pages/
│   │   │   ├── Index.tsx                # Main page
│   │   │   └── NotFound.tsx             # 404 page
│   │   ├── hooks/                       # Custom React hooks
│   │   ├── lib/                         # Utilities
│   │   └── fhevm/                       # FHEVM integration (TODO)
└── package.json
```

## Setup Instructions

### Prerequisites

- Node.js >= 20
- npm >= 7.0.0
- Hardhat node with FHEVM support (for local development)

### Installation

1. Install dependencies:
```bash
npm install
cd frontend && npm install
```

2. Set up environment variables:
```bash
# Create .env file in root
MNEMONIC=your_mnemonic_phrase
INFURA_API_KEY=your_infura_key
ETHERSCAN_API_KEY=your_etherscan_key

# Create .env.local in frontend/
VITE_CONTRACT_ADDRESS=0x... # Will be set after deployment
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

3. Compile contracts:
```bash
npm run compile
```

4. Run tests:
```bash
# Local network tests
npm test

# Sepolia testnet tests (requires deployment)
npm run test:sepolia
```

## Deployment

### Local Network

1. Start Hardhat node with FHEVM:
```bash
npx hardhat node
```

2. Deploy contracts:
```bash
npm run deploy:local
```

3. Update frontend `.env.local` with deployed contract address

4. Start frontend:
```bash
cd frontend && npm run dev
```

### Sepolia Testnet

1. Deploy to Sepolia:
```bash
npm run deploy:sepolia
```

2. Update frontend `.env.local` with deployed contract address and network

3. Test on Sepolia:
```bash
npm run test:sepolia
```

## Frontend Development

### TODO: Complete FHEVM Integration

The frontend structure is in place, but you need to complete the FHEVM integration:

1. Copy FHEVM files from `proof-quill-shine-main`:
   - `fhevm/constants.ts`
   - `fhevm/RelayerSDKLoader.ts`
   - `fhevm/PublicKeyStorage.ts`
   - `fhevm/GenericStringStorage.ts`
   - `fhevm/internal/fhevm.ts`
   - `fhevm/internal/mock/fhevmMock.ts`
   - `fhevm/useFhevm.tsx`

2. Create custom hook `useHabitMoodTracker.tsx` similar to `useTravelCounter.tsx`:
   - Add daily records
   - View encrypted records
   - Decrypt records
   - Get analysis results

3. Complete business components:
   - `HabitMoodLogger.tsx`: Form to submit mood and habit completion
   - `HabitMoodViewer.tsx`: Display and decrypt historical records
   - `HabitMoodAnalysis.tsx`: Show correlation analysis and trends

### Reference Implementation

See `proof-quill-shine-main` for complete FHEVM integration examples:
- `ui/src/fhevm/` - FHEVM utilities
- `ui/src/hooks/useTravelCounter.tsx` - Example contract interaction hook
- `ui/src/components/JourneyLogger.tsx` - Example form component

## Contract Functions

### Core Functions

- `addDailyRecord(encryptedMood, encryptedHabitCompletion, moodProof, habitProof)`: Add a daily record
- `getEncryptedMood(user, dayIndex)`: Get encrypted mood for a day
- `getEncryptedHabitCompletion(user, dayIndex)`: Get encrypted habit completion
- `getDayCount(user)`: Get total number of days recorded

### Analysis Functions

- `getAnalysisTotals(user, recordCount)`: Get encrypted sums for analysis
- `getMoodHabitCorrelation(user, recordCount)`: Calculate correlation data
- `getStressReductionTrend(user, recordCount)`: Calculate mood improvement trend

## Testing

The contract includes comprehensive tests covering:
- Adding daily records
- Retrieving encrypted data
- Decryption verification
- Analysis calculations
- Multi-user isolation

## Security Notes

- All mood and habit data is encrypted using FHEVM
- Only the user can decrypt their own data
- Analysis operations are performed on encrypted data
- No plaintext data is ever stored on-chain

## License

BSD-3-Clause-Clear

