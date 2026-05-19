import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User, UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new user
   */
  async create(data: {
    name: string;
    email?: string;
    passwordHash?: string;
    walletAddress?: string;
    role: UserRole;
  }): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        walletAddress: data.walletAddress,
        role: data.role,
        emailVerified: false,
      },
    });

    this.logger.log(`User created: ${user.id}`);
    return user;
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find user by wallet address
   */
  async findByWalletAddress(walletAddress: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { walletAddress },
    });
  }

  /**
   * Update user
   */
  async update(
    id: string,
    data: {
      name?: string;
      email?: string;
      walletAddress?: string;
      emailVerified?: boolean;
    },
  ): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data,
    });

    this.logger.log(`User updated: ${user.id}`);
    return user;
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<User> {
    const user = await this.prisma.user.delete({
      where: { id },
    });

    this.logger.log(`User deleted: ${user.id}`);
    return user;
  }

  /**
   * Get user profile with relations
   */
  async getProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        credentials: {
          select: {
            id: true,
            credentialHash: true,
            status: true,
            revoked: true,
            createdAt: true,
            metadata: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        issuer: {
          select: {
            id: true,
            organizationName: true,
            verified: true,
            domain: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Remove sensitive data
    const { passwordHash, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  /**
   * List all users (admin only)
   */
  async findAll(params: {
    skip?: number;
    take?: number;
    role?: UserRole;
  }): Promise<{ users: User[]; total: number }> {
    const { skip = 0, take = 20, role } = params;

    const where = role ? { role } : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          name: true,
          email: true,
          walletAddress: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total };
  }
}
