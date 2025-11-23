import { publicProcedure } from "@/backend/trpc/create-context";
import { supabase } from "@/backend/lib/supabase";

export const getWaiterRequestsProcedure = publicProcedure.query(async () => {
  const { data, error } = await supabase
    .from('service_requests')
    .select('*')
    .in('status', ['pending', 'in-progress'])
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[Waiter GetRequests] Error fetching service requests:', error);
    throw new Error('Failed to fetch service requests');
  }

  return data.map(req => ({
    id: req.id,
    tableNumber: req.table_number,
    requestType: req.request_type,
    status: req.status,
    message: req.message || undefined,
    createdAt: new Date(req.created_at),
    resolvedAt: req.resolved_at ? new Date(req.resolved_at) : undefined,
    resolvedBy: req.resolved_by || undefined,
  }));
});
