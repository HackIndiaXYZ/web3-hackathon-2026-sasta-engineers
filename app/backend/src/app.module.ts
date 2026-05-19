import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { IssuersModule } from './modules/issuers/issuers.module';
import { CredentialsModule } from './modules/credentials/credentials.module';
import { VerificationModule } from './modules/verification/verification.module';
import { StorageModule } from './modules/storage/storage.module';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import blockchainConfig from './config/blockchain.config';
import storageConfig from './config/storage.config';
import emailConfig from './config/email.config';

@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        redisConfig,
        blockchainConfig,
        storageConfig,
        emailConfig,
      ],
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.RATE_LIMIT_TTL, 10) || 60000,
        limit: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
      },
    ]),

    // Database
    PrismaModule,

    // Feature modules
    AuthModule,
    UsersModule,
    IssuersModule,
    CredentialsModule,
    VerificationModule,
    StorageModule,
    BlockchainModule,
    // QueueModule,
    // NotificationsModule,
    // AnalyticsModule,
    // AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
