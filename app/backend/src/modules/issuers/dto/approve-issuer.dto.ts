import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsString, IsOptional } from 'class-validator';

export class ApproveIssuerDto {
  @ApiProperty({
    example: true,
    description: 'Approval status',
  })
  @IsBoolean()
  approved: boolean;

  @ApiPropertyOptional({
    example: 'Verified organization credentials',
    description: 'Approval/rejection reason',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
