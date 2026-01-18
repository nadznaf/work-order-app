'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRole } from '@/src/context/RoleContext';
import api from '@/src/api/axios';
import { UserRole } from '@/src/types/enums';

// UI Components
import { Card, CardContent } from '@/src/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Loader2, AlertCircle, X } from 'lucide-react';

interface WorkOrder {
  id: string;
  title: string;
  description?: string;
  status: 'OPEN' | 'SUBMITTED' | 'ASSIGNED' | 'WORKING' | 'COMPLETED';
  start_date?: string;
  end_date?: string;
  created_at: string;
}

import { userService } from '@/src/services/userService';
import { User } from '@/src/types/user';

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

  const fetchWorkOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/work-orders');
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

  // Helper: Status Badge Color
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'OPEN': return 'destructive';
      case 'SUBMITTED': return 'info';
      case 'ASSIGNED': return 'warning';
      case 'WORKING': return 'warning';
      case 'COMPLETED': return 'success'; 
      default: return 'secondary';
    }
  };

  // Helper: Status Label Mapper
  const getStatusLabel = (status: string) => {
    switch (status) {
        case 'OPEN': return 'Breakdown';
        case 'WORKING': return 'On Progress';
        case 'ASSIGNED': return 'On Progress';
        default: return status;
    }
  }

  // Helper: Format Date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).replace(',', '');
  };

  const handleAction = async (wo: WorkOrder, action: string, endpointSuffix: string, body = {}) => {
    if (action !== 'Assign' && !confirm(`Are you sure you want to ${action} this Work Order?`)) return;

    setActionLoading(wo.id);
    try {
      await api.post(`/work-orders/${wo.id}/${endpointSuffix}`, body);
      await fetchWorkOrders(); 
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      alert(`Failed to ${action}: ${msg}`);
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
      alert("Failed to load mechanics list");
    } finally {
      setLoadingMechanics(false);
    }
  };

  const handleConfirmAssign = async () => {
    if (!assignTargetId) return;

    // Validate selection
    if (!selectedMechanicId) {
      alert("Please select a mechanic");
      return;
    }

    const wo = workOrders.find(w => w.id === assignTargetId);
    if (!wo) return;

    setActionLoading(assignTargetId); // Set loading on the row
    setAssignTargetId(null); // Close modal

    try {
      await api.post(`/work-orders/${wo.id}/assign`, { mechanic_id: selectedMechanicId });
      await fetchWorkOrders();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      alert(`Failed to Assign: ${msg}`);
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
            onClick={() => handleAction(wo, 'Start Working', 'start')}
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

        <CardContent className="p-0 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
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
                <TableHeader className="bg-cyan-100/50 text-cyan-900">
                <TableRow className="border-b border-cyan-200">
                    <TableHead className="w-[50px] text-cyan-900 font-semibold">No</TableHead>
                    <TableHead className="text-cyan-900 font-semibold">Work Order</TableHead>
                    <TableHead className="text-cyan-900 font-semibold">WO Number</TableHead>
                    <TableHead className="text-cyan-900 font-semibold">Start Date</TableHead>
                    <TableHead className="text-cyan-900 font-semibold">End Date</TableHead>
                    <TableHead className="text-cyan-900 font-semibold">Created Time</TableHead>

                    <TableHead className="text-center text-cyan-900 font-semibold">Status</TableHead>
                    <TableHead className="text-center text-cyan-900 font-semibold">Action</TableHead>
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
                    <TableRow key={wo.id} className="even:bg-[#F9FAFB] hover:bg-gray-50 transition-colors border-b border-gray-50" onClick={() => window.location.href = `/work-orders/${wo.id}`}>
                          <TableCell className="font-medium text-gray-600">{index + 1}</TableCell>
                          <TableCell>
                            <span className="font-medium text-gray-700">{wo.title}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-gray-500 font-mono">...{wo.id.slice(-6)}</span>
                          </TableCell>
                          <TableCell className="text-xs text-gray-600 whitespace-nowrap">
                            {formatDate(wo.start_date)}
                          </TableCell>
                          <TableCell className="text-xs text-gray-600 whitespace-nowrap">
                            {formatDate(wo.end_date)}
                          </TableCell>
                          <TableCell className="text-xs text-gray-600 whitespace-nowrap">
                            {formatDate(wo.created_at)}
                          </TableCell>

                          <TableCell className="text-center">
                            <Badge variant={getStatusBadgeVariant(wo.status) as any} className="capitalize text-[10px] px-3 py-1 font-normal tracking-wide rounded-full shadow-sm">
                                {getStatusLabel(wo.status)}
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
            <div className="flex items-center justify-end px-4 py-4 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 gap-4">
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
    </>
  );
}
