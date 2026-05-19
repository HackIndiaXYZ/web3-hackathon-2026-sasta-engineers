import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  Ip,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { VerificationService } from './verification.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('verification')
@Controller('verify')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Public()
  @Post()
  @UseInterceptors(FileInterceptor('certificate'))
  @ApiOperation({ summary: 'Verify credential by file upload (Public)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Verification result returned' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['certificate'],
      properties: {
        certificate: {
          type: 'string',
          format: 'binary',
          description: 'Certificate PDF file to verify',
        },
      },
    },
  })
  async verifyByFile(@UploadedFile() file: Express.Multer.File, @Ip() ip: string) {
    if (!file) {
      throw new Error('Certificate file is required');
    }

    return this.verificationService.verifyByFile(file, ip);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Verify credential by ID (QR code verification) (Public)' })
  @ApiResponse({ status: 200, description: 'Verification result returned' })
  @ApiResponse({ status: 404, description: 'Credential not found' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async verifyById(@Param('id', ParseUUIDPipe) id: string, @Ip() ip: string) {
    return this.verificationService.verifyById(id, ip);
  }

  @Public()
  @Get(':id/public')
  @ApiOperation({ summary: 'Get public credential details (Public)' })
  @ApiResponse({ status: 200, description: 'Credential details retrieved' })
  @ApiResponse({ status: 404, description: 'Credential not found' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async getPublicCredential(@Param('id', ParseUUIDPipe) id: string) {
    return this.verificationService.getPublicCredential(id);
  }

  @Public()
  @Get(':id/stats')
  @ApiOperation({ summary: 'Get verification statistics for credential (Public)' })
  @ApiResponse({ status: 200, description: 'Verification statistics retrieved' })
  @ApiResponse({ status: 404, description: 'Credential not found' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async getVerificationStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.verificationService.getVerificationStats(id);
  }
}
