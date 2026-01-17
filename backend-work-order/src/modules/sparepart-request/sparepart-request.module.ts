import { Module } from '@nestjs/common';
import { WorkOrderModule } from '../work-order/work-order.module';
import { SparepartRequestController } from './sparepart-request.controller';
import { SparepartRequestService } from './sparepart-request.service';
import { SparepartRequestRepository } from './sparepart-request.repository';

@Module({
  imports: [WorkOrderModule],
  controllers: [SparepartRequestController],
  providers: [SparepartRequestService, SparepartRequestRepository],
  exports: [SparepartRequestService],
})
export class SparepartRequestModule {}
