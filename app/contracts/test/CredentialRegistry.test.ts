import { expect } from "chai";
import { ethers } from "hardhat";
import { CredentialRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("CredentialRegistry", function () {
  let credentialRegistry: CredentialRegistry;
  let admin: SignerWithAddress;
  let issuer: SignerWithAddress;
  let student: SignerWithAddress;
  let unauthorized: SignerWithAddress;

  const ISSUER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ISSUER_ROLE"));
  const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));

  const credentialHash = ethers.keccak256(ethers.toUtf8Bytes("credential-data"));
  const metadataURI = "https://api.chaincred.com/credentials/123";

  beforeEach(async function () {
    [admin, issuer, student, unauthorized] = await ethers.getSigners();

    const CredentialRegistryFactory = await ethers.getContractFactory("CredentialRegistry");
    credentialRegistry = await CredentialRegistryFactory.deploy();
    await credentialRegistry.waitForDeployment();

    // Grant issuer role
    await credentialRegistry.connect(admin).addIssuer(issuer.address);
  });

  describe("Deployment", function () {
    it("Should set the deployer as admin", async function () {
      expect(await credentialRegistry.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
    });

    it("Should not pause on deployment", async function () {
      expect(await credentialRegistry.paused()).to.be.false;
    });
  });

  describe("Issuer Management", function () {
    it("Should allow admin to add issuer", async function () {
      const newIssuer = unauthorized.address;
      await expect(credentialRegistry.connect(admin).addIssuer(newIssuer))
        .to.emit(credentialRegistry, "IssuerAdded")
        .withArgs(newIssuer, admin.address);

      expect(await credentialRegistry.isIssuer(newIssuer)).to.be.true;
    });

    it("Should allow admin to remove issuer", async function () {
      await expect(credentialRegistry.connect(admin).removeIssuer(issuer.address))
        .to.emit(credentialRegistry, "IssuerRemoved")
        .withArgs(issuer.address, admin.address);

      expect(await credentialRegistry.isIssuer(issuer.address)).to.be.false;
    });

    it("Should not allow non-admin to add issuer", async function () {
      await expect(
        credentialRegistry.connect(unauthorized).addIssuer(unauthorized.address)
      ).to.be.reverted;
    });

    it("Should not allow adding zero address as issuer", async function () {
      await expect(
        credentialRegistry.connect(admin).addIssuer(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid issuer address");
    });
  });

  describe("Credential Issuance", function () {
    it("Should allow issuer to issue credential", async function () {
      await expect(
        credentialRegistry
          .connect(issuer)
          .issueCredential(credentialHash, student.address, metadataURI)
      )
        .to.emit(credentialRegistry, "CredentialIssued")
        .withArgs(credentialHash, issuer.address, student.address, await ethers.provider.getBlock('latest').then(b => b!.timestamp + 1), metadataURI);

      expect(await credentialRegistry.credentialExists(credentialHash)).to.be.true;
    });

    it("Should store credential details correctly", async function () {
      await credentialRegistry
        .connect(issuer)
        .issueCredential(credentialHash, student.address, metadataURI);

      const credential = await credentialRegistry.getCredential(credentialHash);
      expect(credential.credentialHash).to.equal(credentialHash);
      expect(credential.issuer).to.equal(issuer.address);
      expect(credential.student).to.equal(student.address);
      expect(credential.revoked).to.be.false;
      expect(credential.metadataURI).to.equal(metadataURI);
    });

    it("Should increment issuer credential count", async function () {
      await credentialRegistry
        .connect(issuer)
        .issueCredential(credentialHash, student.address, metadataURI);

      expect(await credentialRegistry.getIssuerStats(issuer.address)).to.equal(1);
    });

    it("Should increment student credential count", async function () {
      await credentialRegistry
        .connect(issuer)
        .issueCredential(credentialHash, student.address, metadataURI);

      expect(await credentialRegistry.getStudentStats(student.address)).to.equal(1);
    });

    it("Should not allow non-issuer to issue credential", async function () {
      await expect(
        credentialRegistry
          .connect(unauthorized)
          .issueCredential(credentialHash, student.address, metadataURI)
      ).to.be.reverted;
    });

    it("Should not allow duplicate credential hash", async function () {
      await credentialRegistry
        .connect(issuer)
        .issueCredential(credentialHash, student.address, metadataURI);

      await expect(
        credentialRegistry
          .connect(issuer)
          .issueCredential(credentialHash, student.address, metadataURI)
      ).to.be.revertedWith("Credential already exists");
    });

    it("Should not allow zero hash", async function () {
      await expect(
        credentialRegistry
          .connect(issuer)
          .issueCredential(ethers.ZeroHash, student.address, metadataURI)
      ).to.be.revertedWith("Invalid credential hash");
    });

    it("Should not allow zero student address", async function () {
      await expect(
        credentialRegistry
          .connect(issuer)
          .issueCredential(credentialHash, ethers.ZeroAddress, metadataURI)
      ).to.be.revertedWith("Invalid student address");
    });

    it("Should not allow empty metadata URI", async function () {
      await expect(
        credentialRegistry
          .connect(issuer)
          .issueCredential(credentialHash, student.address, "")
      ).to.be.revertedWith("Metadata URI required");
    });
  });

  describe("Credential Verification", function () {
    beforeEach(async function () {
      await credentialRegistry
        .connect(issuer)
        .issueCredential(credentialHash, student.address, metadataURI);
    });

    it("Should verify existing credential", async function () {
      const result = await credentialRegistry.verifyCredential(credentialHash);
      expect(result.exists).to.be.true;
      expect(result.isRevoked).to.be.false;
      expect(result.issuer).to.equal(issuer.address);
      expect(result.student).to.equal(student.address);
    });

    it("Should return false for non-existent credential", async function () {
      const fakeHash = ethers.keccak256(ethers.toUtf8Bytes("fake"));
      const result = await credentialRegistry.verifyCredential(fakeHash);
      expect(result.exists).to.be.false;
    });

    it("Should be callable by anyone", async function () {
      const result = await credentialRegistry
        .connect(unauthorized)
        .verifyCredential(credentialHash);
      expect(result.exists).to.be.true;
    });
  });

  describe("Credential Revocation", function () {
    beforeEach(async function () {
      await credentialRegistry
        .connect(issuer)
        .issueCredential(credentialHash, student.address, metadataURI);
    });

    it("Should allow issuer to revoke credential", async function () {
      await expect(credentialRegistry.connect(issuer).revokeCredential(credentialHash))
        .to.emit(credentialRegistry, "CredentialRevoked")
        .withArgs(credentialHash, issuer.address, await ethers.provider.getBlock('latest').then(b => b!.timestamp + 1));

      const credential = await credentialRegistry.getCredential(credentialHash);
      expect(credential.revoked).to.be.true;
    });

    it("Should update verification result after revocation", async function () {
      await credentialRegistry.connect(issuer).revokeCredential(credentialHash);

      const result = await credentialRegistry.verifyCredential(credentialHash);
      expect(result.isRevoked).to.be.true;
    });

    it("Should not allow non-issuer to revoke", async function () {
      await expect(
        credentialRegistry.connect(unauthorized).revokeCredential(credentialHash)
      ).to.be.reverted;
    });

    it("Should not allow revoking non-existent credential", async function () {
      const fakeHash = ethers.keccak256(ethers.toUtf8Bytes("fake"));
      await expect(
        credentialRegistry.connect(issuer).revokeCredential(fakeHash)
      ).to.be.revertedWith("Credential does not exist");
    });

    it("Should not allow revoking already revoked credential", async function () {
      await credentialRegistry.connect(issuer).revokeCredential(credentialHash);

      await expect(
        credentialRegistry.connect(issuer).revokeCredential(credentialHash)
      ).to.be.revertedWith("Credential already revoked");
    });

    it("Should not allow different issuer to revoke", async function () {
      const [, , , , otherIssuer] = await ethers.getSigners();
      await credentialRegistry.connect(admin).addIssuer(otherIssuer.address);

      await expect(
        credentialRegistry.connect(otherIssuer).revokeCredential(credentialHash)
      ).to.be.revertedWith("Not the credential issuer");
    });
  });

  describe("Batch Issuance", function () {
    it("Should allow batch issuing credentials", async function () {
      const hashes = [
        ethers.keccak256(ethers.toUtf8Bytes("cred1")),
        ethers.keccak256(ethers.toUtf8Bytes("cred2")),
        ethers.keccak256(ethers.toUtf8Bytes("cred3")),
      ];
      const students = [student.address, student.address, student.address];
      const uris = ["uri1", "uri2", "uri3"];

      await credentialRegistry
        .connect(issuer)
        .batchIssueCredentials(hashes, students, uris);

      expect(await credentialRegistry.credentialExists(hashes[0])).to.be.true;
      expect(await credentialRegistry.credentialExists(hashes[1])).to.be.true;
      expect(await credentialRegistry.credentialExists(hashes[2])).to.be.true;
      expect(await credentialRegistry.getIssuerStats(issuer.address)).to.equal(3);
    });

    it("Should not allow batch with mismatched array lengths", async function () {
      const hashes = [ethers.keccak256(ethers.toUtf8Bytes("cred1"))];
      const students = [student.address, student.address];
      const uris = ["uri1"];

      await expect(
        credentialRegistry.connect(issuer).batchIssueCredentials(hashes, students, uris)
      ).to.be.revertedWith("Array length mismatch");
    });

    it("Should not allow batch size over 50", async function () {
      const hashes = Array(51).fill(ethers.keccak256(ethers.toUtf8Bytes("cred")));
      const students = Array(51).fill(student.address);
      const uris = Array(51).fill("uri");

      await expect(
        credentialRegistry.connect(issuer).batchIssueCredentials(hashes, students, uris)
      ).to.be.revertedWith("Batch size too large");
    });
  });

  describe("Pause Functionality", function () {
    it("Should allow admin to pause", async function () {
      await credentialRegistry.connect(admin).pause();
      expect(await credentialRegistry.paused()).to.be.true;
    });

    it("Should allow admin to unpause", async function () {
      await credentialRegistry.connect(admin).pause();
      await credentialRegistry.connect(admin).unpause();
      expect(await credentialRegistry.paused()).to.be.false;
    });

    it("Should not allow issuing when paused", async function () {
      await credentialRegistry.connect(admin).pause();

      await expect(
        credentialRegistry
          .connect(issuer)
          .issueCredential(credentialHash, student.address, metadataURI)
      ).to.be.reverted;
    });

    it("Should not allow non-admin to pause", async function () {
      await expect(credentialRegistry.connect(unauthorized).pause()).to.be.reverted;
    });
  });
});
