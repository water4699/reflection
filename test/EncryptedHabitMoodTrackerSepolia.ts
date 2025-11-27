import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, deployments } from "hardhat";
import { EncryptedHabitMoodTracker } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  alice: HardhatEthersSigner;
};

describe("EncryptedHabitMoodTrackerSepolia", function () {
  let signers: Signers;
  let contract: EncryptedHabitMoodTracker;
  let contractAddress: string;
  let step: number;
  let steps: number;

  function progress(message: string) {
    console.log(`${++step}/${steps} ${message}`);
  }

  before(async function () {
    if (fhevm.isMock) {
      console.warn(`This hardhat test suite can only run on Sepolia Testnet`);
      this.skip();
    }

    try {
      const deployment = await deployments.get("EncryptedHabitMoodTracker");
      contractAddress = deployment.address;
      contract = await ethers.getContractAt("EncryptedHabitMoodTracker", deployment.address);
    } catch (e) {
      (e as Error).message += ". Call 'npx hardhat deploy --network sepolia'";
      throw e;
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { alice: ethSigners[0] };
  });

  beforeEach(async () => {
    step = 0;
    steps = 0;
  });

  it("should add and retrieve a daily record on Sepolia", async function () {
    steps = 12;

    this.timeout(4 * 40000);

    const mood = 4;
    const habitCompletion = 85;

    progress("Encrypting mood...");
    const encryptedMood = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(mood)
      .encrypt();

    progress("Encrypting habit completion...");
    const encryptedHabit = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(habitCompletion)
      .encrypt();

    progress(`Adding daily record: mood=${mood}, habit=${habitCompletion}%...`);
    const tx = await contract
      .connect(signers.alice)
      .addDailyRecord(
        encryptedMood.handles[0],
        encryptedHabit.handles[0],
        encryptedMood.inputProof,
        encryptedHabit.inputProof
      );
    await tx.wait();

    progress("Checking day count...");
    const dayCount = await contract.getDayCount(signers.alice.address);
    expect(dayCount).to.be.gt(0);

    progress("Retrieving encrypted mood...");
    const encryptedMoodResult = await contract.getEncryptedMood(signers.alice.address, 0);

    progress("Decrypting mood...");
    const decryptedMood = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedMoodResult,
      contractAddress,
      signers.alice,
    );
    progress(`Decrypted mood: ${decryptedMood}`);
    expect(decryptedMood).to.eq(mood);

    progress("Retrieving encrypted habit completion...");
    const encryptedHabitResult = await contract.getEncryptedHabitCompletion(signers.alice.address, 0);

    progress("Decrypting habit completion...");
    const decryptedHabit = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedHabitResult,
      contractAddress,
      signers.alice,
    );
    progress(`Decrypted habit completion: ${decryptedHabit}%`);
    expect(decryptedHabit).to.eq(habitCompletion);
  });
});

