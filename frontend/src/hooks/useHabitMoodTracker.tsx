import { useCallback, useEffect, useState } from "react";
import { useAccount, useChainId, useWalletClient } from "wagmi";
import { ethers } from "ethers";
import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "./useInMemoryStorage";
import { useDecryptionCache } from "./useDecryptionCache";
import { FhevmType } from "@fhevm/hardhat-plugin";

// Contract ABI - will be replaced with generated types after compilation
// Note: FHE encrypted values return as bytes32 handles in the ABI
const EncryptedHabitMoodTrackerABI = [
  "function addDailyRecord(bytes32 encryptedMood, bytes32 encryptedHabitCompletion, bytes calldata moodProof, bytes calldata habitProof) external",
  "function batchAddDailyRecords(bytes32[] encryptedMoods, bytes32[] encryptedHabits, bytes[] moodProofs, bytes[] habitProofs) external",
  "function getEncryptedMood(address user, uint256 dayIndex) external view returns (bytes32)",
  "function getEncryptedHabitCompletion(address user, uint256 dayIndex) external view returns (bytes32)",
  "function getDayCount(address user) external view returns (uint256)",
  "function getRecordTimestamp(address user, uint256 dayIndex) external view returns (uint256)",
  "function recordExists(address user, uint256 dayIndex) external view returns (bool)",
  "function getAnalysisTotals(address user, uint256 recordCount) external returns (bytes32 encryptedTotalMood, bytes32 encryptedTotalHabits)",
  "function getMoodHabitCorrelation(address user, uint256 recordCount) external returns (bytes32 encryptedMoodHabitProduct, bytes32 encryptedHabitSquared)",
  "function getStressReductionTrend(address user, uint256 recordCount) external returns (bytes32 encryptedRecentMoodAverage, bytes32 encryptedEarlierMoodAverage)",
  "function getRecordTimestampRange(address user) external view returns (uint256 earliestTimestamp, uint256 latestTimestamp)",
  "function getDailyAverages(address user, uint256 days) external returns (bytes32 encryptedAverageMood, bytes32 encryptedAverageHabits)",
  "event RecordAdded(address indexed user, uint256 dayIndex, uint256 timestamp)",
  "event AnalysisPerformed(address indexed user, uint256 analysisType)",
];

interface DailyRecord {
  dayIndex: number;
  mood: number | null;
  habitCompletion: number | null;
  timestamp: number;
  encryptedMood: string | null;
  encryptedHabitCompletion: string | null;
}

interface AnalysisResult {
  totalMood: number | null;
  totalHabits: number | null;
  moodHabitProduct: number | null;
  habitSquared: number | null;
  recentMoodSum: number | null;
  earlierMoodSum: number | null;
}

interface UseHabitMoodTrackerState {
  contractAddress: string | undefined;
  dayCount: number;
  records: DailyRecord[];
  analysis: AnalysisResult | null;
  timestampRange: { earliest: number; latest: number } | null;
  isLoading: boolean;
  message: string | undefined;
  addDailyRecord: (mood: number, habitCompletion: number) => Promise<void>;
  batchAddDailyRecords: (records: Array<{ mood: number; habitCompletion: number }>) => Promise<void>;
  loadRecords: () => Promise<void>;
  getTimestampRange: () => Promise<void>;
  runDailyAverages: (days: number) => Promise<void>;
  decryptRecord: (dayIndex: number) => Promise<void>;
  runAnalysis: (recordCount: number) => Promise<void>;
  clearDecryptionCache: () => void;
  getCacheStats: () => { totalRecords: number; expiredRecords: number };
}

