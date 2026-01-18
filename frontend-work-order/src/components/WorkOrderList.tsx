'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRole } from '@/src/context/RoleContext';
import { UserRole } from '@/src/types/enums';

// UI Components
import { Card, CardContent } from '@/src/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Loader2, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';

import { workOrderService } from '@/src/services/workOrderService';
import { userService } from '@/src/services/userService';
import { User } from '@/src/types/user';
import { WorkOrder, getStatusBadgeVariant, formatDate } from '@/src/types/work-order';

export default function WorkOrderList() {
  const router = useRouter();
  const { currentRole, currentUserId } = useRole();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Assignment Modal State
  const [assignTargetId, setAssignTargetId] = useState<string | null>(null);
  const [selectedMechanicId, setSelectedMechanicId] = useState<string>('');
  const [mechanics, setMechanics] = useState<User[]>([]);
  const [loadingMechanics, setLoadingMechanics] = useState(false);

  // Start Work Modal State
  const [startWorkOrderId, setStartWorkOrderId] = useState<string | null>(null);

  const handleConfirmStart = async () => {
    if (!startWorkOrderId) return;
    const wo = workOrders.find(w => w.id === startWorkOrderId);
    if (!wo) return;

    // Close modal immediately but keep ID for loading state
    // actually better to keep modal open or just close and show loading on row? 
    // User requested "pop over... click tombol start working". 
    // Let's close modal and show loading on row or keep modal? 
    // Existing pattern uses `actionLoading`.

    const id = startWorkOrderId;
    // setStartWorkOrderId(null); // Keep open if we want to show loading inside modal, or close if row.
    // Let's keep it open to show loading inside modal as per new UI code above uses actionLoading
    // Actually the UI above uses actionLoading inside the modal button.

    setActionLoading(id);
    try {
      await workOrderService.startWorkOrder(id);
      await fetchWorkOrders();
      toast.success("Work Order started successfully");
      setStartWorkOrderId(null); // Close on success
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      toast.error(`Failed to Start: ${msg}`);
      // Don't close modal on error so user can try again? or close?
      setStartWorkOrderId(null);
    } finally {
      setActionLoading(null);
    }
  };

  const fetchWorkOrders = async () => {
    setLoading(true);
    try {
      const data = await workOrderService.getWorkOrders();
      setWorkOrders(data);
      setError('');
    } catch (err: any) {
        console.error("Fetch Error:", err);
      setError(err?.message || 'Failed to fetch work orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, [currentRole, currentUserId]); 

  // Helper: Status Label Mapper
  const getStatusLabel = (wo: WorkOrder) => {
    // Priority: Check for Sparepart Requests first
    if (wo.sparepartRequests && wo.sparepartRequests.length > 0) {
      // If any request is PENDING, show that
      if (wo.sparepartRequests.some(r => r.status === 'PENDING')) {
        return 'PENDING';
      }
      // If all are processed (e.g. APPROVED or REJECTED), we might want to show that or just the WO status.
      // User asked to "samakan dengan status pending/approved". 
      // If we have an approved one and no pending, maybe show "Sparepart Approved"?
      // But if mechanics are working, "On Progress" is better.
      // Let's explicitly show "Sparepart Approved" only if status is NOT yet completed, 
      // effectively giving visibility to the approval.
      // However, usually after approval, mechanic starts working.
      // Let's stick to showing 'Sparepart Pending' as a specific state, and otherwise WO status.
    }

    // Fallback to standard WO Status
    switch (wo.status) {
      case 'OPEN': return 'BREAKDOWN';
      case 'WORKING': return 'WORKING';
      case 'ASSIGNED': return 'ASSIGNED';
      default: return wo.status;
    }
  }

  // Helper: Badge Variant Mapper
  const getBadgeVariant = (wo: WorkOrder) => {
    // Custom variant for Sparepart Pending
    if (wo.sparepartRequests?.some(r => r.status === 'PENDING')) {
      return 'warning'; // or destructve? Warning seems appropriate for waiting.
    }
    return getStatusBadgeVariant(wo.status);
  }

  const handleAction = async (wo: WorkOrder, action: string, type: 'submit' | 'start' | 'complete', body: any = {}) => {
    if (type !== 'submit' && !confirm(`Are you sure you want to ${action} this Work Order?`)) return;

    setActionLoading(wo.id);
    try {
      if (type === 'submit') {
        await workOrderService.submitWorkOrder(wo.id);
        // } else if (type === 'start') {  <-- REMOVED from here as handled by modal now
        //   await workOrderService.startWorkOrder(wo.id);
      } else if (type === 'complete') {
        await workOrderService.completeWorkOrder(wo.id, body.end_date);
      }

      await fetchWorkOrders(); 
      toast.success(`Work Order ${action}ed successfully`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      toast.error(`Failed to ${action}: ${msg}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Open the custom assignment modal
  const openAssignModal = async (woId: string) => {
    setAssignTargetId(woId);
    setLoadingMechanics(true);
    try {
      // Fetch mechanics dynamically
      const data = await userService.getUsers('MECHANIC');
      setMechanics(data);
      if (data.length > 0) {
        setSelectedMechanicId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch mechanics", err);
      toast.error("Failed to load mechanics list");
    } finally {
      setLoadingMechanics(false);
    }
  };

  const handleConfirmAssign = async () => {
    if (!assignTargetId) return;

    // Validate selection
    if (!selectedMechanicId) {
      toast.error("Please select a mechanic");
      return;
    }

    const wo = workOrders.find(w => w.id === assignTargetId);
    if (!wo) return;

    setActionLoading(assignTargetId); // Set loading on the row
    setAssignTargetId(null); // Close modal

    try {
      await workOrderService.assignWorkOrder(wo.id, selectedMechanicId);
      await fetchWorkOrders();
      toast.success("Mechanic assigned successfully");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      toast.error(`Failed to Assign: ${msg}`);
    } finally {
      setActionLoading(null);
    }
  };

  const renderActions = (wo: WorkOrder) => {
    const isActionLoading = actionLoading === wo.id;

    // 1. ADMIN - SUBMIT (If OPEN)
    if (currentRole === UserRole.ADMIN && wo.status === 'OPEN') {
      return (
        <Button 
            size="sm" 
            onClick={() => handleAction(wo, 'Submit', 'submit')}
            disabled={isActionLoading}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
        >
          {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit
        </Button>
      );
    }

    // 2. SPV - ASSIGN (If SUBMITTED) -> Now uses Modal
    if (currentRole === UserRole.SPV && wo.status === 'SUBMITTED') {
      return (
        <Button 
            size="sm" 
            variant="outline"
            className="border-indigo-500 text-indigo-500 hover:bg-indigo-50"
          onClick={(e) => {
            e.stopPropagation();
            openAssignModal(wo.id);
            }}
            disabled={isActionLoading}
        >
          Assign Mechanic
        </Button>
      );
    }

    // 3. MECHANIC - START (If ASSIGNED)
    if (currentRole === UserRole.MECHANIC && wo.status === 'ASSIGNED') {
      return (
        <Button 
            size="sm" 
            variant="warning"
          onClick={(e) => {
            e.stopPropagation();
            setStartWorkOrderId(wo.id);
          }} // trigger modal
            disabled={isActionLoading}
        >
             {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Start Working
        </Button>
      );
    }

    // 4. ADMIN - COMPLETE (If WORKING)
    if (currentRole === UserRole.ADMIN && wo.status === 'WORKING') {
      return (
        <Button 
            size="sm" 
            variant="success"
            onClick={() => handleAction(wo, 'Complete', 'complete', { end_date: new Date().toISOString() })}
            disabled={isActionLoading}
        >
          Complete
        </Button>
      );
    }

    return <span className="text-gray-400 text-xs italic">-</span>;
  };

  return (
    <>
      <Card className="shadow-none border-0 bg-transparent">
        {/* Header Section */}
        <div className="flex justify-end mb-4">
          {currentRole === UserRole.ADMIN && (
            <Button
              onClick={() => router.push('/work-orders/create')}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium px-6 rounded shadow-lg shadow-cyan-200 transition-all"
            >
              + Add New Order
            </Button>
          )}
        </div>

        <CardContent className="p-0 bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {loading && !workOrders.length ? (
            <div className="p-12 text-center text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              Loading data...
            </div>
          ) : (
            <Table>
                <TableHeader className="bg-teal-600">
                  <TableRow className="border-b border-teal-500">
                    <TableHead className="text-center w-[50px] text-white font-semibold">No</TableHead>
                    <TableHead className="text-center text-white font-semibold">Work Order</TableHead>
                    <TableHead className="text-center text-white font-semibold">WO ID</TableHead>
                    <TableHead className="text-center text-white font-semibold">Start Date</TableHead>
                    <TableHead className="text-center text-white font-semibold">End Date</TableHead>
                    <TableHead className="text-center text-white font-semibold">Created Time</TableHead>
                    <TableHead className="text-center text-white font-semibold">Status</TableHead>
                    <TableHead className="text-center text-white font-semibold">Action</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {workOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center h-32 text-muted-foreground">
                        No work orders found.
                      </TableCell>
                    </TableRow>
                ) : (
                      workOrders.map((wo, index) => (
                        <TableRow key={wo.id} className="even:bg-[#F9FAFB] hover:bg-cyan-100/50 transition-colors border-b border-gray-50" onClick={() => window.location.href = `/work-orders/${wo.id}`}>
                          <TableCell className="font-medium text-gray-600">{index + 1}</TableCell>
                          <TableCell>
                            <span className="font-medium text-gray-700">{wo.title}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-gray-500 font-mono text-center">...{wo.id.slice(-6)}</span>
                          </TableCell>
                          <TableCell className="text-xs text-gray-600 whitespace-nowrap text-center">
                            {formatDate(wo.start_date)}
                          </TableCell>
                          <TableCell className="text-xs text-gray-600 whitespace-nowrap text-center">
                            {formatDate(wo.end_date)}
                          </TableCell>
                          <TableCell className="text-xs text-gray-600 whitespace-nowrap text-center">
                            {formatDate(wo.created_at)}
                          </TableCell>

                          <TableCell className="text-center">
                            <Badge variant={getBadgeVariant(wo) as any} className="capitalize text-[10px] px-3 py-1 font-normal tracking-wide rounded-full shadow-sm">
                              {getStatusLabel(wo)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                            {renderActions(wo)}
                          </TableCell>
                    </TableRow>
                      ))
                )}
                </TableBody>
            </Table>
          )}

          {/* Pagination Placeholder */}
          {!loading && (
            <div className="flex items-center justify-end px-4 py-4 border-t border-gray-100 text-xs text-gray-500 gap-4">
              <span>Rows per page: 10</span>
              <span>1-10 of {workOrders.length}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ASSIGNMENT MODAL (Simple Custom UI) */}
      {assignTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Assign Mechanic</h3>
              <button onClick={() => setAssignTargetId(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-3">Select a mechanic to assign to this work order.</p>

              {loadingMechanics ? (
                <div className="text-center py-4 text-sm text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                  Fetching mechanics...
                </div>
              ) : mechanics.length === 0 ? (
                <div className="text-center py-4 text-sm text-red-500 border border-dashed rounded-md">
                  No mechanics found. Please create mechanic users first.
                </div>
              ) : (
                <select
                  className="w-full p-2.5 border rounded-md text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={selectedMechanicId}
                  onChange={(e) => setSelectedMechanicId(e.target.value)}
                >
                  {mechanics.map(mech => (
                    <option key={mech.id} value={mech.id}>
                      {mech.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setAssignTargetId(null)}>Cancel</Button>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={handleConfirmAssign}
                disabled={loadingMechanics || mechanics.length === 0}
              >
                Confirm Assignment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* START WORKING CONFIRMATION MODAL */}
      {startWorkOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4 scale-100 transform transition-all">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mb-2">
                <Loader2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Start Working?</h3>
              <p className="text-sm text-gray-500">
                Are you ready to begin working on this order? This will track your start time.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setStartWorkOrderId(null)}>Cancel</Button>
              <Button
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                onClick={handleConfirmStart}
                disabled={actionLoading === startWorkOrderId}
              >
                {actionLoading === startWorkOrderId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Yes, Start Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
