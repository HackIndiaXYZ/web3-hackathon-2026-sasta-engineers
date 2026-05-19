import { Module } from '@nestjs/common';
import { IssuersController } from './issuers.controller';
import { IssuersService } from './issuers.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [IssuersController],
  providers: [IssuersService],
  exports: [IssuersService],
})
export class IssuersModule {}