export function useHabitMoodTracker(contractAddress: string | undefined): UseHabitMoodTrackerState {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    storeDecryption,
    getCachedDecryption,
    isDecrypted,
    clearUserCache,
    getCacheStats
  } = useDecryptionCache();

  // Enhanced validation for contract address and wallet connection

  const [dayCount, setDayCount] = useState<number>(0);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [ethersSigner, setEthersSigner] = useState<ethers.JsonRpcSigner | undefined>(undefined);
  const [ethersProvider, setEthersProvider] = useState<ethers.JsonRpcProvider | undefined>(undefined);

  // Get EIP1193 provider
  const eip1193Provider = useCallback(() => {
    if (chainId === 31337) {
      return "http://localhost:8545";
    }
    if (walletClient?.transport) {
      const transport = walletClient.transport as any;
      if (transport.value && typeof transport.value.request === "function") {
        return transport.value;
      }
      if (typeof transport.request === "function") {
        return transport;
      }
    }
    if (typeof window !== "undefined" && (window as any).ethereum) {
      return (window as any).ethereum;
    }
    return undefined;
  }, [chainId, walletClient]);

  // Initialize FHEVM
  const { instance: fhevmInstance, status: fhevmStatus } = useFhevm({
    provider: eip1193Provider(),
    chainId,
    initialMockChains: { 31337: "http://localhost:8545" },
    enabled: isConnected && !!contractAddress,
  });

  // Convert walletClient to ethers signer
  useEffect(() => {
    if (!walletClient || !chainId) {
      setEthersSigner(undefined);
      setEthersProvider(undefined);
      return;
    }

    const setupEthers = async () => {
      try {
        const provider = new ethers.BrowserProvider(walletClient as any);
        const signer = await provider.getSigner();
        setEthersProvider(provider as any);
        setEthersSigner(signer);
      } catch (error) {
        console.error("Error setting up ethers:", error);
        setEthersSigner(undefined);
        setEthersProvider(undefined);
      }
    };

    setupEthers();
  }, [walletClient, chainId]);

  const addDailyRecord = useCallback(
    async (mood: number, habitCompletion: number) => {
      if (!contractAddress || !ethersSigner || !fhevmInstance || !address || !ethersProvider) {
        const error = new Error("Missing requirements. Please ensure wallet is connected and contract is deployed.");
        setMessage(error.message);
        throw error;
      }

      if (mood < 1 || mood > 5) {
        throw new Error("Mood must be between 1 and 5");
      }

      if (habitCompletion < 0 || habitCompletion > 100) {
        throw new Error("Habit completion must be between 0 and 100");
      }

      try {
        setIsLoading(true);
        setMessage("Encrypting data...");

        // Encrypt mood and habit completion
        const encryptedMoodInput = fhevmInstance.createEncryptedInput(
          contractAddress as `0x${string}`,
          address as `0x${string}`
        );
        encryptedMoodInput.add32(mood);
        const encryptedMood = await encryptedMoodInput.encrypt();

        const encryptedHabitInput = fhevmInstance.createEncryptedInput(
          contractAddress as `0x${string}`,
          address as `0x${string}`
        );
        encryptedHabitInput.add32(habitCompletion);
        const encryptedHabit = await encryptedHabitInput.encrypt();

        setMessage("Submitting to blockchain...");

        const contract = new ethers.Contract(contractAddress, EncryptedHabitMoodTrackerABI, ethersSigner);

        const tx = await contract.addDailyRecord(
          encryptedMood.handles[0],
          encryptedHabit.handles[0],
          encryptedMood.inputProof,
          encryptedHabit.inputProof,
          { gasLimit: 5000000 }
        );

        await tx.wait();
        setMessage("Record added successfully! Loading records...");

        // Reload records after adding
        await new Promise(resolve => setTimeout(resolve, 2000));
        await loadRecords();
      } catch (error: any) {
        console.error("[useHabitMoodTracker] Error adding record:", error);

        let userFriendlyMessage = "Failed to add record";
        if (error.code === 4001) {
          userFriendlyMessage = "Transaction cancelled by user";
        } else if (error.code === -32000) {
          userFriendlyMessage = "Insufficient funds for transaction";
        } else if (error.message?.includes("network")) {
          userFriendlyMessage = "Network error - please check your connection";
        } else if (error.message?.includes("timeout")) {
          userFriendlyMessage = "Transaction timed out - please try again";
        }

        setMessage(`Error: ${userFriendlyMessage}`);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [contractAddress, ethersSigner, fhevmInstance, address, ethersProvider]
  );

  const batchAddDailyRecords = useCallback(
    async (records: Array<{ mood: number; habitCompletion: number }>) => {
      if (!contractAddress || !ethersSigner || !fhevmInstance || !address || !ethersProvider) {
        const error = new Error("Missing requirements. Please ensure wallet is connected and contract is deployed.");
        setMessage(error.message);
        throw error;
      }

      if (records.length === 0) {
        throw new Error("Cannot add empty batch");
      }

      if (records.length > 7) {
        throw new Error("Batch size limited to 7 records for gas efficiency");
      }

      // Validate all records
      for (let i = 0; i < records.length; i++) {
        const { mood, habitCompletion } = records[i];
        if (mood < 1 || mood > 5) {
          throw new Error(`Record ${i + 1}: Mood must be between 1 and 5`);
        }
        if (habitCompletion < 0 || habitCompletion > 100) {
          throw new Error(`Record ${i + 1}: Habit completion must be between 0 and 100`);
        }
      }

      try {
        setIsLoading(true);
        setMessage(`Encrypting ${records.length} records...`);

        // Encrypt all moods and habits in parallel
        const encryptionPromises = records.map(async ({ mood, habitCompletion }) => {
          const [encryptedMood, encryptedHabit] = await Promise.all([
            fhevmInstance.createEncryptedInput(
              contractAddress as `0x${string}`,
              address as `0x${string}`
            ).add32(mood).encrypt(),
            fhevmInstance.createEncryptedInput(
              contractAddress as `0x${string}`,
              address as `0x${string}`
            ).add32(habitCompletion).encrypt()
          ]);
          return { encryptedMood, encryptedHabit };
        });

        const encryptedData = await Promise.all(encryptionPromises);

        setMessage("Submitting batch to blockchain...");

        const contract = new ethers.Contract(contractAddress, EncryptedHabitMoodTrackerABI, ethersSigner);

        const tx = await contract.batchAddDailyRecords(
          encryptedData.map(d => d.encryptedMood.handles[0]),
          encryptedData.map(d => d.encryptedHabit.handles[0]),
          encryptedData.map(d => d.encryptedMood.inputProof),
          encryptedData.map(d => d.encryptedHabit.inputProof),
          { gasLimit: 10000000 } // Higher gas limit for batch operations
        );

        await tx.wait();
        setMessage(`${records.length} records added successfully! Loading records...`);

        // Reload records after adding
        await new Promise(resolve => setTimeout(resolve, 2000));
        await loadRecords();
      } catch (error: any) {
        const errorMessage = error.reason || error.message || String(error);
        setMessage(`Error: ${errorMessage}`);
        console.error("[useHabitMoodTracker] Error adding batch records:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [contractAddress, ethersSigner, fhevmInstance, address, ethersProvider]
  );

  const loadRecords = useCallback(async () => {
    if (!contractAddress || !ethersProvider || !address) {
      return;
    }

    try {
      setIsLoading(true);
      setMessage("Loading records...");
      const contract = new ethers.Contract(contractAddress, EncryptedHabitMoodTrackerABI, ethersProvider);

      const count = await contract.getDayCount(address);
      setDayCount(Number(count));

      const loadedRecords: DailyRecord[] = [];
      for (let i = 0; i < Number(count); i++) {
        const exists = await contract.recordExists(address, i);
        if (exists) {
          const timestamp = await contract.getRecordTimestamp(address, i);
          const encryptedMood = await contract.getEncryptedMood(address, i);
          const encryptedHabit = await contract.getEncryptedHabitCompletion(address, i);

          // Check if decrypted data exists in cache
          const cachedData = getCachedDecryption(i);

          loadedRecords.push({
            dayIndex: i,
            mood: cachedData?.mood ?? null,
            habitCompletion: cachedData?.habitCompletion ?? null,
            timestamp: Number(timestamp),
            encryptedMood: typeof encryptedMood === "string" ? encryptedMood : ethers.hexlify(encryptedMood),
            encryptedHabitCompletion: typeof encryptedHabit === "string" ? encryptedHabit : ethers.hexlify(encryptedHabit),
          });
        }
      }

      setRecords(loadedRecords);
      setMessage(`Loaded ${loadedRecords.length} records`);
    } catch (error: any) {
      console.error("[useHabitMoodTracker] Error loading records:", error);
      setMessage(`Error loading records: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress, ethersProvider, address, getCachedDecryption, storeDecryption]);

  const decryptRecord = useCallback(
    async (dayIndex: number) => {
      if (!contractAddress || !ethersProvider || !fhevmInstance || !ethersSigner || !address) {
        setMessage("Missing requirements for decryption");
        return;
      }

      try {
        setMessage("Decrypting record...");
        const contract = new ethers.Contract(contractAddress, EncryptedHabitMoodTrackerABI, ethersProvider);
        
        const encryptedMood = await contract.getEncryptedMood(address, dayIndex);
        const encryptedHabit = await contract.getEncryptedHabitCompletion(address, dayIndex);

        const moodHandle = typeof encryptedMood === "string" ? encryptedMood : ethers.hexlify(encryptedMood);
        const habitHandle = typeof encryptedHabit === "string" ? encryptedHabit : ethers.hexlify(encryptedHabit);

        // Prepare handle-contract pairs for decryption
        const handleContractPairs = [
          { handle: moodHandle, contractAddress: contractAddress as `0x${string}` },
          { handle: habitHandle, contractAddress: contractAddress as `0x${string}` },
        ];

        // Generate keypair for EIP712 signature
        let keypair: { publicKey: Uint8Array; privateKey: Uint8Array };
        if (typeof (fhevmInstance as any).generateKeypair === "function") {
          keypair = (fhevmInstance as any).generateKeypair();
        } else {
          keypair = {
            publicKey: new Uint8Array(32).fill(0),
            privateKey: new Uint8Array(32).fill(0),
          };
        }

        // Create EIP712 signature
        const contractAddresses = [contractAddress as `0x${string}`];
        const startTimestamp = Math.floor(Date.now() / 1000).toString();
        const durationDays = "10";

        let eip712: any;
        if (typeof (fhevmInstance as any).createEIP712 === "function") {
          eip712 = (fhevmInstance as any).createEIP712(
            keypair.publicKey,
            contractAddresses,
            startTimestamp,
            durationDays
          );
        } else {
          eip712 = {
            domain: {
              name: "FHEVM",
              version: "1",
              chainId: chainId,
              verifyingContract: contractAddresses[0],
            },
            types: {
              UserDecryptRequestVerification: [
                { name: "publicKey", type: "bytes" },
                { name: "contractAddresses", type: "address[]" },
                { name: "startTimestamp", type: "string" },
                { name: "durationDays", type: "string" },
              ],
            },
            message: {
              publicKey: ethers.hexlify(keypair.publicKey),
              contractAddresses,
              startTimestamp,
              durationDays,
            },
          };
        }

        const signature = await ethersSigner.signTypedData(
          eip712.domain,
          { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
          eip712.message
        );

        const signatureForDecrypt = chainId === 31337 
          ? signature.replace("0x", "") 
          : signature;

        // Decrypt
        const decryptedResult = await (fhevmInstance as any).userDecrypt(
          handleContractPairs,
          keypair.privateKey,
          keypair.publicKey,
          signatureForDecrypt,
          contractAddresses,
          address as `0x${string}`,
          startTimestamp,
          durationDays
        );

        const decryptedMood = Number(decryptedResult[moodHandle] || 0);
        const decryptedHabit = Number(decryptedResult[habitHandle] || 0);

        // Store decryption result to cache
        storeDecryption(dayIndex, decryptedMood, decryptedHabit);

        // Update records with decrypted values
        setRecords(prev => prev.map(record =>
          record.dayIndex === dayIndex
            ? { ...record, mood: decryptedMood, habitCompletion: decryptedHabit }
            : record
        ));

        setMessage("Record decrypted and cached successfully!");
      } catch (error: any) {
        console.error("[useHabitMoodTracker] Error decrypting record:", error);
        setMessage(`Decryption error: ${error.message}`);
        throw error;
      }
    },
    [contractAddress, ethersProvider, fhevmInstance, ethersSigner, address, chainId, storeDecryption]
  );

  const runAnalysis = useCallback(
    async (recordCount: number) => {
      if (!contractAddress || !ethersProvider || !fhevmInstance || !ethersSigner || !address) {
        setMessage("Missing requirements for analysis");
        return;
      }

      try {
        setIsLoading(true);
        setMessage("Running encrypted analysis...");
        
        // Use signer instead of provider since analysis functions are not view (they modify state for permissions)
        const contract = new ethers.Contract(contractAddress, EncryptedHabitMoodTrackerABI, ethersSigner);
        
        // First, call the functions as transactions to set permissions
        setMessage("Setting decryption permissions...");
        
        const tx1 = await contract.getAnalysisTotals(address, recordCount);
        await tx1.wait();
        
        const tx2 = await contract.getMoodHabitCorrelation(address, recordCount);
        await tx2.wait();
        
        const tx3 = await contract.getStressReductionTrend(address, recordCount);
        await tx3.wait();
        
        setMessage("Retrieving analysis results...");
        
        // Now use staticCall to get the return values (permissions are now set)
        const [totalMoodHandle, totalHabitsHandle] = await contract.getAnalysisTotals.staticCall(address, recordCount);
        const [moodHabitProductHandle, habitSquaredHandle] = await contract.getMoodHabitCorrelation.staticCall(address, recordCount);
        const [recentMoodSumHandle, earlierMoodSumHandle] = await contract.getStressReductionTrend.staticCall(address, recordCount);

        // Normalize handles
        const handles = [
          typeof totalMoodHandle === "string" ? totalMoodHandle : ethers.hexlify(totalMoodHandle),
          typeof totalHabitsHandle === "string" ? totalHabitsHandle : ethers.hexlify(totalHabitsHandle),
          typeof moodHabitProductHandle === "string" ? moodHabitProductHandle : ethers.hexlify(moodHabitProductHandle),
          typeof habitSquaredHandle === "string" ? habitSquaredHandle : ethers.hexlify(habitSquaredHandle),
          typeof recentMoodSumHandle === "string" ? recentMoodSumHandle : ethers.hexlify(recentMoodSumHandle),
          typeof earlierMoodSumHandle === "string" ? earlierMoodSumHandle : ethers.hexlify(earlierMoodSumHandle),
        ];

        // Prepare handle-contract pairs
        const handleContractPairs = handles.map(handle => ({
          handle,
          contractAddress: contractAddress as `0x${string}`,
        }));

        // Generate keypair for EIP712 signature
        let keypair: { publicKey: Uint8Array; privateKey: Uint8Array };
        if (typeof (fhevmInstance as any).generateKeypair === "function") {
          keypair = (fhevmInstance as any).generateKeypair();
        } else {
          keypair = {
            publicKey: new Uint8Array(32).fill(0),
            privateKey: new Uint8Array(32).fill(0),
          };
        }

        // Create EIP712 signature
        const contractAddresses = [contractAddress as `0x${string}`];
        const startTimestamp = Math.floor(Date.now() / 1000).toString();
        const durationDays = "10";

        let eip712: any;
        if (typeof (fhevmInstance as any).createEIP712 === "function") {
          eip712 = (fhevmInstance as any).createEIP712(
            keypair.publicKey,
            contractAddresses,
            startTimestamp,
            durationDays
          );
        } else {
          eip712 = {
            domain: {
              name: "FHEVM",
              version: "1",
              chainId: chainId,
              verifyingContract: contractAddresses[0],
            },
            types: {
              UserDecryptRequestVerification: [
                { name: "publicKey", type: "bytes" },
                { name: "contractAddresses", type: "address[]" },
                { name: "startTimestamp", type: "string" },
                { name: "durationDays", type: "string" },
              ],
            },
            message: {
              publicKey: ethers.hexlify(keypair.publicKey),
              contractAddresses,
              startTimestamp,
              durationDays,
            },
          };
        }

        const signature = await ethersSigner.signTypedData(
          eip712.domain,
          { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
          eip712.message
        );

        const signatureForDecrypt = chainId === 31337 
          ? signature.replace("0x", "") 
          : signature;

        setMessage("Decrypting analysis results...");

        // Decrypt all handles
        const decryptedResult = await (fhevmInstance as any).userDecrypt(
          handleContractPairs,
          keypair.privateKey,
          keypair.publicKey,
          signatureForDecrypt,
          contractAddresses,
          address as `0x${string}`,
          startTimestamp,
          durationDays
        );

        // Extract decrypted values
        const totalMood = Number(decryptedResult[handles[0]] || 0);
        const totalHabits = Number(decryptedResult[handles[1]] || 0);
        const moodHabitProduct = Number(decryptedResult[handles[2]] || 0);
        const habitSquared = Number(decryptedResult[handles[3]] || 0);
        const recentMoodSum = Number(decryptedResult[handles[4]] || 0);
        const earlierMoodSum = Number(decryptedResult[handles[5]] || 0);

        // Update analysis state
        setAnalysis({
          totalMood,
          totalHabits,
          moodHabitProduct,
          habitSquared,
          recentMoodSum,
          earlierMoodSum,
        });
        
        setMessage("Analysis complete!");
      } catch (error: any) {
        console.error("[useHabitMoodTracker] Error running analysis:", error);
        setMessage(`Analysis error: ${error.message}`);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [contractAddress, ethersProvider, fhevmInstance, ethersSigner, address, chainId]
  );

  useEffect(() => {
    if (contractAddress && ethersProvider && address) {
      loadRecords();
    }
  }, [contractAddress, ethersProvider, address, loadRecords]);

  return {
    contractAddress,
    dayCount,
    records,
    analysis,
    isLoading,
    message,
    addDailyRecord,
    batchAddDailyRecords,
    loadRecords,
    decryptRecord,
    runAnalysis,
    clearDecryptionCache: clearUserCache,
    getCacheStats,
  };
}

