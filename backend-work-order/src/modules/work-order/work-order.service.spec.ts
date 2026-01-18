import { Test, TestingModule } from '@nestjs/testing';
import { WorkOrderService } from './work-order.service';
import { WorkOrderRepository } from './work-order.repository';
import { UserRole, WorkOrderStatus } from '../../common/enums/workflow.enum';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { WorkOrder } from '@prisma/client';

describe('WorkOrderService', () => {
  let service: WorkOrderService;
  let repository: WorkOrderRepository;

  const mockWorkOrderRepository = {
    create: jest.fn(),
    findActiveByTitle: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    assignMechanic: jest.fn(),
    createSparepartRequest: jest.fn(),
  };

  const mockAdminId = 'admin-123';
  const mockSpvId = 'spv-123';
  const mockMechanicId = 'mech-123';
  const mockWorkOrderId = 'wo-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkOrderService,
        {
          provide: WorkOrderRepository,
          useValue: mockWorkOrderRepository,
        },
      ],
    }).compile();

    service = module.get<WorkOrderService>(WorkOrderService);
    repository = module.get<WorkOrderRepository>(WorkOrderRepository);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a work order if user is ADMIN', async () => {
      const dto = { title: 'Test WO', description: 'Desc' };
      const expectedWO = { id: mockWorkOrderId, ...dto, status: WorkOrderStatus.OPEN } as WorkOrder;

      mockWorkOrderRepository.findActiveByTitle.mockResolvedValue(null);
      mockWorkOrderRepository.create.mockResolvedValue(expectedWO);

      const result = await service.create(dto, mockAdminId, UserRole.ADMIN);
      expect(result).toEqual(expectedWO);
      expect(mockWorkOrderRepository.create).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not ADMIN', async () => {
      await expect(service.create({ title: 'T' }, mockAdminId, UserRole.MECHANIC))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for duplicate active title', async () => {
      mockWorkOrderRepository.findActiveByTitle.mockResolvedValue({ id: 'existing', status: WorkOrderStatus.OPEN });
      await expect(service.create({ title: 'Duplicate' }, mockAdminId, UserRole.ADMIN))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('submit', () => {
    it('should update status to SUBMITTED if current is OPEN', async () => {
      const wo = { id: mockWorkOrderId, status: WorkOrderStatus.OPEN };
      mockWorkOrderRepository.findById.mockResolvedValue(wo);
      mockWorkOrderRepository.updateStatus.mockResolvedValue({ ...wo, status: WorkOrderStatus.SUBMITTED });

      const result = await service.submit(mockWorkOrderId, UserRole.ADMIN);
      expect(result.status).toBe(WorkOrderStatus.SUBMITTED);
    });

    it('should throw BadRequestException if status is not OPEN', async () => {
      mockWorkOrderRepository.findById.mockResolvedValue({ id: mockWorkOrderId, status: WorkOrderStatus.SUBMITTED });
      await expect(service.submit(mockWorkOrderId, UserRole.ADMIN))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('assign', () => {
    it('should assign mechanic if status is SUBMITTED', async () => {
      const wo = { id: mockWorkOrderId, status: WorkOrderStatus.SUBMITTED };
      mockWorkOrderRepository.findById.mockResolvedValue(wo);
      mockWorkOrderRepository.assignMechanic.mockResolvedValue({ 
          ...wo, 
          status: WorkOrderStatus.ASSIGNED, 
          assigned_mechanic_id: mockMechanicId 
      });

      const result = await service.assign({ id: mockWorkOrderId, mechanic_id: mockMechanicId }, UserRole.SPV);
      expect(result.assigned_mechanic_id).toBe(mockMechanicId);
    });

    it('should throw ForbiddenException if user is not SPV', async () => {
        await expect(service.assign({ id: mockWorkOrderId, mechanic_id: mockMechanicId }, UserRole.ADMIN))
          .rejects.toThrow(ForbiddenException);
    });
  });

  describe('startWorking', () => {
      it('should update status to WORKING and set start_date', async () => {
          const wo = { id: mockWorkOrderId, status: WorkOrderStatus.ASSIGNED };
          mockWorkOrderRepository.findById.mockResolvedValue(wo);
          mockWorkOrderRepository.update.mockResolvedValue({ ...wo, status: WorkOrderStatus.WORKING, start_date: new Date() });

          const result = await service.startWorking(mockWorkOrderId, UserRole.MECHANIC);
          expect(result.status).toBe(WorkOrderStatus.WORKING);
          expect(result.start_date).toBeDefined();
      });

      it('should throw ForbiddenException if user is not MECHANIC', async () => {
          await expect(service.startWorking(mockWorkOrderId, UserRole.ADMIN))
            .rejects.toThrow(ForbiddenException);
      });
  });

  describe('complete', () => {
      it('should complete work order if status is WORKING', async () => {
          const wo = { id: mockWorkOrderId, status: WorkOrderStatus.WORKING, created_at: new Date('2023-01-01') };
          mockWorkOrderRepository.findById.mockResolvedValue(wo);
          const endDate = '2023-01-02T10:00:00Z';
          mockWorkOrderRepository.updateStatus.mockResolvedValue({ ...wo, status: WorkOrderStatus.COMPLETED, end_date: new Date(endDate) });

          const result = await service.complete(mockWorkOrderId, endDate, UserRole.ADMIN);
          expect(result.status).toBe(WorkOrderStatus.COMPLETED);
      });

      it('should throw BadRequestException if status is not WORKING', async () => {
          mockWorkOrderRepository.findById.mockResolvedValue({ id: mockWorkOrderId, status: WorkOrderStatus.OPEN });
           await expect(service.complete(mockWorkOrderId, undefined, UserRole.ADMIN))
            .rejects.toThrow(BadRequestException);
      });
  });

});
