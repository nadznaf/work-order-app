import api from '@/src/api/axios';
import { WorkOrder } from '@/src/types/work-order';

export const workOrderService = {
  getWorkOrder: async (id: string): Promise<WorkOrder> => {
    const { data } = await api.get(`/work-orders/${id}`);
    return data;
  },

  updateWorkOrder: async (id: string, updateData: { title: string; description: string }): Promise<WorkOrder> => {
    const { data } = await api.post(`/work-orders/${id}/update`, updateData);
    return data;
  },

  createSparepartRequest: async (
    workOrderId: string, 
    requestedBy: string, 
    items: { name: string; qty: number }[]
  ): Promise<any> => {
    const { data } = await api.post('/sparepart-requests', {
      work_order_id: workOrderId,
      requested_by: requestedBy,
      items
    });
    return data;
  },

  approveSparepartRequest: async (requestId: string, approverId: string): Promise<any> => {
    const { data } = await api.post(`/sparepart-requests/${requestId}/approve`, {
      approver_id: approverId
    });
    return data;
  }
};
