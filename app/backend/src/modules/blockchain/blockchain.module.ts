import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BlockchainService } from './blockchain.service';
import { ContractService } from './services/contract.service';

@Module({
  imports: [ConfigModule],
  providers: [BlockchainService, ContractService],
  exports: [BlockchainService],
})
export class BlockchainModule {}
