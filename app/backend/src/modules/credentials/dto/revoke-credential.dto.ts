import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class RevokeCredentialDto {
  @ApiProperty({
    example: 'Credential issued in error',
    description: 'Reason for revocation',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
