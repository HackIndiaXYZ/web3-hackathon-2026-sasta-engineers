import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Issuer } from '@prisma/client';
import { RegisterIssuerDto } from './dto/register-issuer.dto';
import { UpdateIssuerDto } from './dto/update-issuer.dto';
import { QueryIssuersDto } from './dto/query-issuers.dto';

@Injectable()
export class IssuersService {
  private readonly logger = new Logger(IssuersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Register a new issuer (apply for issuer status)
   */
  async register(userId: string, registerDto: RegisterIssuerDto): Promise<Issuer> {
    const { organizationName, walletAddress, domain, contactEmail, contactPhone, logoUrl } =
      registerDto;

    // Check if user already has an issuer profile
    const existingIssuer = await this.prisma.issuer.findUnique({
      where: { userId },
    });

    if (existingIssuer) {
      throw new ConflictException('User already has an issuer profile');
    }

    // Check if wallet address is already used
    const walletExists = await this.prisma.issuer.findUnique({
      where: { walletAddress },
    });

    if (walletExists) {
      throw new ConflictException('Wallet address already registered');
    }

    // Check if domain is already used
    if (domain) {
      const domainExists = await this.prisma.issuer.findUnique({
        where: { domain },
      });

      if (domainExists) {
        throw new ConflictException('Domain already registered');
      }
    }

    // Create issuer profile (unverified by default)
    const issuer = await this.prisma.issuer.create({
      data: {
        userId,
        organizationName,
        walletAddress,
        domain,
        contactEmail,
        contactPhone,
        logoUrl,
        verified: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    this.logger.log(`Issuer registered: ${issuer.id} (${organizationName})`);

    return issuer;
  }

  /**
   * Approve or reject issuer application (Admin only)
   */
  async approve(issuerId: string, approved: boolean, reason?: string): Promise<Issuer> {
    const issuer = await this.prisma.issuer.findUnique({
      where: { id: issuerId },
    });

    if (!issuer) {
      throw new NotFoundException('Issuer not found');
    }

    if (issuer.verified && approved) {
      throw new BadRequestException('Issuer is already verified');
    }

    const updatedIssuer = await this.prisma.issuer.update({
      where: { id: issuerId },
      data: {
        verified: approved,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    this.logger.log(
      `Issuer ${approved ? 'approved' : 'rejected'}: ${issuerId} - ${reason || 'No reason provided'}`,
    );

    // TODO: Send notification email to issuer
    // await this.notificationsService.sendIssuerApprovalEmail(updatedIssuer, approved, reason);

    return updatedIssuer;
  }

  /**
   * Get issuer by ID
   */
  async findById(id: string): Promise<Issuer | null> {
    return this.prisma.issuer.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Get issuer by user ID
   */
  async findByUserId(userId: string): Promise<Issuer | null> {
    return this.prisma.issuer.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Get issuer by wallet address
   */
  async findByWalletAddress(walletAddress: string): Promise<Issuer | null> {
    return this.prisma.issuer.findUnique({
      where: { walletAddress },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Update issuer profile
   */
  async update(userId: string, updateDto: UpdateIssuerDto): Promise<Issuer> {
    const issuer = await this.prisma.issuer.findUnique({
      where: { userId },
    });

    if (!issuer) {
      throw new NotFoundException('Issuer profile not found');
    }

    // Check domain uniqueness if being updated
    if (updateDto.domain && updateDto.domain !== issuer.domain) {
      const domainExists = await this.prisma.issuer.findUnique({
        where: { domain: updateDto.domain },
      });

      if (domainExists) {
        throw new ConflictException('Domain already registered');
      }
    }

    const updatedIssuer = await this.prisma.issuer.update({
      where: { userId },
      data: updateDto,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    this.logger.log(`Issuer updated: ${updatedIssuer.id}`);

    return updatedIssuer;
  }

  /**
   * Get issuer profile with statistics
   */
  async getProfile(userId: string) {
    const issuer = await this.prisma.issuer.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        credentials: {
          select: {
            id: true,
            credentialHash: true,
            status: true,
            revoked: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10, // Latest 10 credentials
        },
      },
    });

    if (!issuer) {
      throw new NotFoundException('Issuer profile not found');
    }

    // Get statistics
    const [totalIssued, totalRevoked, totalVerifications] = await Promise.all([
      this.prisma.credential.count({
        where: { issuerId: issuer.id },
      }),
      this.prisma.credential.count({
        where: { issuerId: issuer.id, revoked: true },
      }),
      this.prisma.verificationLog.count({
        where: {
          credential: {
            issuerId: issuer.id,
          },
        },
      }),
    ]);

    return {
      ...issuer,
      statistics: {
        totalIssued,
        totalRevoked,
        totalActive: totalIssued - totalRevoked,
        totalVerifications,
      },
    };
  }

  /**
   * List all issuers with pagination and filters
   */
  async findAll(query: QueryIssuersDto): Promise<{
    issuers: Issuer[];
    total: number;
    hasMore: boolean;
  }> {
    const { skip = 0, take = 20, verified } = query;

    const where = verified !== undefined ? { verified } : {};

    const [issuers, total] = await Promise.all([
      this.prisma.issuer.findMany({
        where,
        skip,
        take,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          _count: {
            select: {
              credentials: true,
            },
          },
        },
      }),
      this.prisma.issuer.count({ where }),
    ]);

    return {
      issuers,
      total,
      hasMore: skip + take < total,
    };
  }

  /**
   * Get pending issuer applications (Admin only)
   */
  async getPendingApplications(): Promise<Issuer[]> {
    return this.prisma.issuer.findMany({
      where: { verified: false },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });
  }

  /**
   * Check if user is a verified issuer
   */
  async isVerifiedIssuer(userId: string): Promise<boolean> {
    const issuer = await this.prisma.issuer.findUnique({
      where: { userId },
      select: { verified: true },
    });

    return issuer?.verified || false;
  }

  /**
   * Delete issuer profile (Admin only)
   */
  async delete(issuerId: string): Promise<Issuer> {
    const issuer = await this.prisma.issuer.findUnique({
      where: { id: issuerId },
    });

    if (!issuer) {
      throw new NotFoundException('Issuer not found');
    }

    // Check if issuer has issued credentials
    const credentialCount = await this.prisma.credential.count({
      where: { issuerId },
    });

    if (credentialCount > 0) {
      throw new BadRequestException(
        'Cannot delete issuer with issued credentials. Revoke all credentials first.',
      );
    }

    const deletedIssuer = await this.prisma.issuer.delete({
      where: { id: issuerId },
    });

    this.logger.log(`Issuer deleted: ${issuerId}`);

    return deletedIssuer;
  }
}
