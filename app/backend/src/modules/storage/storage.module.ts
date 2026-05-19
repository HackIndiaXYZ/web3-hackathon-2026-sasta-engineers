import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageService } from './storage.service';
import { S3Service } from './services/s3.service';
import { QrGeneratorService } from './services/qr-generator.service';

@Module({
  imports: [ConfigModule],
  providers: [StorageService, S3Service, QrGeneratorService],
  exports: [StorageService, QrGeneratorService],
})
export class StorageModule {}
