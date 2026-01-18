'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRole } from '@/src/context/RoleContext';
import api from '@/src/api/axios';
import { UserRole } from '@/src/types/enums';
import { WorkOrder, getStatusBadgeVariant, formatDate } from '@/src/types/work-order';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Loader2, ArrowLeft, Plus, Trash2, CheckCircle } from 'lucide-react';

interface WorkOrderDetailProps {
  workOrderId: string;
}

export default function WorkOrderDetail({ workOrderId }: WorkOrderDetailProps) {
  const router = useRouter();
  const { currentRole, currentUserId } = useRole();
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Sparepart Form State
  const [showSparepartForm, setShowSparepartForm] = useState(false);
  const [sparepartItems, setSparepartItems] = useState([{ name: '', qty: 1 }]);

  const fetchWorkOrder = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/work-orders/${workOrderId}`);
      // NOTE: Assuming Backend returns sparepartRequests in the response relations
      // If not, we might need a separate fetch, but let's assume it does or we patched it implicitly.
      setWorkOrder(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workOrderId) fetchWorkOrder();
  }, [workOrderId]);

  // --- Sparepart Form Handlers ---
  const handleAddItem = () => {
    setSparepartItems([...sparepartItems, { name: '', qty: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...sparepartItems];
    newItems.splice(index, 1);
    setSparepartItems(newItems);
  };

  const handleItemChange = (index: number, field: 'name' | 'qty', value: any) => {
    const newItems = [...sparepartItems];
    if (field === 'qty') newItems[index].qty = parseInt(value) || 0;
    else newItems[index].name = value;
    setSparepartItems(newItems);
  };

  const handleSubmitSparepart = async () => {
    if (!currentUserId) return alert("User ID missing context");
    setActionLoading(true);
    try {
      await api.post('/sparepart-requests', {
        work_order_id: workOrderId,
        requested_by: currentUserId,
        items: sparepartItems
      });
      alert('Sparepart request submitted successfully!');
      setShowSparepartForm(false);
      setSparepartItems([{ name: '', qty: 1 }]);
      fetchWorkOrder(); // Refresh
    } catch (err: any) {
      alert('Failed to submit request: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveSparepart = async (requestId: string) => {
      if (!currentUserId) return alert("User ID missing context");
      if (!confirm("Approve this sparepart request?")) return;
      
      setActionLoading(true);
      try {
          await api.post(`/sparepart-requests/${requestId}/approve`, {
              approver_id: currentUserId
          });
          fetchWorkOrder();
      } catch (err: any) {
          alert('Failed to approve: ' + (err.response?.data?.message || err.message));
      } finally {
          setActionLoading(false);
      }
  };

  if (loading) return <div className="p-8 text-center text-cyan-600"><Loader2 className="animate-spin h-8 w-8 mx-auto"/> Loading details...</div>;
  if (!workOrder) return <div className="p-8 text-center text-red-500">Work Order not found</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4 pl-0 hover:bg-transparent hover:text-cyan-600">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
      </Button>

      {/* Main Info Card */}
      <Card className="border-cyan-100 shadow-md">
        <CardHeader className="bg-cyan-50/50 border-b border-cyan-100 pb-4">
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-2xl font-bold text-cyan-900">{workOrder.title}</CardTitle>
                    <p className="text-cyan-600/80 font-mono text-sm mt-1">ID: {workOrder.id}</p>
                </div>
                <Badge variant={getStatusBadgeVariant(workOrder.status) as any} className="text-sm px-3 py-1">
                    {workOrder.status}
                </Badge>
            </div>
        </CardHeader>
        <CardContent className="pt-6 grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Description</h3>
                    <p className="text-gray-700 mt-1 bg-gray-50 p-3 rounded-md border border-gray-100">
                        {workOrder.description || "No description provided."}
                    </p>
                </div>
                <div className="flex gap-6">
                    <div>
                        <h3 className="text-xs font-semibold text-gray-400 uppercase">Created</h3>
                        <p className="text-sm font-medium mt-0.5">{formatDate(workOrder.created_at)}</p>
                    </div>
                </div>
            </div>
            
            {/* Timeline / Dates */}
            <div className="space-y-4 border-l pl-6 border-dashed border-gray-200">
                 <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase">Maintenance Timeline</h3>
                    <div className="mt-4 space-y-4 relative">
                        {/* Start */}
                        <div className="flex items-center gap-3">
                            <div className={`h-3 w-3 rounded-full ${workOrder.start_date ? 'bg-cyan-500' : 'bg-gray-200'} ring-4 ring-white shadow-sm`}></div>
                            <div>
                                <p className="text-xs text-gray-500">Started</p>
                                <p className="text-sm font-medium">{formatDate(workOrder.start_date)}</p>
                            </div>
                        </div>
                        {/* End */}
                        <div className="flex items-center gap-3">
                            <div className={`h-3 w-3 rounded-full ${workOrder.end_date ? 'bg-green-500' : 'bg-gray-200'} ring-4 ring-white shadow-sm`}></div>
                            <div>
                                <p className="text-xs text-gray-500">Completed</p>
                                <p className="text-sm font-medium">{formatDate(workOrder.end_date)}</p>
                            </div>
                        </div>
                         {/* Connecting Line */}
                         <div className="absolute top-3 bottom-3 left-[5px] w-0.5 bg-gray-100 -z-10"></div>
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>

      {/* Sparepart Management Section */}
      <div className="grid md:grid-cols-3 gap-6">
          
          {/* LEFT COL: Request Form (Admin Only) */}
          <div className="md:col-span-1">
            {currentRole === UserRole.ADMIN && (workOrder.status === 'ASSIGNED' || workOrder.status === 'WORKING') && (
                <Card className="border-dashed border-2 border-cyan-200 bg-cyan-50/30">
                    <CardHeader>
                        <CardTitle className="text-base text-cyan-800">Add Sparepart Request</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!showSparepartForm ? (
                            <Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white" onClick={() => setShowSparepartForm(true)}>
                                <Plus className="w-4 h-4 mr-2" /> New Request
                            </Button>
                        ) : (
                            <div className="space-y-4">
                                {sparepartItems.map((item, idx) => (
                                    <div key={idx} className="flex gap-2 items-end">
                                        <div className="flex-1">
                                            <input 
                                                className="w-full text-sm p-2 border rounded" 
                                                placeholder="Item Name" 
                                                value={item.name}
                                                onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                                            />
                                        </div>
                                        <div className="w-16">
                                            <input 
                                                type="number" 
                                                className="w-full text-sm p-2 border rounded" 
                                                value={item.qty}
                                                onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                                            />
                                        </div>
                                        {sparepartItems.length > 1 && (
                                            <button onClick={() => handleRemoveItem(idx)} className="p-2 text-red-400 hover:bg-red-50 rounded">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                
                                <Button variant="outline" size="sm" onClick={handleAddItem} className="w-full text-xs border-dashed text-gray-500">
                                    + Add Item
                                </Button>

                                <div className="flex gap-2 pt-2">
                                    <Button size="sm" className="flex-1 bg-cyan-600 text-white" onClick={handleSubmitSparepart} disabled={actionLoading}>
                                        {actionLoading ? 'Saving...' : 'Submit'}
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setShowSparepartForm(false)}>Cancel</Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
          </div>

          {/* RIGHT COL: Request List & Approval */}
          <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Sparepart Requests History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {(!workOrder.sparepart_requests || workOrder.sparepart_requests.length === 0) ? (
                            <p className="text-sm text-gray-400 italic text-center py-8">No spareparts requested.</p>
                        ) : (
                            <div className="space-y-4">
                                {workOrder.sparepart_requests.map((req) => (
                                    <div key={req.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge variant={getStatusBadgeVariant(req.status) as any}>{req.status}</Badge>
                                                <span className="text-xs text-gray-400">{formatDate(req.created_at)}</span>
                                            </div>
                                            <ul className="text-sm text-gray-700 space-y-1">
                                                {/* items array might be nested or we need to fetch it. 
                                                    Assuming backend returns 'items' in the request object based on standard patterns
                                                */}
                                                {req.items && req.items.map((item, i) => (
                                                    <li key={i} className="flex gap-2">
                                                        <span className="font-semibold">{item.qty}x</span> {item.name}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        
                                        {/* SPV Approval Action */}
                                        {currentRole === UserRole.SPV && req.status === 'PENDING' && (
                                            <Button 
                                                size="sm" 
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white" 
                                                onClick={() => handleApproveSparepart(req.id)}
                                                disabled={actionLoading}
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" /> Approve
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
          </div>

      </div>
    </div>
  );
}
