import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";

interface CachedDecryption {
  mood: number;
  habitCompletion: number;
  decryptedAt: number;
  expiresAt: number;
}

interface DecryptionCache {
  [userAddress: string]: {
    [dayIndex: number]: CachedDecryption;
  };
}

const CACHE_KEY = "reflection-log-decryption-cache";
const CACHE_EXPIRY_DAYS = 7; // Cache expires after 7 days

export function useDecryptionCache() {
  const { address } = useAccount();
  const [cache, setCache] = useState<DecryptionCache>({});

  // Load cache from localStorage
  useEffect(() => {
    const loadCache = () => {
      try {
        const stored = localStorage.getItem(CACHE_KEY);
        if (stored) {
          const parsedCache = JSON.parse(stored) as DecryptionCache;
          // Clean up expired data
          const now = Date.now();
          const cleanedCache: DecryptionCache = {};

          Object.keys(parsedCache).forEach(userAddr => {
            cleanedCache[userAddr] = {};
            Object.keys(parsedCache[userAddr]).forEach(dayIndex => {
              const entry = parsedCache[userAddr][parseInt(dayIndex)];
              if (entry.expiresAt > now) {
                cleanedCache[userAddr][parseInt(dayIndex)] = entry;
              }
            });
            // If user has no valid cache, delete user entry
            if (Object.keys(cleanedCache[userAddr]).length === 0) {
              delete cleanedCache[userAddr];
            }
          });

          setCache(cleanedCache);
        }
      } catch (error) {
        console.error("Failed to load decryption cache:", error);
      }
    };

    loadCache();
    // Reload cache when address changes
  }, [address]);

  // Save cache to localStorage
  const saveCache = useCallback((newCache: DecryptionCache) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));
      setCache(newCache);
    } catch (error) {
      console.error("Failed to save decryption cache:", error);
    }
  }, []);

  // Store decryption result
  const storeDecryption = useCallback(
    (dayIndex: number, mood: number, habitCompletion: number) => {
      if (!address) return;

      const now = Date.now();
      const expiresAt = now + (CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

      const newCache = { ...cache };
      if (!newCache[address]) {
        newCache[address] = {};
      }

      newCache[address][dayIndex] = {
        mood,
        habitCompletion,
        decryptedAt: now,
        expiresAt,
      };

      saveCache(newCache);
    },
    [address, cache, saveCache]
  );

  // Get cached decryption result
  const getCachedDecryption = useCallback(
    (dayIndex: number): { mood: number; habitCompletion: number } | null => {
      if (!address || !cache[address]?.[dayIndex]) return null;

      const entry = cache[address][dayIndex];
      if (entry.expiresAt < Date.now()) {
        // Expired, clean up
        const newCache = { ...cache };
        delete newCache[address][dayIndex];
        if (Object.keys(newCache[address]).length === 0) {
          delete newCache[address];
        }
        saveCache(newCache);
        return null;
      }

      return {
        mood: entry.mood,
        habitCompletion: entry.habitCompletion,
      };
    },
    [address, cache, saveCache]
  );

  // Check if data is decrypted
  const isDecrypted = useCallback(
    (dayIndex: number): boolean => {
      return getCachedDecryption(dayIndex) !== null;
    },
    [getCachedDecryption]
  );

  // Clear all cache for the user
  const clearUserCache = useCallback(() => {
    if (!address) return;

    const newCache = { ...cache };
    delete newCache[address];
    saveCache(newCache);
  }, [address, cache, saveCache]);

  // Clear all cache
  const clearAllCache = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
    setCache({});
  }, []);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    if (!address || !cache[address]) return { totalRecords: 0, expiredRecords: 0 };

    const entries = Object.values(cache[address]);
    const now = Date.now();
    const totalRecords = entries.length;
    const expiredRecords = entries.filter(entry => entry.expiresAt < now).length;

    return { totalRecords, expiredRecords };
  }, [address, cache]);

  return {
    storeDecryption,
    getCachedDecryption,
    isDecrypted,
    clearUserCache,
    clearAllCache,
    getCacheStats,
  };
}
