import { Badge } from '@/src/components/ui/badge';

export interface WorkOrder {
  id: string;
  title: string;
  description?: string;
  status: 'OPEN' | 'SUBMITTED' | 'ASSIGNED' | 'WORKING' | 'COMPLETED';
  created_by: string;
  assigned_mechanic_id?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  updated_at: string;
  // Extended for Detail with relations if available
  sparepartRequests?: SparepartRequest[];
}

export interface SparepartRequest {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  items: { id: string; name: string; qty: number }[];
  created_at: string;
}

export const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'OPEN': return 'destructive'; 
      case 'SUBMITTED': return 'secondary';
      case 'ASSIGNED': return 'indigo';
      case 'WORKING': return 'info'; 
      case 'COMPLETED': return 'success';
      case 'PENDING': return 'warning';
      case 'APPROVED': return 'success';
      default: return 'secondary';
    }
};

export const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).replace(',', '');
};
