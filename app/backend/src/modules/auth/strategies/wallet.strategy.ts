import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { AuthService } from '../auth.service';

@Injectable()
export class WalletStrategy extends PassportStrategy(Strategy, 'wallet') {
  constructor(private readonly authService: AuthService) {
    super();
  }

  async validate(req: any) {
    const { walletAddress, signature, message } = req.body;
    return this.authService.walletConnect({ walletAddress, signature, message });
  }
}
