import { ApiProperty } from '@nestjs/swagger';

export class VerifyFileDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Certificate PDF file to verify',
  })
  certificate: any;
}
