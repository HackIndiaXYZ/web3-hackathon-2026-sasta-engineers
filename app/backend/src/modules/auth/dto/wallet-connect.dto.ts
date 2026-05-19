import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '@prisma/client';

export class WalletConnectDto {
  @ApiProperty({
    example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    description: 'Ethereum wallet address',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^0x[a-fA-F0-9]{40}$/, {
    message: 'Invalid Ethereum address format',
  })
  walletAddress: string;

  @ApiProperty({
    example: '0x1234567890abcdef...',
    description: 'Signed message signature',
  })
  @IsString()
  @IsNotEmpty()
  signature: string;

  @ApiProperty({
    example: 'Sign this message to authenticate with ChainCred...',
    description: 'Original message that was signed',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'User name (for new users)',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    enum: UserRole,
    example: UserRole.STUDENT,
    description: 'User role (for new users)',
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
