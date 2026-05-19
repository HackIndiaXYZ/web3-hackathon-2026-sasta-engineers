import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsDateString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class IssueCredentialDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Student full name',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  studentName: string;

  @ApiPropertyOptional({
    example: 'john@example.com',
    description: 'Student email address',
  })
  @IsEmail()
  @IsOptional()
  studentEmail?: string;

  @ApiPropertyOptional({
    example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    description: 'Student wallet address',
  })
  @IsString()
  @IsOptional()
  @Matches(/^0x[a-fA-F0-9]{40}$/, {
    message: 'Invalid Ethereum address format',
  })
  studentWallet?: string;

  @ApiProperty({
    example: 'Bachelor of Science',
    description: 'Type of credential',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  credentialType: string;

  @ApiProperty({
    example: 'Computer Science',
    description: 'Program or course name',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  programName: string;

  @ApiProperty({
    example: '2024-05-15',
    description: 'Issue date (ISO 8601)',
  })
  @IsDateString()
  issueDate: string;

  @ApiPropertyOptional({
    example: '2029-05-15',
    description: 'Expiry date (ISO 8601)',
  })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @ApiPropertyOptional({
    example: 'Graduated with honors',
    description: 'Additional notes or description',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
