import { WorkOrder, Prisma } from '@prisma/client';

export interface IWorkOrderRepository {
  create(data: Prisma.WorkOrderCreateInput): Promise<WorkOrder>;
  findById(id: string): Promise<WorkOrder | null>;
  findActiveByTitle(title: string): Promise<WorkOrder | null>;
  update(id: string, data: Prisma.WorkOrderUpdateInput): Promise<WorkOrder>;
  updateStatus(id: string, status: string, endDate?: Date): Promise<WorkOrder>;
  assignMechanic(id: string, mechanicId: string): Promise<WorkOrder>;
  createSparepartRequest(workOrderId: string, requestorId: string, items: { name: string; qty: number }[]): Promise<void>;
  findAll(): Promise<WorkOrder[]>;
}
