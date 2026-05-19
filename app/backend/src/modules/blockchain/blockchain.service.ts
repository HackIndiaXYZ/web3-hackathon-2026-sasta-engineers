import { Injectable, Logger } from '@nestjs/common';
import { ContractService } from './services/contract.service';

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);

  constructor(private readonly contractService: ContractService) {}

  /**
   * Issue credential on blockchain
   */
  async issueCredential(
    credentialHash: string,
    studentAddress: string,
    metadataURI: string,
  ): Promise<{ txHash: string; blockNumber: number }> {
    this.logger.log(`Processing blockchain issuance for: ${credentialHash}`);

    const result = await this.contractService.issueCredential(
      credentialHash,
      studentAddress,
      metadataURI,
    );

    this.logger.log(`Blockchain issuance completed: ${result.txHash}`);

    return result;
  }

  /**
   * Revoke credential on blockchain
   */
  async revokeCredential(
    credentialHash: string,
  ): Promise<{ txHash: string; blockNumber: number }> {
    this.logger.log(`Processing blockchain revocation for: ${credentialHash}`);

    const result = await this.contractService.revokeCredential(credentialHash);

    this.logger.log(`Blockchain revocation completed: ${result.txHash}`);

    return result;
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
    return this.contractService.verifyCredential(credentialHash);
  }

  /**
   * Get credential details from blockchain
   */
  async getCredential(credentialHash: string) {
    return this.contractService.getCredential(credentialHash);
  }

  /**
   * Estimate gas cost for issuance
   */
  async estimateIssuanceCost(
    credentialHash: string,
    studentAddress: string,
    metadataURI: string,
  ): Promise<{ gasEstimate: string; gasCost: string }> {
    const gasEstimate = await this.contractService.estimateIssueGas(
      credentialHash,
      studentAddress,
      metadataURI,
    );

    const gasPrice = await this.contractService.getGasPrice();
    const gasCost = gasEstimate * gasPrice;

    return {
      gasEstimate: gasEstimate.toString(),
      gasCost: gasCost.toString(),
    };
  }
}
