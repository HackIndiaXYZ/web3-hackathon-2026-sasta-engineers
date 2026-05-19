import { UserRole } from '@prisma/client';

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email?: string;
    walletAddress?: string;
    role: UserRole;
    emailVerified: boolean;
    createdAt: Date;
  };
  accessToken: string;
  refreshToken: string;
}
