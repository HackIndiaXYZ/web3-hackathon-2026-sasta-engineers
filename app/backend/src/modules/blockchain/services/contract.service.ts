import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import * as CredentialRegistryABI from '../contracts/CredentialRegistry.json';

@Injectable()
export class ContractService {
  private readonly logger = new Logger(ContractService.name);
  private readonly provider: ethers.JsonRpcProvider;
  private readonly wallet: ethers.Wallet;
  private readonly contract: ethers.Contract;
  private readonly contractAddress: string;

  constructor(private readonly configService: ConfigService) {
    const rpcUrl = this.configService.get<string>('blockchain.rpcUrl');
    const privateKey = this.configService.get<string>('blockchain.privateKey');
    this.contractAddress = this.configService.get<string>('blockchain.contractAddress');

    // Initialize provider
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    // Initialize wallet
    this.wallet = new ethers.Wallet(privateKey, this.provider);

    // Initialize contract
    this.contract = new ethers.Contract(
      this.contractAddress,
      CredentialRegistryABI.abi,
      this.wallet,
    );

    this.logger.log(`Contract service initialized with address: ${this.contractAddress}`);
  }

  /**
   * Issue credential on blockchain
   */
  async issueCredential(
    credentialHash: string,
    studentAddress: string,
    metadataURI: string,
  ): Promise<{ txHash: string; blockNumber: number }> {
    try {
      this.logger.log(`Issuing credential on blockchain: ${credentialHash}`);

      const tx = await this.contract.issueCredential(
        credentialHash,
        studentAddress,
        metadataURI,
      );

      this.logger.log(`Transaction sent: ${tx.hash}`);

      const receipt = await tx.wait();

      this.logger.log(
        `Credential issued on blockchain: ${credentialHash} (block: ${receipt.blockNumber})`,
      );

      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      this.logger.error(`Failed to issue credential on blockchain: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Revoke credential on blockchain
   */
  async revokeCredential(
    credentialHash: string,
  ): Promise<{ txHash: string; blockNumber: number }> {
    try {
      this.logger.log(`Revoking credential on blockchain: ${credentialHash}`);

      const tx = await this.contract.revokeCredential(credentialHash);

      this.logger.log(`Transaction sent: ${tx.hash}`);

      const receipt = await tx.wait();

      this.logger.log(
        `Credential revoked on blockchain: ${credentialHash} (block: ${receipt.blockNumber})`,
      );

      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      this.logger.error(
        `Failed to revoke credential on blockchain: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Verify credential on blockchain
   */
  async verifyCredential(credentialHash: string): Promise<{
    exists: boolean;
    isRevoked: boolean;
    issuer: string;
    student: string;
  }> {
    try {
      const result = await this.contract.verifyCredential(credentialHash);

      return {
        exists: result[0],
        isRevoked: result[1],
        issuer: result[2],
        student: result[3],
      };
    } catch (error) {
      this.logger.error(
        `Failed to verify credential on blockchain: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get credential details from blockchain
   */
  async getCredential(credentialHash: string): Promise<{
    credentialHash: string;
    issuer: string;
    student: string;
    issuedAt: number;
    revoked: boolean;
    metadataURI: string;
  }> {
    try {
      const credential = await this.contract.credentials(credentialHash);

      return {
        credentialHash: credential[0],
        issuer: credential[1],
        student: credential[2],
        issuedAt: Number(credential[3]),
        revoked: credential[4],
        metadataURI: credential[5],
      };
    } catch (error) {
      this.logger.error(
        `Failed to get credential from blockchain: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Estimate gas for credential issuance
   */
  async estimateIssueGas(
    credentialHash: string,
    studentAddress: string,
    metadataURI: string,
  ): Promise<bigint> {
    try {
      const gasEstimate = await this.contract.issueCredential.estimateGas(
        credentialHash,
        studentAddress,
        metadataURI,
      );

      return gasEstimate;
    } catch (error) {
      this.logger.error(`Failed to estimate gas: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<bigint> {
    const feeData = await this.provider.getFeeData();
    return feeData.gasPrice || BigInt(0);
  }
}
