import { Hono } from "hono";
import { cors } from "hono/cors";
import { trpcServer } from "@hono/trpc-server";
import { createSupabaseClient } from "@supabase/supabase-js";
import { initTRPC } from "@trpc/server";
import { z } from "zod";

const app = new Hono();

app.use("*", cors({
  origin: (origin) => {
    const allowedOrigins = [
      "https://kurdish-cuisine-cashier-system.rork.app",
      "https://tapse.netlify.app",
      "http://localhost:8081",
      "http://localhost:3000",
    ];
    if (!origin || 
        origin.startsWith("exp://") || 
        origin.endsWith(".rork.app") || 
        origin.endsWith(".netlify.app") ||
        origin.endsWith(".supabase.co") ||
        allowedOrigins.includes(origin)) {
      return origin || "*";
    }
    return null;
  },
  credentials: true,
}));

const t = initTRPC.create();
const publicProcedure = t.procedure;
const createTRPCRouter = t.router;

const supabase = createSupabaseClient(
  process.env.SUPABASE_PROJECT_URL || process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

const createServiceRequestProcedure = publicProcedure
  .input(
    z.object({
      tableNumber: z.number(),
      requestType: z.enum(['waiter', 'bill', 'assistance']),
      messageText: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const { tableNumber, requestType, messageText } = input;

    console.log(`[Service Request] Creating ${requestType} for table ${tableNumber}`);

    const { data, error } = await supabase
      .from('service_requests')
      .insert({
        table_number: tableNumber,
        request_type: requestType,
        status: 'pending',
        message: messageText || '',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[Service Request] Error:', error);
      throw new Error(`Failed to send service request: ${error.message}`);
    }

    console.log(`[Service Request] ✅ Created successfully: ${data.id}`);
    return { success: true, message: 'Request sent successfully', data };
  });

const getAllServiceRequestsProcedure = publicProcedure
  .input(z.object({ status: z.enum(['pending', 'in-progress', 'completed']).optional() }).optional())
  .query(async ({ input }) => {
    let query = supabase
      .from('service_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (input?.status) {
      query = query.eq('status', input.status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Service Requests] Error fetching:', error);
      throw new Error(`Failed to fetch service requests: ${error.message}`);
    }

    return data || [];
  });

const updateServiceRequestStatusProcedure = publicProcedure
  .input(z.object({
    id: z.string().uuid(),
    status: z.enum(['pending', 'in-progress', 'completed']),
  }))
  .mutation(async ({ input }) => {
    const { id, status } = input;

    const { data, error } = await supabase
      .from('service_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Service Request] Update error:', error);
      throw new Error(`Failed to update service request: ${error.message}`);
    }

    return data;
  });

const menuGetAllProcedure = publicProcedure.query(async () => {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('[Menu] Error fetching:', error);
    throw new Error(`Failed to fetch menu items: ${error.message}`);
  }

  return data || [];
});

const ordersCreateProcedure = publicProcedure
  .input(
    z.object({
      tableNumber: z.number(),
      items: z.array(z.object({
        menuItemId: z.string(),
        quantity: z.number(),
        notes: z.string().optional(),
      })),
      total: z.number(),
    })
  )
  .mutation(async ({ input }) => {
    const { tableNumber, items, total } = input;

    console.log(`[Orders] Creating order for table ${tableNumber}`);

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        table_number: tableNumber,
        status: 'pending',
        total,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (orderError) {
      console.error('[Orders] Error creating order:', orderError);
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    const orderItems = items.map(item => ({
      order_id: orderData.id,
      menu_item_id: item.menuItemId,
      quantity: item.quantity,
      notes: item.notes || '',
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('[Orders] Error creating order items:', itemsError);
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }

    console.log(`[Orders] ✅ Created successfully: ${orderData.id}`);
    return { success: true, orderId: orderData.id, data: orderData };
  });

const ordersGetAllProcedure = publicProcedure
  .input(z.object({ tableNumber: z.number().optional() }).optional())
  .query(async ({ input }) => {
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          menu_items (*)
        )
      `)
      .order('created_at', { ascending: false });

    if (input?.tableNumber) {
      query = query.eq('table_number', input.tableNumber);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Orders] Error fetching:', error);
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }

    return data || [];
  });

const ratingsGetAllStatsProcedure = publicProcedure.query(async () => {
  const { data, error } = await supabase
    .from('ratings')
    .select('menu_item_id, rating');

  if (error) {
    console.error('[Ratings] Error fetching:', error);
    return [];
  }

  const statsMap = new Map();
  
  data?.forEach(rating => {
    const existing = statsMap.get(rating.menu_item_id) || { totalRatings: 0, sumRatings: 0 };
    existing.totalRatings++;
    existing.sumRatings += rating.rating;
    statsMap.set(rating.menu_item_id, existing);
  });

  return Array.from(statsMap.entries()).map(([menuItemId, stats]) => ({
    menuItemId,
    totalRatings: stats.totalRatings,
    averageRating: stats.sumRatings / stats.totalRatings,
  }));
});

const appRouter = createTRPCRouter({
  serviceRequests: createTRPCRouter({
    create: createServiceRequestProcedure,
    getAll: getAllServiceRequestsProcedure,
    updateStatus: updateServiceRequestStatusProcedure,
  }),
  menu: createTRPCRouter({
    getAll: menuGetAllProcedure,
  }),
  orders: createTRPCRouter({
    create: ordersCreateProcedure,
    getAll: ordersGetAllProcedure,
  }),
  ratings: createTRPCRouter({
    getAllStats: ratingsGetAllStatsProcedure,
  }),
});

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: () => ({}),
  })
);

app.get("/", (c) => c.json({ 
  status: "✅ Tapse backend is running", 
  version: "1.0.0",
  timestamp: new Date().toISOString()
}));

app.get("/health", (c) =>
  c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  })
);

export default async (req, context) => {
  try {
    console.log('[Netlify Function] Incoming request:', req.method, req.url);
    const response = await app.fetch(req, {
      ...context,
      waitUntil: context.waitUntil?.bind(context),
    });
    console.log('[Netlify Function] Response status:', response.status);
    return response;
  } catch (error) {
    console.error('[Netlify Function] Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      message: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
