import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, MaxLength, IsUrl } from 'class-validator';

export class UpdateIssuerDto {
  @ApiPropertyOptional({
    example: 'Stanford University',
    description: 'Organization name',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  organizationName?: string;

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
