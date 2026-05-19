import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { ethers } from 'ethers';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { WalletConnectDto } from './dto/wallet-connect.dto';
import { AuthResponse } from './interfaces/auth-response.interface';
import { JwtPayload, JwtRefreshPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register a new user with email/password or wallet
   */
  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, password, walletAddress, name, role } = registerDto;

    // Validate that either email+password or walletAddress is provided
    if (!email && !walletAddress) {
      throw new BadRequestException('Either email or wallet address must be provided');
    }

    if (email && !password) {
      throw new BadRequestException('Password is required when email is provided');
    }

    // Check if user already exists
    if (email) {
      const existingUser = await this.usersService.findByEmail(email);
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    if (walletAddress) {
      const existingUser = await this.usersService.findByWalletAddress(walletAddress);
      if (existingUser) {
        throw new ConflictException('User with this wallet address already exists');
      }
    }

    // Hash password if provided
    let passwordHash: string | undefined;
    if (password) {
      passwordHash = await this.hashPassword(password);
    }

    // Create user
    const user = await this.usersService.create({
      name,
      email,
      passwordHash,
      walletAddress,
      role,
    });

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user);

    this.logger.log(`User registered: ${user.id} (${email || walletAddress})`);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        walletAddress: user.walletAddress,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login with email and password
   */
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    if (!user.passwordHash) {
      throw new UnauthorizedException('Password authentication not available for this account');
    }

    const isPasswordValid = await this.verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user);

    this.logger.log(`User logged in: ${user.id} (${email})`);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        walletAddress: user.walletAddress,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Authenticate with wallet signature
   */
  async walletConnect(walletConnectDto: WalletConnectDto): Promise<AuthResponse> {
    const { walletAddress, signature, message, name, role } = walletConnectDto;

    // Verify signature
    const isValidSignature = await this.verifyWalletSignature(
      message,
      signature,
      walletAddress,
    );

    if (!isValidSignature) {
      throw new UnauthorizedException('Invalid signature');
    }

    // Find or create user
    let user = await this.usersService.findByWalletAddress(walletAddress);

    if (!user) {
      // Create new user if not exists
      if (!name || !role) {
        throw new BadRequestException('Name and role are required for new users');
      }

      user = await this.usersService.create({
        name,
        walletAddress,
        role,
      });

      this.logger.log(`New user created via wallet: ${user.id} (${walletAddress})`);
    }

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user);

    this.logger.log(`User authenticated via wallet: ${user.id} (${walletAddress})`);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        walletAddress: user.walletAddress,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify<JwtRefreshPayload>(refreshToken, {
        secret: this.configService.get<string>('app.jwtRefreshSecret'),
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const accessToken = await this.generateAccessToken(user);

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(user: any): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    return { accessToken, refreshToken };
  }

  /**
   * Generate access token
   */
  private async generateAccessToken(user: any): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      walletAddress: user.walletAddress,
      role: user.role,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('app.jwtSecret'),
      expiresIn: this.configService.get<string>('app.jwtExpiresIn'),
    });
  }

  /**
   * Generate refresh token
   */
  private async generateRefreshToken(user: any): Promise<string> {
    const payload: JwtRefreshPayload = {
      sub: user.id,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('app.jwtRefreshSecret'),
      expiresIn: this.configService.get<string>('app.jwtRefreshExpiresIn'),
    });
  }

  /**
   * Hash password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password against hash
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Verify wallet signature
   */
  private async verifyWalletSignature(
    message: string,
    signature: string,
    expectedAddress: string,
  ): Promise<boolean> {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    } catch (error) {
      this.logger.error('Signature verification failed', error);
      return false;
    }
  }

  /**
   * Validate user from JWT payload
   */
  async validateUser(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}
