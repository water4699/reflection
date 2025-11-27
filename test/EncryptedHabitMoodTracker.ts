import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { EncryptedHabitMoodTracker, EncryptedHabitMoodTracker__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("EncryptedHabitMoodTracker")) as EncryptedHabitMoodTracker__factory;
  const contract = (await factory.deploy()) as EncryptedHabitMoodTracker;
  const contractAddress = await contract.getAddress();

  return { contract, contractAddress };
}

describe("EncryptedHabitMoodTracker", function () {
  let signers: Signers;
  let contract: EncryptedHabitMoodTracker;
  let contractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ contract, contractAddress } = await deployFixture());
  });

  it("should return 0 day count for new user", async function () {
    expect(await contract.getDayCount(signers.alice.address)).to.eq(0);
  });

  it("should add a daily record with mood and habit completion", async function () {
    const mood = 4; // Mood: 4/5
    const habitCompletion = 85; // Habit completion: 85%

    // Encrypt mood
    const encryptedMood = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(mood)
      .encrypt();

    // Encrypt habit completion
    const encryptedHabit = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(habitCompletion)
      .encrypt();

    const tx = await contract
      .connect(signers.alice)
      .addDailyRecord(
        encryptedMood.handles[0],
        encryptedHabit.handles[0],
        encryptedMood.inputProof,
        encryptedHabit.inputProof
      );
    await tx.wait();

    // Verify day count increased
    expect(await contract.getDayCount(signers.alice.address)).to.eq(1);

    // Verify record exists
    expect(await contract.recordExists(signers.alice.address, 0)).to.be.true;

    // Decrypt and verify mood
    const encryptedMoodResult = await contract.getEncryptedMood(signers.alice.address, 0);
    const decryptedMood = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedMoodResult,
      contractAddress,
      signers.alice,
    );
    expect(decryptedMood).to.eq(mood);

    // Decrypt and verify habit completion
    const encryptedHabitResult = await contract.getEncryptedHabitCompletion(signers.alice.address, 0);
    const decryptedHabit = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedHabitResult,
      contractAddress,
      signers.alice,
    );
    expect(decryptedHabit).to.eq(habitCompletion);
  });

  it("should add multiple daily records", async function () {
    // First day: mood 3, habit 60%
    const mood1 = 3;
    const habit1 = 60;

    const encryptedMood1 = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(mood1)
      .encrypt();

    const encryptedHabit1 = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(habit1)
      .encrypt();

    let tx = await contract
      .connect(signers.alice)
      .addDailyRecord(
        encryptedMood1.handles[0],
        encryptedHabit1.handles[0],
        encryptedMood1.inputProof,
        encryptedHabit1.inputProof
      );
    await tx.wait();

    // Second day: mood 5, habit 100%
    const mood2 = 5;
    const habit2 = 100;

    const encryptedMood2 = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(mood2)
      .encrypt();

    const encryptedHabit2 = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(habit2)
      .encrypt();

    tx = await contract
      .connect(signers.alice)
      .addDailyRecord(
        encryptedMood2.handles[0],
        encryptedHabit2.handles[0],
        encryptedMood2.inputProof,
        encryptedHabit2.inputProof
      );
    await tx.wait();

    // Verify day count
    expect(await contract.getDayCount(signers.alice.address)).to.eq(2);

    // Verify first day record
    const decryptedMood1 = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      await contract.getEncryptedMood(signers.alice.address, 0),
      contractAddress,
      signers.alice,
    );
    expect(decryptedMood1).to.eq(mood1);

    // Verify second day record
    const decryptedMood2 = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      await contract.getEncryptedMood(signers.alice.address, 1),
      contractAddress,
      signers.alice,
    );
    expect(decryptedMood2).to.eq(mood2);
  });

  it("should keep separate records for different users", async function () {
    // Alice's record: mood 4, habit 80%
    const aliceMood = 4;
    const aliceHabit = 80;

    const encryptedAliceMood = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(aliceMood)
      .encrypt();

    const encryptedAliceHabit = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(aliceHabit)
      .encrypt();

    let tx = await contract
      .connect(signers.alice)
      .addDailyRecord(
        encryptedAliceMood.handles[0],
        encryptedAliceHabit.handles[0],
        encryptedAliceMood.inputProof,
        encryptedAliceHabit.inputProof
      );
    await tx.wait();

    // Bob's record: mood 2, habit 40%
    const bobMood = 2;
    const bobHabit = 40;

    const encryptedBobMood = await fhevm
      .createEncryptedInput(contractAddress, signers.bob.address)
      .add32(bobMood)
      .encrypt();

    const encryptedBobHabit = await fhevm
      .createEncryptedInput(contractAddress, signers.bob.address)
      .add32(bobHabit)
      .encrypt();

    tx = await contract
      .connect(signers.bob)
      .addDailyRecord(
        encryptedBobMood.handles[0],
        encryptedBobHabit.handles[0],
        encryptedBobMood.inputProof,
        encryptedBobHabit.inputProof
      );
    await tx.wait();

    // Verify Alice's data
    const decryptedAliceMood = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      await contract.getEncryptedMood(signers.alice.address, 0),
      contractAddress,
      signers.alice,
    );
    expect(decryptedAliceMood).to.eq(aliceMood);

    // Verify Bob's data
    const decryptedBobMood = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      await contract.getEncryptedMood(signers.bob.address, 0),
      contractAddress,
      signers.bob,
    );
    expect(decryptedBobMood).to.eq(bobMood);

    // Verify separate day counts
    expect(await contract.getDayCount(signers.alice.address)).to.eq(1);
    expect(await contract.getDayCount(signers.bob.address)).to.eq(1);
  });

  it("should calculate analysis totals", async function () {
    // Add 3 records for analysis
    const records = [
      { mood: 3, habit: 60 },
      { mood: 4, habit: 80 },
      { mood: 5, habit: 100 },
    ];

    for (const record of records) {
      const encryptedMood = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(record.mood)
        .encrypt();

      const encryptedHabit = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(record.habit)
        .encrypt();

      const tx = await contract
        .connect(signers.alice)
        .addDailyRecord(
          encryptedMood.handles[0],
          encryptedHabit.handles[0],
          encryptedMood.inputProof,
          encryptedHabit.inputProof
        );
      await tx.wait();
    }

    // First call to set permissions (send transaction)
    const tx1 = await contract.connect(signers.alice).getAnalysisTotals(signers.alice.address, 3);
    await tx1.wait();

    // Now use static call to get the values (permissions are now set)
    const [totalMood, totalHabits] = await contract.getAnalysisTotals.staticCall(signers.alice.address, 3);

    // Decrypt and verify totals
    const decryptedTotalMood = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      totalMood,
      contractAddress,
      signers.alice,
    );
    expect(decryptedTotalMood).to.eq(12); // 3 + 4 + 5

    const decryptedTotalHabits = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      totalHabits,
      contractAddress,
      signers.alice,
    );
    expect(decryptedTotalHabits).to.eq(240); // 60 + 80 + 100
  });

  it("should calculate mood-habit correlation", async function () {
    // Add records: mood improves as habits improve
    const records = [
      { mood: 2, habit: 40 },
      { mood: 3, habit: 60 },
      { mood: 4, habit: 80 },
    ];

    for (const record of records) {
      const encryptedMood = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(record.mood)
        .encrypt();

      const encryptedHabit = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(record.habit)
        .encrypt();

      const tx = await contract
        .connect(signers.alice)
        .addDailyRecord(
          encryptedMood.handles[0],
          encryptedHabit.handles[0],
          encryptedMood.inputProof,
          encryptedHabit.inputProof
        );
      await tx.wait();
    }

    // First call to set permissions (send transaction)
    const tx2 = await contract.connect(signers.alice).getMoodHabitCorrelation(signers.alice.address, 3);
    await tx2.wait();

    // Now use static call to get the values (permissions are now set)
    const [moodHabitProduct, habitSquared] = await contract.getMoodHabitCorrelation.staticCall(signers.alice.address, 3);

    // Decrypt correlation values
    const decryptedProduct = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      moodHabitProduct,
      contractAddress,
      signers.alice,
    );
    expect(decryptedProduct).to.eq(580); // (2*40) + (3*60) + (4*80) = 80 + 180 + 320 = 580

    const decryptedSquared = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      habitSquared,
      contractAddress,
      signers.alice,
    );
    expect(decryptedSquared).to.eq(11600); // 40^2 + 60^2 + 80^2 = 1600 + 3600 + 6400 = 11600
  });

  it("should calculate stress reduction trend", async function () {
    // Add records showing mood improvement (stress reduction)
    const earlierRecords = [
      { mood: 2, habit: 50 },
      { mood: 2, habit: 60 },
    ];
    const recentRecords = [
      { mood: 4, habit: 80 },
      { mood: 5, habit: 90 },
    ];

    // Add earlier records
    for (const record of earlierRecords) {
      const encryptedMood = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(record.mood)
        .encrypt();

      const encryptedHabit = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(record.habit)
        .encrypt();

      const tx = await contract
        .connect(signers.alice)
        .addDailyRecord(
          encryptedMood.handles[0],
          encryptedHabit.handles[0],
          encryptedMood.inputProof,
          encryptedHabit.inputProof
        );
      await tx.wait();
    }

    // Add recent records
    for (const record of recentRecords) {
      const encryptedMood = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(record.mood)
        .encrypt();

      const encryptedHabit = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(record.habit)
        .encrypt();

      const tx = await contract
        .connect(signers.alice)
        .addDailyRecord(
          encryptedMood.handles[0],
          encryptedHabit.handles[0],
          encryptedMood.inputProof,
          encryptedHabit.inputProof
        );
      await tx.wait();
    }

    // First call to set permissions (send transaction)
    const tx3 = await contract.connect(signers.alice).getStressReductionTrend(signers.alice.address, 4);
    await tx3.wait();

    // Now use static call to get the values (permissions are now set)
    const [recentMoodSum, earlierMoodSum] = await contract.getStressReductionTrend.staticCall(signers.alice.address, 4);

    // Decrypt trend values
    const decryptedRecent = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      recentMoodSum,
      contractAddress,
      signers.alice,
    );
    expect(decryptedRecent).to.eq(9); // 4 + 5

    const decryptedEarlier = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      earlierMoodSum,
      contractAddress,
      signers.alice,
    );
    expect(decryptedEarlier).to.eq(4); // 2 + 2

    // Recent average (9/2 = 4.5) should be higher than earlier average (4/2 = 2)
    // This indicates stress reduction (mood improvement)
  });
});

