import { Module } from '@nestjs/common';
import { CredentialsController } from './credentials.controller';
import { CredentialsService } from './credentials.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { IssuersModule } from '../issuers/issuers.module';

@Module({
  imports: [PrismaModule, StorageModule, BlockchainModule, IssuersModule],
  controllers: [CredentialsController],
  providers: [CredentialsService],
  exports: [CredentialsService],
})
export class CredentialsModule {}
