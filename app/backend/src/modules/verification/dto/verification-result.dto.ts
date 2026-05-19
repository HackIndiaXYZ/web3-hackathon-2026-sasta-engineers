import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VerificationResult } from '@prisma/client';

export class VerificationResultDto {
  @ApiProperty({
    enum: VerificationResult,
    example: VerificationResult.VERIFIED,
    description: 'Verification result',
  })
  result: VerificationResult;

  @ApiProperty({
    example: 'Credential verified successfully',
    description: 'Verification message',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Credential details (if verified)',
  })
  credential?: {
    id: string;
    credentialHash: string;
    issuer: {
      organizationName: string;
      domain?: string;
      logoUrl?: string;
      verified: boolean;
    };
    student: {
      name: string;
      email?: string;
    };
    metadata: any;
    issuedAt: Date;
    revokedAt?: Date;
    revokedReason?: string;
    txHash?: string;
    blockchainVerified: boolean;
  };

  @ApiProperty({
    example: '2024-05-16T10:30:00Z',
    description: 'Verification timestamp',
  })
  verifiedAt: string;

  @ApiProperty({
    example: 'abc123-verification-id',
    description: 'Verification log ID',
  })
  verificationId: string;
}
