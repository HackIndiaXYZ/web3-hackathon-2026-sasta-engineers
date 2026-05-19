import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { CredentialStatus } from '@prisma/client';

export class QueryCredentialsDto {
  @ApiPropertyOptional({
    example: 0,
    description: 'Number of records to skip',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number = 0;

  @ApiPropertyOptional({
    example: 20,
    description: 'Number of records to take',
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number = 20;

  @ApiPropertyOptional({
    enum: CredentialStatus,
    description: 'Filter by credential status',
  })
  @IsOptional()
  @IsEnum(CredentialStatus)
  status?: CredentialStatus;

  @ApiPropertyOptional({
    example: false,
    description: 'Filter by revocation status',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  revoked?: boolean;
}
