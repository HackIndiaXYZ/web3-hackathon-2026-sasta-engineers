import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsUrl,
} from 'class-validator';

export class RegisterIssuerDto {
  @ApiProperty({
    example: 'Stanford University',
    description: 'Organization name',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  organizationName: string;

  @ApiProperty({
    example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    description: 'Organization wallet address',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^0x[a-fA-F0-9]{40}$/, {
    message: 'Invalid Ethereum address format',
  })
  walletAddress: string;

  @ApiPropertyOptional({
    example: 'stanford.edu',
    description: 'Organization domain',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  domain?: string;

  @ApiPropertyOptional({
    example: 'registrar@stanford.edu',
    description: 'Contact email',
  })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({
    example: '+1-650-723-2300',
    description: 'Contact phone number',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  contactPhone?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/logo.png',
    description: 'Organization logo URL',
  })
  @IsUrl()
  @IsOptional()
  logoUrl?: string;
}
