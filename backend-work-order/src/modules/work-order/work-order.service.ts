import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { WorkOrderRepository } from './work-order.repository';
import { CreateWorkOrderDto, AssignWorkOrderDto } from './dto/create-work-order.dto';
import { UserRole, WorkOrderStatus } from '../../common/enums/workflow.enum';
import { WorkOrder } from '@prisma/client';

@Injectable()
export class WorkOrderService {
  private readonly logger = new Logger(WorkOrderService.name);

  constructor(private readonly repository: WorkOrderRepository) {}

  async create(dto: CreateWorkOrderDto, creatorId: string, userRole?: string): Promise<WorkOrder> {
    if (userRole && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can create Work Orders');
    }

    // Check for Duplication
    const existingWO = await this.repository.findActiveByTitle(dto.title);
    if (existingWO) {
      throw new BadRequestException(`Duplicate Work Order: A Work Order with title "${dto.title}" is currently active (Status: ${existingWO.status}).`);
    }

    const wo = await this.repository.create({
      title: dto.title,
      description: dto.description,
      status: WorkOrderStatus.OPEN,
      creator: { connect: { id: creatorId } },
    });
    this.logger.log(`Work Order Created: ${wo.id} by ${creatorId}`);
    return wo;
  }

  async submit(id: string, userRole?: string): Promise<WorkOrder> {
    if (userRole && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can submit Work Orders');
    }

    const wo = await this.repository.findById(id);
    if (!wo) throw new NotFoundException('Work Order Not Found');

    if (wo.status !== WorkOrderStatus.OPEN) {
      throw new BadRequestException('Work Order must be OPEN to perform Submit');
    }

    return this.repository.updateStatus(id, WorkOrderStatus.SUBMITTED);
  }

  async assign(dto: AssignWorkOrderDto, userRole?: string): Promise<WorkOrder> {
    if (userRole && userRole !== UserRole.SPV) {
      throw new ForbiddenException('Only SPV can assign Mechanics');
    }

    const wo = await this.repository.findById(dto.id);
    if (!wo) throw new NotFoundException('Work Order Not Found');

    if (wo.status !== WorkOrderStatus.SUBMITTED) {
      throw new BadRequestException('Work Order must be SUBMITTED to Assign Mechanic');
    }

    return this.repository.assignMechanic(dto.id, dto.mechanic_id);
  }



  async startWorking(id: string, userRole?: string): Promise<WorkOrder> {
    if (userRole && userRole !== UserRole.MECHANIC) {
      throw new ForbiddenException('Only MECHANIC can start working');
    }

    const wo = await this.repository.findById(id);
    if (!wo) throw new NotFoundException('Work Order Not Found');

    // Allow start if ASSIGNED or WAITING_SPAREPART (after sparepart approved)
    // Actually, usually after sparepart approved it goes back to working? 
    // Requirement said: "Mechanic marks Work Order as Working". 
    // If status is WAITING_SPAREPART, maybe mechanic needs to start again or system auto updates?
    // Let's assume Mechanic manually starts it again or continues.

    if (wo.status !== WorkOrderStatus.ASSIGNED && wo.status !== WorkOrderStatus.WAITING_SPAREPART) {
      throw new BadRequestException('Work Order must be ASSIGNED or WAITING_SPAREPART to Start Working');
    }

    // Auto-set start_date when status becomes WORKING
    const updated = await this.repository.update(id, {
      status: WorkOrderStatus.WORKING,
      start_date: new Date()
    });
    this.logger.log(`Work Order Started: ${id}`);
    return updated;
  }

  async update(id: string, dto: any, userRole?: string): Promise<WorkOrder> {
    if (userRole && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can update Work Orders');
    }
      const wo = await this.repository.findById(id);
      if (!wo) throw new NotFoundException('Work Order Not Found');

      return this.repository.update(id, {
          title: dto.title,
          description: dto.description
      });
  }

  async complete(id: string, endDate: string | undefined, userRole?: string): Promise<WorkOrder> {
    if (userRole && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can complete Work Orders');
    }

    const wo = await this.repository.findById(id);
    if (!wo) throw new NotFoundException('Work Order Not Found');

    if (wo.status !== WorkOrderStatus.WORKING) {
      throw new BadRequestException('Work Order must be WORKING to Complete');
    }

    const end = endDate ? new Date(endDate) : new Date();
    // Validate end_date is not before created_at
    if (end < wo.created_at) {
      throw new BadRequestException('End Date cannot be before Created Date');
    }

    const updated = await this.repository.updateStatus(id, WorkOrderStatus.COMPLETED, end);
    this.logger.log(`Work Order Completed: ${id}`);
    return updated;
  }

  async findAll(): Promise<WorkOrder[]> {
    return this.repository.findAll();
  }
}
