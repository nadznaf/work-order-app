'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRole } from '@/src/context/RoleContext';
import { workOrderService } from '@/src/services/workOrderService';
import { UserRole } from '@/src/types/enums';
import { WorkOrder, getStatusBadgeVariant, formatDate } from '@/src/types/work-order';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Loader2, ArrowLeft, Plus, Trash2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

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

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');

  // Sparepart Form State
  const [showSparepartForm, setShowSparepartForm] = useState(false);
  const [sparepartItems, setSparepartItems] = useState([{ name: '', qty: 1 }]);

  const fetchWorkOrder = async () => {
    setLoading(true);
    try {
        const data = await workOrderService.getWorkOrder(workOrderId);
      setWorkOrder(data);
        setEditTitle(data.title);
        setEditDesc(data.description || '');
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch details');
    } finally {
      setLoading(false);
    }
  };

    const [showEditConfirmModal, setShowEditConfirmModal] = useState(false);

    const handleUpdateWorkOrder = async () => {
        if (!currentUserId) return;
        setShowEditConfirmModal(true);
    };

    const handleConfirmUpdate = async () => {
        setActionLoading(true);
        try {
            await workOrderService.updateWorkOrder(workOrderId, {
                title: editTitle,
                description: editDesc
            });
            setIsEditing(false);
            setShowEditConfirmModal(false);
            fetchWorkOrder();
            toast.success("Work Order updated successfully");
        } catch (err: any) {
            toast.error('Failed to update: ' + (err.response?.data?.message || err.message));
            setShowEditConfirmModal(false);
        } finally {
            setActionLoading(false);
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

    const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleSubmitSparepart = async () => {
      if (!currentUserId) return toast.error("User ID missing context");

        // Validation
        const invalidItems = sparepartItems.filter(i => !i.name.trim() || i.qty < 1);
        if (invalidItems.length > 0) {
            toast.error("Please fill in all item names and ensure quantity is at least 1.");
            return;
        }

        setShowConfirmModal(true);
    };

    const handleConfirmSubmit = async () => {
    setActionLoading(true);
    try {
        await workOrderService.createSparepartRequest(workOrderId, currentUserId!, sparepartItems);
        setShowConfirmModal(false);
      setShowSparepartForm(false);
      setSparepartItems([{ name: '', qty: 1 }]);
      fetchWorkOrder(); // Refresh
        toast.success("Sparepart request submitted");
    } catch (err: any) {
        toast.error('Failed to submit request: ' + (err.response?.data?.message || err.message));
        setShowConfirmModal(false);
    } finally {
      setActionLoading(false);
    }
  };

    const [confirmApproveId, setConfirmApproveId] = useState<string | null>(null);

  const handleApproveSparepart = async (requestId: string) => {
      if (!currentUserId) return toast.error("User ID missing context");
        setConfirmApproveId(requestId);
    };

    const handleConfirmApprove = async () => {
        if (!confirmApproveId || !currentUserId) return;
      
      setActionLoading(true);
      try {
          await workOrderService.approveSparepartRequest(confirmApproveId, currentUserId);
          setConfirmApproveId(null);
          fetchWorkOrder();
          toast.success("Sparepart request approved");
      } catch (err: any) {
          toast.error('Failed to approve: ' + (err.response?.data?.message || err.message));
          setConfirmApproveId(null);
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
                      <div className="flex-1 mr-4">
                          {isEditing ? (
                              <input
                                  className="text-2xl font-bold text-cyan-900 bg-white border border-cyan-200 rounded px-2 w-full mb-1"
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                              />
                          ) : (
                              <CardTitle className="text-2xl font-bold text-cyan-900">{workOrder.title}</CardTitle>
                          )}
                    <p className="text-cyan-600/80 font-mono text-sm mt-1">ID: {workOrder.id}</p>
                </div>

                      <div className="flex items-center gap-2">
                          {/* Edit Button for Admin */}
                          {currentRole === UserRole.ADMIN && !isEditing && workOrder.status !== 'COMPLETED' && (
                              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-cyan-600">
                                  Edit
                              </Button>
                          )}
                          {/* Save/Cancel Actions */}
                          {isEditing && (
                              <div className="flex gap-1">
                                  <Button size="sm" variant="outline" onClick={() => { setIsEditing(false); setEditTitle(workOrder.title); setEditDesc(workOrder.description || ''); }}>
                                      Cancel
                                  </Button>
                                  <Button size="sm" className="bg-cyan-600 text-white" onClick={handleUpdateWorkOrder} disabled={actionLoading}>
                                      Save
                                  </Button>
                              </div>
                          )}

                          <Badge variant={getStatusBadgeVariant(workOrder.status) as any} className="text-sm px-3 py-1">
                              {workOrder.status}
                          </Badge>
                      </div>
                  </div>
        </CardHeader>
        <CardContent className="pt-6 grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Description</h3>
                          {isEditing ? (
                              <textarea
                                  className="w-full mt-1 bg-white p-3 rounded-md border border-cyan-200 min-h-[100px] text-sm"
                                  value={editDesc}
                                  onChange={(e) => setEditDesc(e.target.value)}
                              />
                          ) : (
                              <p className="text-gray-700 mt-1 bg-gray-50 p-3 rounded-md border border-gray-100 min-h-[60px]">
                                  {workOrder.description || "No description provided."}
                              </p>
                          )}
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
                  {currentRole === UserRole.ADMIN && workOrder.status !== 'COMPLETED' && (
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
                          {(!workOrder.sparepartRequests || workOrder.sparepartRequests.length === 0) ? (
                            <p className="text-sm text-gray-400 italic text-center py-8">No spareparts requested.</p>
                        ) : (
                            <div className="space-y-4">
                                      {workOrder.sparepartRequests.map((req) => (
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


          {/* CONFIRMATION MODAL */}
          {
              showConfirmModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4 scale-100 transform transition-all">
                          <div className="flex flex-col items-center text-center space-y-2">
                              <div className="h-12 w-12 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 mb-2">
                                  <CheckCircle className="h-6 w-6" />
                              </div>
                              <h3 className="text-lg font-bold text-gray-900">Confirm Sparepart Request</h3>
                              <p className="text-sm text-gray-500">
                                  Are you sure you want to submit the following items?
                              </p>
                          </div>

                          <div className="bg-gray-50 rounded-md p-4 text-sm space-y-2 border border-gray-100 max-h-40 overflow-y-auto">
                              {sparepartItems.map((item, idx) => (
                                  <div key={idx} className="flex justify-between">
                                      <span className="font-medium text-gray-700">{item.name}</span>
                                      <span className="text-gray-500">x{item.qty}</span>
                                  </div>
                              ))}
                          </div>

                          <div className="flex gap-3 pt-2">
                              <Button variant="outline" className="flex-1" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
                              <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white" onClick={handleConfirmSubmit} disabled={actionLoading}>
                                  {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                  Confirm & Submit
                              </Button>
                          </div>
                      </div>
                  </div>
              )
          }

          {/* APPROVAL CONFIRMATION MODAL */}
          {
              confirmApproveId && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4 scale-100 transform transition-all">
                          <div className="flex flex-col items-center text-center space-y-2">
                              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
                                  <CheckCircle className="h-6 w-6" />
                              </div>
                              <h3 className="text-lg font-bold text-gray-900">Approve Request</h3>
                              <p className="text-sm text-gray-500">
                                  Are you sure you want to approve this sparepart request?
                              </p>
                          </div>

                          <div className="flex gap-3 pt-2">
                              <Button variant="outline" className="flex-1" onClick={() => setConfirmApproveId(null)}>Cancel</Button>
                              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleConfirmApprove} disabled={actionLoading}>
                                  {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                  Confirm Approve
                              </Button>
                          </div>
                      </div>
                  </div>
              )
          }

          {/* EDIT CONFIRMATION MODAL */}
          {
              showEditConfirmModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4 scale-100 transform transition-all">
                          <div className="flex flex-col items-center text-center space-y-2">
                              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-2">
                                  <CheckCircle className="h-6 w-6" />
                              </div>
                              <h3 className="text-lg font-bold text-gray-900">Confirm Update</h3>
                              <p className="text-sm text-gray-500">
                                  Are you sure you want to save changes to this Work Order?
                              </p>
                          </div>

                          <div className="flex gap-3 pt-2">
                              <Button variant="outline" className="flex-1" onClick={() => setShowEditConfirmModal(false)}>Cancel</Button>
                              <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white" onClick={handleConfirmUpdate} disabled={actionLoading}>
                                  {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                  Save Changes
                              </Button>
                          </div>
                      </div>
                  </div>
              )
          }
    </div>
  );
}
