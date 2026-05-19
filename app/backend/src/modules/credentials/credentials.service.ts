import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { IssuersService } from '../issuers/issuers.service';
import { Credential, CredentialStatus } from '@prisma/client';
import { IssueCredentialDto } from './dto/issue-credential.dto';
import { QueryCredentialsDto } from './dto/query-credentials.dto';

@Injectable()
export class CredentialsService {
  private readonly logger = new Logger(CredentialsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly blockchainService: BlockchainService,
    private readonly issuersService: IssuersService,
  ) {}

  /**
   * Issue a new credential
   */
  async issueCredential(
    userId: string,
    issueDto: IssueCredentialDto,
    file: Express.Multer.File,
  ): Promise<Credential> {
    // Get issuer profile
    const issuer = await this.issuersService.findByUserId(userId);
    if (!issuer) {
      throw new NotFoundException('Issuer profile not found');
    }

    if (!issuer.verified) {
      throw new ForbiddenException('Only verified issuers can issue credentials');
    }

    // Validate dates
    const issueDate = new Date(issueDto.issueDate);
    const now = new Date();
    if (issueDate > now) {
      throw new BadRequestException('Issue date cannot be in the future');
    }

    if (issueDto.expiryDate) {
      const expiryDate = new Date(issueDto.expiryDate);
      if (expiryDate <= issueDate) {
        throw new BadRequestException('Expiry date must be after issue date');
      }
    }

    // Upload certificate file and compute hash
    const { fileUrl, fileKey, fileHash } = await this.storageService.uploadCertificate(file);

    // Check if credential with same hash already exists
    const existingCredential = await this.prisma.credential.findUnique({
      where: { credentialHash: fileHash },
    });

    if (existingCredential) {
      // Clean up uploaded file
      await this.storageService.deleteFile(fileKey);
      throw new BadRequestException('Credential with this file already exists');
    }

    // Find or create student
    let student = null;
    if (issueDto.studentEmail) {
      student = await this.prisma.user.findUnique({
        where: { email: issueDto.studentEmail },
      });
    } else if (issueDto.studentWallet) {
      student = await this.prisma.user.findUnique({
        where: { walletAddress: issueDto.studentWallet },
      });
    }

    // Create credential in database (pending blockchain confirmation)
    const credential = await this.prisma.credential.create({
      data: {
        issuerId: issuer.id,
        studentId: student?.id,
        credentialHash: fileHash,
        fileUrl,
        status: CredentialStatus.PENDING,
        metadata: {
          studentName: issueDto.studentName,
          studentEmail: issueDto.studentEmail,
          studentWallet: issueDto.studentWallet,
          credentialType: issueDto.credentialType,
          programName: issueDto.programName,
          issueDate: issueDto.issueDate,
          expiryDate: issueDto.expiryDate,
          description: issueDto.description,
        },
        expiryDate: issueDto.expiryDate ? new Date(issueDto.expiryDate) : null,
      },
      include: {
        issuer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            walletAddress: true,
          },
        },
      },
    });

    this.logger.log(`Credential created: ${credential.id} (hash: ${fileHash})`);

    // Issue on blockchain asynchronously
    this.issueOnBlockchain(credential.id, fileHash, issueDto.studentWallet || issuer.walletAddress)
      .catch((error) => {
        this.logger.error(`Blockchain issuance failed for ${credential.id}:`, error);
      });

    return credential;
  }

  /**
   * Issue credential on blockchain (async)
   */
  private async issueOnBlockchain(
    credentialId: string,
    credentialHash: string,
    studentAddress: string,
  ): Promise<void> {
    try {
      // Update status to processing
      await this.prisma.credential.update({
        where: { id: credentialId },
        data: { status: CredentialStatus.PROCESSING },
      });

      // Generate verification URL and upload QR code
      const verificationUrl = this.storageService.generateVerificationUrl(credentialId);
      const qrCodeUrl = await this.storageService.uploadQRCode(credentialId, verificationUrl);

      // Issue on blockchain
      const { txHash } = await this.blockchainService.issueCredential(
        credentialHash,
        studentAddress,
        verificationUrl,
      );

      // Update credential with blockchain data
      await this.prisma.credential.update({
        where: { id: credentialId },
        data: {
          status: CredentialStatus.ISSUED,
          txHash,
          qrCodeUrl,
          metadataUrl: verificationUrl,
        },
      });

      this.logger.log(`Credential issued on blockchain: ${credentialId} (tx: ${txHash})`);
    } catch (error) {
      // Update status to failed
      await this.prisma.credential.update({
        where: { id: credentialId },
        data: {
          status: CredentialStatus.FAILED,
        },
      });

      this.logger.error(`Failed to issue credential on blockchain: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Revoke a credential
   */
  async revokeCredential(
    userId: string,
    credentialId: string,
    reason: string,
  ): Promise<Credential> {
    // Get credential
    const credential = await this.prisma.credential.findUnique({
      where: { id: credentialId },
      include: {
        issuer: true,
      },
    });

    if (!credential) {
      throw new NotFoundException('Credential not found');
    }

    // Check if user is the issuer
    if (credential.issuer.userId !== userId) {
      throw new ForbiddenException('Only the issuer can revoke this credential');
    }

    // Check if already revoked
    if (credential.revoked) {
      throw new BadRequestException('Credential is already revoked');
    }

    // Check if issued on blockchain
    if (credential.status !== CredentialStatus.ISSUED) {
      throw new BadRequestException('Can only revoke credentials that are issued on blockchain');
    }

    // Revoke on blockchain
    await this.blockchainService.revokeCredential(credential.credentialHash);

    // Update credential
    const updatedCredential = await this.prisma.credential.update({
      where: { id: credentialId },
      data: {
        revoked: true,
        revokedAt: new Date(),
        revokedReason: reason,
        status: CredentialStatus.REVOKED,
      },
      include: {
        issuer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            walletAddress: true,
          },
        },
      },
    });

    this.logger.log(`Credential revoked: ${credentialId} - ${reason}`);

    return updatedCredential;
  }

  /**
   * Get credential by ID
   */
  async findById(id: string): Promise<Credential | null> {
    return this.prisma.credential.findUnique({
      where: { id },
      include: {
        issuer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            walletAddress: true,
          },
        },
      },
    });
  }

  /**
   * Get credential by hash
   */
  async findByHash(credentialHash: string): Promise<Credential | null> {
    return this.prisma.credential.findUnique({
      where: { credentialHash },
      include: {
        issuer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            walletAddress: true,
          },
        },
      },
    });
  }

  /**
   * List credentials for issuer
   */
  async findByIssuer(
    userId: string,
    query: QueryCredentialsDto,
  ): Promise<{ credentials: Credential[]; total: number; hasMore: boolean }> {
    const issuer = await this.issuersService.findByUserId(userId);
    if (!issuer) {
      throw new NotFoundException('Issuer profile not found');
    }

    const { skip = 0, take = 20, status, revoked } = query;

    const where: any = { issuerId: issuer.id };
    if (status) where.status = status;
    if (revoked !== undefined) where.revoked = revoked;

    const [credentials, total] = await Promise.all([
      this.prisma.credential.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              walletAddress: true,
            },
          },
        },
      }),
      this.prisma.credential.count({ where }),
    ]);

    return {
      credentials,
      total,
      hasMore: skip + take < total,
    };
  }

  /**
   * List credentials for student
   */
  async findByStudent(
    userId: string,
    query: QueryCredentialsDto,
  ): Promise<{ credentials: Credential[]; total: number; hasMore: boolean }> {
    const { skip = 0, take = 20, status, revoked } = query;

    const where: any = { studentId: userId };
    if (status) where.status = status;
    if (revoked !== undefined) where.revoked = revoked;

    const [credentials, total] = await Promise.all([
      this.prisma.credential.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          issuer: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.credential.count({ where }),
    ]);

    return {
      credentials,
      total,
      hasMore: skip + take < total,
    };
  }
}
