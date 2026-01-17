import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SparepartRequest, Prisma } from '@prisma/client';
import { SparepartRequestStatus, WorkOrderStatus } from '../../common/enums/workflow.enum';

@Injectable()
export class SparepartRequestRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.SparepartRequestCreateInput): Promise<SparepartRequest> {
    return this.prisma.sparepartRequest.create({ data });
  }

  async createTransactional(
    data: Prisma.SparepartRequestCreateInput,
    workOrderId: string
  ): Promise<SparepartRequest> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Create Sparepart Request
      const request = await tx.sparepartRequest.create({ data });

      // 2. Update Work Order Status to WAITING_SPAREPART
      await tx.workOrder.update({
        where: { id: workOrderId },
        data: { status: WorkOrderStatus.WAITING_SPAREPART },
      });

      return request;
    });
  }

  async findById(id: string): Promise<SparepartRequest | null> {
    return this.prisma.sparepartRequest.findUnique({
        where: { id },
        include: { items: true },
    });
  }

  async updateStatus(id: string, status: string, approverId?: string): Promise<SparepartRequest> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Update Request
      const req = await tx.sparepartRequest.update({
        where: { id },
        data: {
          status,
          approved_by: approverId
        },
      });

      // 2. If Approved, update WO to ASSIGNED so Mechanic can resume
      if (status === SparepartRequestStatus.APPROVED) {
        await tx.workOrder.update({
          where: { id: req.work_order_id },
          data: { status: WorkOrderStatus.ASSIGNED }
        });
      }

      return req;
    });
  }
}
