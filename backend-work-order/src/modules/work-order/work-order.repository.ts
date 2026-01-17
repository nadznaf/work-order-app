import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkOrder, Prisma } from '@prisma/client';
// With custom output in schema: output   = "../generated/prisma"
// We need to import from there or alias it. Best practice is usually strict path.
// However, earlier log said: Generated Prisma Client ... to .\generated\prisma
// So import should be from that path or adjust tsconfig.
// For now let's try standard import, if it fails I check tsconfig.
// Actually schema said: output   = "../generated/prisma"
// So standard '@prisma/client' might NOT work if they are not sync'd.
// Let's check where it generated. d:\Project_BE\backend-work-order\generated\prisma
// I should rely on relative path or standard if node_modules were updated.
// `npx prisma generate` usually updates node_modules/@prisma/client unless overriden entirely.
// But the invalid output path in schema `../generated/prisma` usually means it goes out of node_modules.
// Wait, the schema file is in `prisma/schema.prisma`. `../generated/prisma` means `prisma/../generated/prisma` -> `generated/prisma`.
// So it is NOT in node_modules.
// Users usually do this to avoid node_modules cache issues, but it complicates imports.
// I should check if I can import from `@prisma/client` first (maybe it was also generated there as default?).
// Typically `output` OVERRIDES the default.
// Let's check `tsconfig.json` to see if paths are mapped.

import { WorkOrderStatus } from '../../common/enums/workflow.enum';

@Injectable()
export class WorkOrderRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.WorkOrderCreateInput): Promise<WorkOrder> {
    return this.prisma.workOrder.create({ data });
  }

  async findById(id: string): Promise<WorkOrder | null> {
    return this.prisma.workOrder.findUnique({ where: { id } });
  }

  async findActiveByTitle(title: string): Promise<WorkOrder | null> {
    return this.prisma.workOrder.findFirst({
      where: {
        title: title,
        status: { not: WorkOrderStatus.COMPLETED }
      }
    });
  }

  async update(id: string, data: Prisma.WorkOrderUpdateInput): Promise<WorkOrder> {
    return this.prisma.workOrder.update({
      where: { id },
      data,
    });
  }

  async updateStatus(id: string, status: string, endDate?: Date): Promise<WorkOrder> {
    return this.prisma.workOrder.update({
      where: { id },
      data: { 
          status,
          end_date: endDate
      },
    });
  }

  async assignMechanic(id: string, mechanicId: string): Promise<WorkOrder> {
    return this.prisma.workOrder.update({
      where: { id },
      data: {
        status: WorkOrderStatus.ASSIGNED,
        assigned_mechanic_id: mechanicId,
      },
    });
  }

  async createSparepartRequest(workOrderId: string, requestorId: string, items: { name: string; qty: number }[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 1. Create Sparepart Request
      await tx.sparepartRequest.create({
        data: {
          work_order_id: workOrderId,
          requested_by: requestorId,
          status: 'PENDING',
          items: {
            create: items.map((item) => ({
              name: item.name,
              qty: item.qty,
            })),
          },
        },
      });

      // 2. Update Work Order Status
      await tx.workOrder.update({
        where: { id: workOrderId },
        data: { status: WorkOrderStatus.WAITING_SPAREPART },
      });
    });
  }

  async findAll(): Promise<WorkOrder[]> {
    return this.prisma.workOrder.findMany({
      include: { sparepartRequests: { include: { items: true } } }
    });
  }
}
