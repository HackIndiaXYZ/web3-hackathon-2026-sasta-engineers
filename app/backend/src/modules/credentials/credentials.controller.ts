import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { CredentialsService } from './credentials.service';
import { IssueCredentialDto } from './dto/issue-credential.dto';
import { RevokeCredentialDto } from './dto/revoke-credential.dto';
import { QueryCredentialsDto } from './dto/query-credentials.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { IssuerVerifiedGuard } from '../issuers/guards/issuer-verified.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('credentials')
@Controller('credentials')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class CredentialsController {
  constructor(private readonly credentialsService: CredentialsService) {}

  @Post('issue')
  @Roles(UserRole.ISSUER)
  @UseGuards(IssuerVerifiedGuard)
  @UseInterceptors(FileInterceptor('certificate'))
  @ApiOperation({ summary: 'Issue a new credential (Verified Issuer only)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Credential issued successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not a verified issuer' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['certificate', 'studentName', 'credentialType', 'programName', 'issueDate'],
      properties: {
        certificate: {
          type: 'string',
          format: 'binary',
          description: 'Certificate PDF file (max 10MB)',
        },
        studentName: { type: 'string', example: 'John Doe' },
        studentEmail: { type: 'string', example: 'john@example.com' },
        studentWallet: { type: 'string', example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' },
        credentialType: { type: 'string', example: 'Bachelor of Science' },
        programName: { type: 'string', example: 'Computer Science' },
        issueDate: { type: 'string', example: '2024-05-15' },
        expiryDate: { type: 'string', example: '2029-05-15' },
        description: { type: 'string', example: 'Graduated with honors' },
      },
    },
  })
  async issueCredential(
    @CurrentUser('id') userId: string,
    @Body() issueDto: IssueCredentialDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new Error('Certificate file is required');
    }

    return this.credentialsService.issueCredential(userId, issueDto, file);
  }

  @Post(':id/revoke')
  @Roles(UserRole.ISSUER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke a credential (Issuer only)' })
  @ApiResponse({ status: 200, description: 'Credential revoked successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the issuer' })
  @ApiResponse({ status: 404, description: 'Credential not found' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async revokeCredential(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() revokeDto: RevokeCredentialDto,
  ) {
    return this.credentialsService.revokeCredential(userId, id, revokeDto.reason);
  }

  @Get('my-issued')
  @Roles(UserRole.ISSUER)
  @ApiOperation({ summary: 'Get credentials issued by current issuer' })
  @ApiResponse({ status: 200, description: 'Credentials retrieved successfully' })
  async getMyIssuedCredentials(
    @CurrentUser('id') userId: string,
    @Query() query: QueryCredentialsDto,
  ) {
    return this.credentialsService.findByIssuer(userId, query);
  }

  @Get('my-credentials')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get credentials for current student' })
  @ApiResponse({ status: 200, description: 'Credentials retrieved successfully' })
  async getMyCredentials(
    @CurrentUser('id') userId: string,
    @Query() query: QueryCredentialsDto,
  ) {
    return this.credentialsService.findByStudent(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get credential by ID' })
  @ApiResponse({ status: 200, description: 'Credential retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Credential not found' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async getCredential(@Param('id', ParseUUIDPipe) id: string) {
    return this.credentialsService.findById(id);
  }
}
