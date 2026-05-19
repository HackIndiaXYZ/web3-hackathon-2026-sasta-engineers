// User Types
export enum UserRole {
  ADMIN = 'ADMIN',
  ISSUER = 'ISSUER',
  STUDENT = 'STUDENT',
  VERIFIER = 'VERIFIER',
}

export interface User {
  id: string;
  name: string;
  email: string | null;
  walletAddress: string | null;
  role: UserRole;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Issuer Types
export enum IssuerStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export interface Issuer {
  id: string;
  userId: string;
  organizationName: string;
  domain: string;
  walletAddress: string;
  status: IssuerStatus;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: User;
  _count?: {
    credentials: number;
  };
}

// Credential Types
export enum CredentialStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  ISSUED = 'ISSUED',
  FAILED = 'FAILED',
  REVOKED = 'REVOKED',
}

export interface Credential {
  id: string;
  issuerId: string;
  studentId: string;
  credentialType: string;
  credentialHash: string;
  fileUrl: string;
  qrCodeUrl: string | null;
  status: CredentialStatus;
  transactionHash: string | null;
  blockNumber: number | null;
  issuedAt: string | null;
  revokedAt: string | null;
  revocationReason: string | null;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  issuer?: Issuer;
  student?: User;
}

// Verification Types
export enum VerificationStatus {
  VERIFIED = 'VERIFIED',
  INVALID = 'INVALID',
  REVOKED = 'REVOKED',
  TAMPERED = 'TAMPERED',
}

export interface VerificationResult {
  status: VerificationStatus;
  credential: Credential | null;
  message: string;
  verifiedAt: string;
  blockchainVerified: boolean;
}

export interface VerificationLog {
  id: string;
  credentialId: string;
  verifierId: string | null;
  status: VerificationStatus;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface WalletConnectRequest {
  walletAddress: string;
  signature: string;
  message: string;
  name?: string;
  role?: UserRole;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// Form Types
export interface IssueCredentialForm {
  studentEmail: string;
  credentialType: string;
  file: File;
  metadata: {
    courseName?: string;
    grade?: string;
    issueDate?: string;
    expiryDate?: string;
    [key: string]: any;
  };
}

export interface UpdateProfileForm {
  name: string;
  email?: string;
  walletAddress?: string;
}

export interface IssuerRegistrationForm {
  organizationName: string;
  domain: string;
  walletAddress: string;
}

// Dashboard Stats Types
export interface IssuerStats {
  totalCredentials: number;
  issuedCredentials: number;
  pendingCredentials: number;
  revokedCredentials: number;
}

export interface StudentStats {
  totalCredentials: number;
  verificationCount: number;
}

export interface AdminStats {
  totalUsers: number;
  totalIssuers: number;
  totalCredentials: number;
  pendingIssuers: number;
}

// Blockchain Types
export interface BlockchainCredential {
  credentialHash: string;
  issuer: string;
  student: string;
  issuedAt: number;
  revoked: boolean;
  metadataURI: string;
}
