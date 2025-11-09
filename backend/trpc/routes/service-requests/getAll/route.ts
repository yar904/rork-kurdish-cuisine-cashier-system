import { publicProcedure } from '../../../create-context';
import { supabase } from '@/backend/lib/supabase';

export const getAllServiceRequestsProcedure = publicProcedure.query(async () => {
  const { data, error } = await supabase
    .from('table_service_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching service requests:', error);
    throw new Error('Failed to fetch service requests');
  }

  const requests = data.map((req) => ({
    id: req.id,
    tableNumber: req.table_number,
    requestType: req.request_type as 'waiter' | 'bill' | 'wrong-order',
    status: req.status as 'pending' | 'in-progress' | 'resolved',
    message: req.message || undefined,
    createdAt: new Date(req.created_at),
    resolvedAt: req.resolved_at ? new Date(req.resolved_at) : undefined,
    resolvedBy: req.resolved_by || undefined,
  }));

  return requests;
});
