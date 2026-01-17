import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { WorkOrderModule } from './modules/work-order/work-order.module';
import { SparepartRequestModule } from './modules/sparepart-request/sparepart-request.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    WorkOrderModule,
    SparepartRequestModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
