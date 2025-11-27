# Reflection Log Frontend

Frontend application for the Encrypted Habit-Mood Tracker built with React, Vite, RainbowKit, and FHEVM.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```env
VITE_CONTRACT_ADDRESS=0x... # Contract address after deployment
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

3. Start development server:
```bash
npm run dev
```

## TODO: Complete FHEVM Integration

The frontend UI is complete, but you need to integrate FHEVM for encryption/decryption:

### 1. Copy FHEVM Files

Copy the following files from `proof-quill-shine-main/ui/src/fhevm/`:

- `constants.ts` - SDK CDN URL
- `RelayerSDKLoader.ts` - SDK loader
- `PublicKeyStorage.ts` - Public key storage utilities
- `GenericStringStorage.ts` - Storage interface
- `internal/fhevm.ts` - FHEVM instance creator
- `internal/mock/fhevmMock.ts` - Mock implementation for local testing
- `useFhevm.tsx` - React hook for FHEVM

### 2. Create Custom Hook

Create `src/hooks/useHabitMoodTracker.tsx` similar to `useTravelCounter.tsx`:

- `addDailyRecord(mood, habitCompletion)` - Encrypt and submit
- `loadRecords()` - Load encrypted records from contract
- `decryptRecord(dayIndex)` - Decrypt a specific record
- `runAnalysis()` - Call analysis functions and decrypt results

### 3. Update Components

Update these components to use the hook:

- `HabitMoodLogger.tsx` - Replace TODO with actual contract calls
- `HabitMoodViewer.tsx` - Implement record loading and decryption
- `HabitMoodAnalysis.tsx` - Implement analysis functions

## Contract ABI

The contract ABI will be generated in `types/contracts/EncryptedHabitMoodTracker.ts` after compilation.

Key functions:
- `addDailyRecord(bytes32, bytes32, bytes, bytes)`
- `getEncryptedMood(address, uint256)`
- `getEncryptedHabitCompletion(address, uint256)`
- `getDayCount(address)`
- `getAnalysisTotals(address, uint256)`
- `getMoodHabitCorrelation(address, uint256)`
- `getStressReductionTrend(address, uint256)`

## Reference Implementation

See `proof-quill-shine-main/ui/src/` for complete examples:
- `hooks/useTravelCounter.tsx` - Contract interaction hook
- `components/JourneyLogger.tsx` - Form submission example
- `fhevm/` - Complete FHEVM integration

