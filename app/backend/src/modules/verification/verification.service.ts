import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CredentialsService } from '../credentials/credentials.service';
import { VerificationResult, CredentialStatus } from '@prisma/client';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly blockchainService: BlockchainService,
    private readonly credentialsService: CredentialsService,
  ) {}

  /**
   * Verify credential by file upload
   */
  async verifyByFile(
    file: Express.Multer.File,
    verifierIp?: string,
  ): Promise<{
    result: VerificationResult;
    message: string;
    credential?: any;
    verifiedAt: string;
    verificationId: string;
  }> {
    this.logger.log('Starting file verification');

    // Validate file
    this.storageService.validateFile(file);

    // Compute file hash
    const fileHash = this.storageService.computeFileHash(file.buffer);
    this.logger.log(`File hash computed: ${fileHash}`);

    // Find credential by hash
    const credential = await this.credentialsService.findByHash(fileHash);

    if (!credential) {
      // Credential not found in database
      const verificationLog = await this.logVerification(
        null,
        VerificationResult.INVALID,
        verifierIp,
        { reason: 'Credential not found in database' },
      );

      return {
        result: VerificationResult.INVALID,
        message: 'This credential is not registered in our system',
        verifiedAt: new Date().toISOString(),
        verificationId: verificationLog.id,
      };
    }

    // Check if credential is revoked
    if (credential.revoked) {
      const verificationLog = await this.logVerification(
        credential.id,
        VerificationResult.REVOKED,
        verifierIp,
        {
          revokedAt: credential.revokedAt,
          revokedReason: credential.revokedReason,
        },
      );

      return {
        result: VerificationResult.REVOKED,
        message: `This credential has been revoked. Reason: ${credential.revokedReason || 'Not specified'}`,
        credential: this.formatCredentialResponse(credential, false),
        verifiedAt: new Date().toISOString(),
        verificationId: verificationLog.id,
      };
    }

    // Check if credential is issued on blockchain
    if (credential.status !== CredentialStatus.ISSUED) {
      const verificationLog = await this.logVerification(
        credential.id,
        VerificationResult.INVALID,
        verifierIp,
        { reason: 'Credential not yet issued on blockchain', status: credential.status },
      );

      return {
        result: VerificationResult.INVALID,
        message: 'This credential is pending blockchain confirmation',
        verifiedAt: new Date().toISOString(),
        verificationId: verificationLog.id,
      };
    }

    // Verify on blockchain
    let blockchainVerified = false;
    try {
      const blockchainResult = await this.blockchainService.verifyCredential(fileHash);

      if (!blockchainResult.exists) {
        // Credential not found on blockchain (data inconsistency)
        const verificationLog = await this.logVerification(
          credential.id,
          VerificationResult.TAMPERED,
          verifierIp,
          { reason: 'Credential not found on blockchain' },
        );

        return {
          result: VerificationResult.TAMPERED,
          message: 'Credential data inconsistency detected. Please contact the issuer.',
          verifiedAt: new Date().toISOString(),
          verificationId: verificationLog.id,
        };
      }

      if (blockchainResult.isRevoked) {
        // Revoked on blockchain but not in database (sync issue)
        const verificationLog = await this.logVerification(
          credential.id,
          VerificationResult.REVOKED,
          verifierIp,
          { reason: 'Revoked on blockchain' },
        );

        return {
          result: VerificationResult.REVOKED,
          message: 'This credential has been revoked on the blockchain',
          credential: this.formatCredentialResponse(credential, true),
          verifiedAt: new Date().toISOString(),
          verificationId: verificationLog.id,
        };
      }

      blockchainVerified = true;
    } catch (error) {
      this.logger.error(`Blockchain verification failed: ${error.message}`, error.stack);
      // Continue with database verification only
    }

    // Credential is valid
    const verificationLog = await this.logVerification(
      credential.id,
      VerificationResult.VERIFIED,
      verifierIp,
      { blockchainVerified },
    );

    return {
      result: VerificationResult.VERIFIED,
      message: 'Credential verified successfully',
      credential: this.formatCredentialResponse(credential, blockchainVerified),
      verifiedAt: new Date().toISOString(),
      verificationId: verificationLog.id,
    };
  }

  /**
   * Verify credential by ID (QR code verification)
   */
  async verifyById(
    credentialId: string,
    verifierIp?: string,
  ): Promise<{
    result: VerificationResult;
    message: string;
    credential?: any;
    verifiedAt: string;
    verificationId: string;
  }> {
    this.logger.log(`Verifying credential by ID: ${credentialId}`);

    // Find credential
    const credential = await this.credentialsService.findById(credentialId);

    if (!credential) {
      throw new NotFoundException('Credential not found');
    }

    // Check if revoked
    if (credential.revoked) {
      const verificationLog = await this.logVerification(
        credential.id,
        VerificationResult.REVOKED,
        verifierIp,
        {
          revokedAt: credential.revokedAt,
          revokedReason: credential.revokedReason,
        },
      );

      return {
        result: VerificationResult.REVOKED,
        message: `This credential has been revoked. Reason: ${credential.revokedReason || 'Not specified'}`,
        credential: this.formatCredentialResponse(credential, false),
        verifiedAt: new Date().toISOString(),
        verificationId: verificationLog.id,
      };
    }

    // Check if issued
    if (credential.status !== CredentialStatus.ISSUED) {
      const verificationLog = await this.logVerification(
        credential.id,
        VerificationResult.INVALID,
        verifierIp,
        { reason: 'Credential not yet issued', status: credential.status },
      );

      return {
        result: VerificationResult.INVALID,
        message: 'This credential is pending blockchain confirmation',
        verifiedAt: new Date().toISOString(),
        verificationId: verificationLog.id,
      };
    }

    // Verify on blockchain
    let blockchainVerified = false;
    try {
      const blockchainResult = await this.blockchainService.verifyCredential(
        credential.credentialHash,
      );

      if (!blockchainResult.exists || blockchainResult.isRevoked) {
        const verificationLog = await this.logVerification(
          credential.id,
          VerificationResult.TAMPERED,
          verifierIp,
          { reason: 'Blockchain verification failed' },
        );

        return {
          result: VerificationResult.TAMPERED,
          message: 'Credential verification failed on blockchain',
          verifiedAt: new Date().toISOString(),
          verificationId: verificationLog.id,
        };
      }

      blockchainVerified = true;
    } catch (error) {
      this.logger.error(`Blockchain verification failed: ${error.message}`, error.stack);
    }

    // Credential is valid
    const verificationLog = await this.logVerification(
      credential.id,
      VerificationResult.VERIFIED,
      verifierIp,
      { blockchainVerified },
    );

    return {
      result: VerificationResult.VERIFIED,
      message: 'Credential verified successfully',
      credential: this.formatCredentialResponse(credential, blockchainVerified),
      verifiedAt: new Date().toISOString(),
      verificationId: verificationLog.id,
    };
  }

  /**
   * Get public credential details for verification page
   */
  async getPublicCredential(credentialId: string) {
    const credential = await this.credentialsService.findById(credentialId);

    if (!credential) {
      throw new NotFoundException('Credential not found');
    }

    return this.formatCredentialResponse(credential, false);
  }

  /**
   * Get verification statistics for a credential
   */
  async getVerificationStats(credentialId: string) {
    const [totalVerifications, verificationsByResult] = await Promise.all([
      this.prisma.verificationLog.count({
        where: { credentialId },
      }),
      this.prisma.verificationLog.groupBy({
        by: ['verificationResult'],
        where: { credentialId },
        _count: true,
      }),
    ]);

    const recentVerifications = await this.prisma.verificationLog.findMany({
      where: { credentialId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        verificationResult: true,
        createdAt: true,
        verifierIp: true,
      },
    });

    return {
      totalVerifications,
      verificationsByResult: verificationsByResult.reduce(
        (acc, item) => {
          acc[item.verificationResult] = item._count;
          return acc;
        },
        {} as Record<string, number>,
      ),
      recentVerifications,
    };
  }

  /**
   * Log verification attempt
   */
  private async logVerification(
    credentialId: string | null,
    result: VerificationResult,
    verifierIp?: string,
    metadata?: any,
  ) {
    return this.prisma.verificationLog.create({
      data: {
        credentialId,
        verificationResult: result,
        verifierIp,
        metadata: metadata || {},
      },
    });
  }

  /**
   * Format credential response for public display
   */
  private formatCredentialResponse(credential: any, blockchainVerified: boolean) {
    return {
      id: credential.id,
      credentialHash: credential.credentialHash,
      issuer: {
        organizationName: credential.issuer.organizationName,
        domain: credential.issuer.domain,
        logoUrl: credential.issuer.logoUrl,
        verified: credential.issuer.verified,
      },
      student: {
        name: credential.metadata.studentName || credential.student?.name,
        email: credential.metadata.studentEmail || credential.student?.email,
      },
      metadata: credential.metadata,
      issuedAt: credential.createdAt,
      revokedAt: credential.revokedAt,
      revokedReason: credential.revokedReason,
      txHash: credential.txHash,
      qrCodeUrl: credential.qrCodeUrl,
      fileUrl: credential.fileUrl,
      blockchainVerified,
    };
  }
}
