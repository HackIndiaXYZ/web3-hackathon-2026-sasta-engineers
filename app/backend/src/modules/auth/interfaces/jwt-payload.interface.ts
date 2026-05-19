import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string; // User ID
  email?: string;
  walletAddress?: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface JwtRefreshPayload {
  sub: string; // User ID
  iat?: number;
  exp?: number;
}
