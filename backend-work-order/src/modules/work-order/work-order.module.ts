import { Module } from '@nestjs/common';
import { WorkOrderController } from './work-order.controller';
import { WorkOrderService } from './work-order.service';
import { WorkOrderRepository } from './work-order.repository';

@Module({
  controllers: [WorkOrderController],
  providers: [WorkOrderService, WorkOrderRepository],
  exports: [WorkOrderService, WorkOrderRepository],
})
export class WorkOrderModule {}
