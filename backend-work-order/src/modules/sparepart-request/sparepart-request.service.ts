import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SparepartRequestRepository } from './sparepart-request.repository';
import { WorkOrderRepository } from '../work-order/work-order.repository';
import { CreateSparepartRequestDto } from '../work-order/dto/create-work-order.dto';
import { SparepartRequestStatus, UserRole, WorkOrderStatus } from '../../common/enums/workflow.enum';
import { SparepartRequest } from '@prisma/client';

@Injectable()
export class SparepartRequestService {
  constructor(
    private readonly repository: SparepartRequestRepository,
    private readonly workOrderRepository: WorkOrderRepository,
  ) {}

  async create(dto: CreateSparepartRequestDto, userRole?: string): Promise<SparepartRequest> {
    if (userRole && userRole !== UserRole.ADMIN) {
        throw new ForbiddenException('Only ADMIN can request spareparts');
    }

    const wo = await this.workOrderRepository.findById(dto.work_order_id);
    if (!wo) throw new NotFoundException('Work Order Not Found');

    if (wo.status !== WorkOrderStatus.ASSIGNED && wo.status !== WorkOrderStatus.WORKING) {
      throw new BadRequestException('Cannot request sparepart at this stage (Must be ASSIGNED/WORKING)');
    }

    return this.repository.createTransactional({
      status: SparepartRequestStatus.PENDING,
      workOrder: { connect: { id: dto.work_order_id } },
      requestor: { connect: { id: dto.requested_by } },
      items: {
          create: dto.items.map(item => ({
              name: item.name,
              qty: Number(item.qty)
          }))
      }
    }, dto.work_order_id);
  }

  async approve(id: string, approverId: string, userRole?: string): Promise<SparepartRequest> {
    if (userRole && userRole !== UserRole.SPV) {
        throw new ForbiddenException('Only SPV can approve spareparts');
    }

    const req = await this.repository.findById(id);
    if (!req) throw new NotFoundException('Request Not Found');

    if (req.status !== SparepartRequestStatus.PENDING) {
      throw new BadRequestException('Request is not PENDING');
    }

    // Note: When approved, does the WO status change?
    // Requirement says: "SPV approves Sparepart Request -> Mechanic marks Work Order as Working"
    // So the WO status change happens when Mechanic clicks Start/Working later. 
    // Here we just approve the request.

    return this.repository.updateStatus(id, SparepartRequestStatus.APPROVED, approverId);
  }
}
