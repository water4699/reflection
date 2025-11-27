// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title EncryptedHabitMoodTracker - Private Habit and Mood Tracking
/// @notice Allows users to record encrypted mood (1-5) and habit completion rate (0-100) privately
/// @dev Uses FHE to store encrypted data and perform encrypted analysis on-chain
contract EncryptedHabitMoodTracker is SepoliaConfig {
    // Struct to store daily encrypted mood and habit data
    struct DailyRecord {
        euint32 mood;              // Encrypted mood value (1-5)
        euint32 habitCompletion;   // Encrypted habit completion rate (0-100)
        uint256 timestamp;         // Plain timestamp for sorting
        bool initialized;          // Whether this record exists
    }

    // Mapping from user address to their daily records (day index => record)
    mapping(address => mapping(uint256 => DailyRecord)) private _userRecords;
    
    // Mapping to track total number of days recorded per user
    mapping(address => uint256) private _userDayCount;

    // Event emitted when a new record is added
    event RecordAdded(address indexed user, uint256 dayIndex, uint256 timestamp);
    
    // Event emitted when encrypted analysis is performed
    event AnalysisPerformed(address indexed user, uint256 analysisType);

    /// @notice Add a daily mood and habit completion record
    /// @param encryptedMood The encrypted mood value (1-5)
    /// @param encryptedHabitCompletion The encrypted habit completion rate (0-100)
    /// @param moodProof The FHE proof for mood encryption
    /// @param habitProof The FHE proof for habit completion encryption
    function addDailyRecord(
        externalEuint32 encryptedMood,
        externalEuint32 encryptedHabitCompletion,
        bytes calldata moodProof,
        bytes calldata habitProof
    ) external {
        euint32 mood = FHE.fromExternal(encryptedMood, moodProof);
        euint32 habitCompletion = FHE.fromExternal(encryptedHabitCompletion, habitProof);

        uint256 dayIndex = _userDayCount[msg.sender];
        
        // Store the encrypted record
        _userRecords[msg.sender][dayIndex] = DailyRecord({
            mood: mood,
            habitCompletion: habitCompletion,
            timestamp: block.timestamp,
            initialized: true
        });

        // Grant decryption permissions to the user
        FHE.allowThis(mood);
        FHE.allow(mood, msg.sender);
        FHE.allowThis(habitCompletion);
        FHE.allow(habitCompletion, msg.sender);

        // Increment day count
        _userDayCount[msg.sender]++;

        emit RecordAdded(msg.sender, dayIndex, block.timestamp);
    }

    /// @notice Get the encrypted mood for a specific day
    /// @param user The user address
    /// @param dayIndex The day index (0-based)
    /// @return encryptedMood The encrypted mood value
    function getEncryptedMood(address user, uint256 dayIndex) 
        external 
        view 
        returns (euint32 encryptedMood) 
    {
        require(_userRecords[user][dayIndex].initialized, "Record does not exist");
        return _userRecords[user][dayIndex].mood;
    }

    /// @notice Get the encrypted habit completion for a specific day
    /// @param user The user address
    /// @param dayIndex The day index (0-based)
    /// @return encryptedHabitCompletion The encrypted habit completion value
    function getEncryptedHabitCompletion(address user, uint256 dayIndex) 
        external 
        view 
        returns (euint32 encryptedHabitCompletion) 
    {
        require(_userRecords[user][dayIndex].initialized, "Record does not exist");
        return _userRecords[user][dayIndex].habitCompletion;
    }

    /// @notice Get the total number of days recorded for a user
    /// @param user The user address
    /// @return count The number of days recorded
    function getDayCount(address user) external view returns (uint256 count) {
        return _userDayCount[user];
    }

    /// @notice Get timestamp for a specific day record
    /// @param user The user address
    /// @param dayIndex The day index (0-based)
    /// @return timestamp The timestamp of the record
    function getRecordTimestamp(address user, uint256 dayIndex) 
        external 
        view 
        returns (uint256 timestamp) 
    {
        require(_userRecords[user][dayIndex].initialized, "Record does not exist");
        return _userRecords[user][dayIndex].timestamp;
    }

    /// @notice Calculate total mood and habit completion for analysis
    /// @param user The user address
    /// @param recordCount Number of recent records to analyze (up to 10 for MVP)
    /// @return encryptedTotalMood The encrypted sum of moods
    /// @return encryptedTotalHabits The encrypted sum of habit completions
    /// @dev This allows encrypted analysis by returning totals that can be decrypted and analyzed client-side
    /// @dev Note: Not view because FHE operations modify state (permissions)
    function getAnalysisTotals(address user, uint256 recordCount) 
        external 
        returns (euint32 encryptedTotalMood, euint32 encryptedTotalHabits) 
    {
        uint256 dayCount = _userDayCount[user];
        require(dayCount > 0, "No records available");
        
        // Limit to avoid gas issues - process up to 10 records
        uint256 maxRecords = recordCount > 10 ? 10 : recordCount;
        uint256 startIndex = dayCount > maxRecords ? dayCount - maxRecords : 0;
        
        euint32 totalMood = FHE.asEuint32(0);
        euint32 totalHabits = FHE.asEuint32(0);
        
        // Sum up mood and habit completion values
        for (uint256 i = startIndex; i < dayCount; i++) {
            if (_userRecords[user][i].initialized) {
                totalMood = FHE.add(totalMood, _userRecords[user][i].mood);
                totalHabits = FHE.add(totalHabits, _userRecords[user][i].habitCompletion);
            }
        }
        
        // Grant permissions for decryption
        FHE.allowThis(totalMood);
        FHE.allow(totalMood, user);
        FHE.allowThis(totalHabits);
        FHE.allow(totalHabits, user);
        
        emit AnalysisPerformed(user, 1);
        return (totalMood, totalHabits);
    }

    /// @notice Calculate correlation between mood improvement and habit completion
    /// @param user The user address
    /// @param recordCount Number of recent records to analyze (up to 10 for MVP)
    /// @return encryptedMoodHabitProduct Sum of (mood * habitCompletion) for correlation analysis
    /// @return encryptedHabitSquared Sum of (habitCompletion * habitCompletion) for correlation analysis
    /// @dev Client-side can decrypt and calculate correlation coefficient using these values
    /// @dev Note: Not view because FHE operations modify state (permissions)
    function getMoodHabitCorrelation(address user, uint256 recordCount)
        external
        returns (euint32 encryptedMoodHabitProduct, euint32 encryptedHabitSquared)
    {
        uint256 dayCount = _userDayCount[user];
        require(dayCount > 0, "No records available");
        
        // Limit to avoid gas issues - process up to 10 records
        uint256 maxRecords = recordCount > 10 ? 10 : recordCount;
        uint256 startIndex = dayCount > maxRecords ? dayCount - maxRecords : 0;
        
        euint32 moodHabitProduct = FHE.asEuint32(0);
        euint32 habitSquared = FHE.asEuint32(0);
        
        // Calculate products for correlation analysis
        for (uint256 i = startIndex; i < dayCount; i++) {
            if (_userRecords[user][i].initialized) {
                // mood * habitCompletion
                euint32 product = FHE.mul(_userRecords[user][i].mood, _userRecords[user][i].habitCompletion);
                moodHabitProduct = FHE.add(moodHabitProduct, product);
                
                // habitCompletion^2
                euint32 squared = FHE.mul(_userRecords[user][i].habitCompletion, _userRecords[user][i].habitCompletion);
                habitSquared = FHE.add(habitSquared, squared);
            }
        }
        
        // Grant permissions for decryption
        FHE.allowThis(moodHabitProduct);
        FHE.allow(moodHabitProduct, user);
        FHE.allowThis(habitSquared);
        FHE.allow(habitSquared, user);
        
        emit AnalysisPerformed(user, 2);
        return (moodHabitProduct, habitSquared);
    }

    /// @notice Calculate stress reduction trend (lower mood = higher stress, so we track if mood is improving)
    /// @param user The user address
    /// @param recordCount Number of recent records to analyze (up to 10 for MVP)
    /// @return encryptedRecentMoodAverage Average mood in recent records
    /// @return encryptedEarlierMoodAverage Average mood in earlier records
    /// @dev Client-side can compare these to see if mood is improving (stress reducing)
    /// @dev Note: Not view because FHE operations modify state (permissions)
    function getStressReductionTrend(address user, uint256 recordCount)
        external
        returns (euint32 encryptedRecentMoodAverage, euint32 encryptedEarlierMoodAverage)
    {
        uint256 dayCount = _userDayCount[user];
        require(dayCount > 0, "No records available");
        
        // Need at least 2 records to compare
        require(dayCount >= 2, "Need at least 2 records for trend analysis");
        
        // Limit to avoid gas issues - process up to 10 records
        uint256 maxRecords = recordCount > 10 ? 10 : recordCount;
        uint256 splitPoint = dayCount > maxRecords ? dayCount - (maxRecords / 2) : dayCount / 2;
        
        euint32 recentMoodSum = FHE.asEuint32(0);
        euint32 earlierMoodSum = FHE.asEuint32(0);
        uint256 recentCount = 0;
        uint256 earlierCount = 0;
        
        // Calculate sums for recent and earlier periods
        for (uint256 i = 0; i < dayCount; i++) {
            if (_userRecords[user][i].initialized) {
                if (i >= splitPoint) {
                    // Recent period
                    recentMoodSum = FHE.add(recentMoodSum, _userRecords[user][i].mood);
                    recentCount++;
                } else {
                    // Earlier period
                    earlierMoodSum = FHE.add(earlierMoodSum, _userRecords[user][i].mood);
                    earlierCount++;
                }
            }
        }
        
        // For MVP, we return sums - client can divide by count to get averages
        // Grant permissions for decryption
        FHE.allowThis(recentMoodSum);
        FHE.allow(recentMoodSum, user);
        FHE.allowThis(earlierMoodSum);
        FHE.allow(earlierMoodSum, user);
        
        emit AnalysisPerformed(user, 3);
        return (recentMoodSum, earlierMoodSum);
    }

    /// @notice Check if a record exists for a specific day
    /// @param user The user address
    /// @param dayIndex The day index (0-based)
    /// @return exists Whether the record exists
    function recordExists(address user, uint256 dayIndex) 
        external 
        view 
        returns (bool exists) 
    {
        return _userRecords[user][dayIndex].initialized;
    }
}

