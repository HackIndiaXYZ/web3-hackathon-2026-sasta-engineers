import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { IssuersService } from './issuers.service';
import { RegisterIssuerDto } from './dto/register-issuer.dto';
import { UpdateIssuerDto } from './dto/update-issuer.dto';
import { QueryIssuersDto } from './dto/query-issuers.dto';
import { ApproveIssuerDto } from './dto/approve-issuer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('issuers')
@Controller('issuers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class IssuersController {
  constructor(private readonly issuersService: IssuersService) {}

  @Post('register')
  @Roles(UserRole.ISSUER)
  @ApiOperation({ summary: 'Register as an issuer (apply for issuer status)' })
  @ApiResponse({ status: 201, description: 'Issuer registration submitted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 409, description: 'Issuer profile already exists' })
  async register(
    @CurrentUser('id') userId: string,
    @Body() registerDto: RegisterIssuerDto,
  ) {
    return this.issuersService.register(userId, registerDto);
  }

  @Get('me')
  @Roles(UserRole.ISSUER)
  @ApiOperation({ summary: 'Get current issuer profile with statistics' })
  @ApiResponse({ status: 200, description: 'Issuer profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Issuer profile not found' })
  async getMyProfile(@CurrentUser('id') userId: string) {
    return this.issuersService.getProfile(userId);
  }

  @Put('me')
  @Roles(UserRole.ISSUER)
  @ApiOperation({ summary: 'Update current issuer profile' })
  @ApiResponse({ status: 200, description: 'Issuer profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 404, description: 'Issuer profile not found' })
  async updateMyProfile(
    @CurrentUser('id') userId: string,
    @Body() updateDto: UpdateIssuerDto,
  ) {
    return this.issuersService.update(userId, updateDto);
  }

  @Get('pending')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get pending issuer applications (Admin only)' })
  @ApiResponse({ status: 200, description: 'Pending applications retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async getPendingApplications() {
    return this.issuersService.getPendingApplications();
  }

  @Post(':id/approve')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve or reject issuer application (Admin only)' })
  @ApiResponse({ status: 200, description: 'Issuer application processed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 404, description: 'Issuer not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async approveIssuer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() approveDto: ApproveIssuerDto,
  ) {
    return this.issuersService.approve(id, approveDto.approved, approveDto.reason);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all issuers with pagination (Admin only)' })
  @ApiResponse({ status: 200, description: 'Issuers retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async findAll(@Query() query: QueryIssuersDto) {
    return this.issuersService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.ISSUER)
  @ApiOperation({ summary: 'Get issuer by ID' })
  @ApiResponse({ status: 200, description: 'Issuer retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Issuer not found' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.issuersService.findById(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete issuer (Admin only)' })
  @ApiResponse({ status: 200, description: 'Issuer deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete issuer with issued credentials' })
  @ApiResponse({ status: 404, description: 'Issuer not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.issuersService.delete(id);
  }
}
