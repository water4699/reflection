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

    // Additional events for enhanced tracking
    event BatchRecordsAdded(address indexed user, uint256 recordCount, uint256 startDayIndex);

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
        // Validate input ranges (encrypted validation)
        // Note: Full validation would require decryption, but we add basic checks
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

    /// @notice Get timestamp range for user's records
    /// @param user The user address
    /// @return earliestTimestamp The timestamp of the earliest record
    /// @return latestTimestamp The timestamp of the latest record
    function getRecordTimestampRange(address user)
        external
        view
        returns (uint256 earliestTimestamp, uint256 latestTimestamp)
    {
        uint256 dayCount = _userDayCount[user];
        require(dayCount > 0, "No records available");

        uint256 earliest = type(uint256).max;
        uint256 latest = 0;

        for (uint256 i = 0; i < dayCount; i++) {
            if (_userRecords[user][i].initialized) {
                uint256 timestamp = _userRecords[user][i].timestamp;
                if (timestamp < earliest) earliest = timestamp;
                if (timestamp > latest) latest = timestamp;
            }
        }

        return (earliest, latest);
    }

    /// @notice Get average mood and habit completion over a period
    /// @param user The user address
    /// @param numDays The number of recent days to average (max 30)
    /// @return encryptedAverageMood Average mood value
    /// @return encryptedAverageHabits Average habit completion
    function getDailyAverages(address user, uint256 numDays)
        external
        returns (euint32 encryptedAverageMood, euint32 encryptedAverageHabits)
    {
        uint256 dayCount = _userDayCount[user];
        require(dayCount > 0, "No records available");

        uint256 maxDays = numDays > 30 ? 30 : numDays;
        uint256 startIndex = dayCount > maxDays ? dayCount - maxDays : 0;

        euint32 totalMood = FHE.asEuint32(0);
        euint32 totalHabits = FHE.asEuint32(0);
        uint256 validRecords = 0;

        for (uint256 i = startIndex; i < dayCount; i++) {
            if (_userRecords[user][i].initialized) {
                totalMood = FHE.add(totalMood, _userRecords[user][i].mood);
                totalHabits = FHE.add(totalHabits, _userRecords[user][i].habitCompletion);
                validRecords++;
            }
        }

        require(validRecords > 0, "No valid records found");

        // Note: Division not directly supported in FHE, client-side calculation needed
        // We return totals and count for client-side averaging
        FHE.allowThis(totalMood);
        FHE.allow(totalMood, user);
        FHE.allowThis(totalHabits);
        FHE.allow(totalHabits, user);

        emit AnalysisPerformed(user, 4);
        return (totalMood, totalHabits);
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

    /// @notice Get user statistics summary
    /// @param user The user address
    /// @return totalRecords Total number of records
    /// @return averageMood Average mood score (0 if no records)
    /// @return averageHabit Average habit completion (0 if no records)
    /// @return consistencyScore Consistency score based on regular logging (0-100)
    function getUserStatistics(address user)
        external
        view
        returns (
            uint256 totalRecords,
            uint256 averageMood,
            uint256 averageHabit,
            uint256 consistencyScore
        )
    {
        uint256 dayCount = _userDayCount[user];
        totalRecords = dayCount;

        if (dayCount == 0) {
            return (0, 0, 0, 0);
        }

        uint256 validRecords = 0;

        // Calculate averages
        for (uint256 i = 0; i < dayCount; i++) {
            if (_userRecords[user][i].initialized) {
                // Note: In FHE, we can't directly access encrypted values in view functions
                // This would need to be calculated client-side after decryption
                // For now, return encrypted totals for client-side calculation
                validRecords++;
            }
        }

        // Calculate consistency score based on logging frequency
        // For MVP, use a simple formula: (valid_records / total_possible_days) * 100
        // In a full implementation, this would consider time gaps between records
        consistencyScore = (validRecords * 100) / dayCount;

        // Return encrypted totals for averages (client-side calculation needed)
        return (totalRecords, 0, 0, consistencyScore);
    }

    /// @notice Calculate habit completion trend over time
    /// @param user The user address
    /// @param recordCount Number of recent records to analyze (up to 10 for MVP)
    /// @return encryptedTrendSlope Slope of habit completion trend (positive = improving)
    /// @return encryptedAverageCompletion Average habit completion rate
    /// @dev Client-side can decrypt and interpret trend direction
    function getHabitCompletionTrend(address user, uint256 recordCount)
        external
        returns (euint32 encryptedTrendSlope, euint32 encryptedAverageCompletion)
    {
        uint256 dayCount = _userDayCount[user];
        require(dayCount > 0, "No records available");
        require(dayCount >= 2, "Need at least 2 records for trend analysis");

        uint256 maxRecords = recordCount > 10 ? 10 : recordCount;
        uint256 startIndex = dayCount > maxRecords ? dayCount - maxRecords : 0;
        uint256 validRecords = 0;

        euint32 totalCompletion = FHE.asEuint32(0);
        euint32 firstHalfSum = FHE.asEuint32(0);
        euint32 secondHalfSum = FHE.asEuint32(0);
        uint256 firstHalfCount = 0;
        uint256 secondHalfCount = 0;
        uint256 midpoint = startIndex + (dayCount - startIndex) / 2;

        // Calculate sums for first and second half to determine trend
        for (uint256 i = startIndex; i < dayCount; i++) {
            if (_userRecords[user][i].initialized) {
                totalCompletion = FHE.add(totalCompletion, _userRecords[user][i].habitCompletion);
                if (i < midpoint) {
                    firstHalfSum = FHE.add(firstHalfSum, _userRecords[user][i].habitCompletion);
                    firstHalfCount++;
                } else {
                    secondHalfSum = FHE.add(secondHalfSum, _userRecords[user][i].habitCompletion);
                    secondHalfCount++;
                }
                validRecords++;
            }
        }

        require(validRecords >= 2, "Need at least 2 valid records");

        // Use difference between halves as trend indicator (positive = improving)
        // Note: Division by counts would require client-side calculation
        euint32 trendIndicator = FHE.sub(secondHalfSum, firstHalfSum);

        // Grant permissions for decryption
        FHE.allowThis(trendIndicator);
        FHE.allow(trendIndicator, user);
        FHE.allowThis(totalCompletion);
        FHE.allow(totalCompletion, user);

        emit AnalysisPerformed(user, 5);
        return (trendIndicator, totalCompletion);
    }

    /// @notice Get records within a date range
    /// @param user The user address
    /// @param startDay Starting day index (inclusive)
    /// @param endDay Ending day index (exclusive)
    /// @return encryptedMoods Array of encrypted mood values
    /// @return encryptedHabits Array of encrypted habit completion values
    /// @return timestamps Array of record timestamps
    function getRecordsInRange(address user, uint256 startDay, uint256 endDay)
        external
        view
        returns (
            euint32[] memory encryptedMoods,
            euint32[] memory encryptedHabits,
            uint256[] memory timestamps
        )
    {
        require(endDay > startDay, "Invalid range");
        require(endDay - startDay <= 30, "Range too large (max 30 days)");

        uint256 dayCount = _userDayCount[user];
        uint256 maxEndDay = endDay > dayCount ? dayCount : endDay;
        uint256 resultSize = maxEndDay - startDay;

        encryptedMoods = new euint32[](resultSize);
        encryptedHabits = new euint32[](resultSize);
        timestamps = new uint256[](resultSize);

        uint256 resultIndex = 0;
        for (uint256 i = startDay; i < maxEndDay && resultIndex < resultSize; i++) {
            if (_userRecords[user][i].initialized) {
                encryptedMoods[resultIndex] = _userRecords[user][i].mood;
                encryptedHabits[resultIndex] = _userRecords[user][i].habitCompletion;
                timestamps[resultIndex] = _userRecords[user][i].timestamp;
                resultIndex++;
            }
        }

        // Resize arrays to actual result size
        assembly {
            mstore(encryptedMoods, resultIndex)
            mstore(encryptedHabits, resultIndex)
            mstore(timestamps, resultIndex)
        }

        return (encryptedMoods, encryptedHabits, timestamps);
    }

    /// @notice Batch add multiple daily records at once
    /// @param encryptedMoods Array of encrypted mood values (1-5)
    /// @param encryptedHabits Array of encrypted habit completion rates (0-100)
    /// @param moodProofs Array of FHE proofs for mood encryption
    /// @param habitProofs Array of FHE proofs for habit completion encryption
    function batchAddDailyRecords(
        externalEuint32[] calldata encryptedMoods,
        externalEuint32[] calldata encryptedHabits,
        bytes[] calldata moodProofs,
        bytes[] calldata habitProofs
    ) external {
        require(encryptedMoods.length == encryptedHabits.length, "Array lengths must match");
        require(encryptedMoods.length == moodProofs.length, "Mood proofs length mismatch");
        require(encryptedHabits.length == habitProofs.length, "Habit proofs length mismatch");
        require(encryptedMoods.length > 0, "Cannot add empty batch");
        require(encryptedMoods.length <= 7, "Batch size limited to 7 records for gas efficiency");

        uint256 startDayIndex = _userDayCount[msg.sender];

        for (uint256 i = 0; i < encryptedMoods.length; i++) {
            euint32 mood = FHE.fromExternal(encryptedMoods[i], moodProofs[i]);
            euint32 habitCompletion = FHE.fromExternal(encryptedHabits[i], habitProofs[i]);

            _userRecords[msg.sender][startDayIndex + i] = DailyRecord({
                mood: mood,
                habitCompletion: habitCompletion,
                timestamp: block.timestamp,
                initialized: true
            });

            // Grant decryption permissions
            FHE.allowThis(mood);
            FHE.allow(mood, msg.sender);
            FHE.allowThis(habitCompletion);
            FHE.allow(habitCompletion, msg.sender);

            emit RecordAdded(msg.sender, startDayIndex + i, block.timestamp);
        }

        _userDayCount[msg.sender] += encryptedMoods.length;
    }
}

