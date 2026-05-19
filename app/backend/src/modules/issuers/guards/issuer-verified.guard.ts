import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { IssuersService } from '../issuers.service';

@Injectable()
export class IssuerVerifiedGuard implements CanActivate {
  constructor(private readonly issuersService: IssuersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const isVerified = await this.issuersService.isVerifiedIssuer(user.id);

    if (!isVerified) {
      throw new ForbiddenException(
        'Access denied. Only verified issuers can perform this action.',
      );
    }

    return true;
  }
}
