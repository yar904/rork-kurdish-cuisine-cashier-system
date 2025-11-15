import { createTRPCRouter, publicProcedure } from "../_shared/trpc-router.ts";
import { z } from "npm:zod@3.22.4";

const exampleRouter = createTRPCRouter({
  hi: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => {
      return { hello: input.name };
    }),
});

const menuRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("menu_items")
      .select("*")
      .order("category", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        nameKurdish: z.string().optional(),
        description: z.string().optional(),
        price: z.number(),
        category: z.string(),
        image: z.string().optional(),
        available: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("menu_items")
        .insert(input)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        nameKurdish: z.string().optional(),
        description: z.string().optional(),
        price: z.number().optional(),
        category: z.string().optional(),
        image: z.string().optional(),
        available: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const { data, error } = await ctx.supabase
        .from("menu_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("menu_items")
        .delete()
        .eq("id", input.id);

      if (error) throw new Error(error.message);
      return { success: true };
    }),

  getIngredients: publicProcedure
    .input(z.object({ menuItemId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("menu_ingredients")
        .select("*, inventory_items(*)")
        .eq("menu_item_id", input.menuItemId);

      if (error) throw new Error(error.message);
      return data || [];
    }),

  linkIngredients: publicProcedure
    .input(
      z.object({
        menuItemId: z.string(),
        ingredients: z.array(
          z.object({
            inventoryItemId: z.string(),
            quantityNeeded: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.supabase
        .from("menu_ingredients")
        .delete()
        .eq("menu_item_id", input.menuItemId);

      const links = input.ingredients.map((ing) => ({
        menu_item_id: input.menuItemId,
        inventory_item_id: ing.inventoryItemId,
        quantity_needed: ing.quantityNeeded,
      }));

      const { error } = await ctx.supabase
        .from("menu_ingredients")
        .insert(links);

      if (error) throw new Error(error.message);
      return { success: true };
    }),
});

const tablesRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("tables")
      .select("*")
      .order("table_number", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }),

  updateStatus: publicProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["available", "occupied", "reserved"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("tables")
        .update({ status: input.status })
        .eq("id", input.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),
});

const ordersRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        tableNumber: z.number(),
        items: z.array(
          z.object({
            menuItemId: z.string(),
            quantity: z.number(),
            price: z.number(),
            notes: z.string().optional(),
          })
        ),
        waiterName: z.string().optional(),
        totalAmount: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data: order, error: orderError } = await ctx.supabase
        .from("orders")
        .insert({
          table_number: input.tableNumber,
          waiter_name: input.waiterName,
          total_amount: input.totalAmount,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw new Error(orderError.message);

      const orderItems = input.items.map((item) => ({
        order_id: order.id,
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes,
      }));

      const { error: itemsError } = await ctx.supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw new Error(itemsError.message);

      return { orderId: order.id, ...order };
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("orders")
      .select("*, order_items(*, menu_items(*))")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }),

  updateStatus: publicProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum([
          "pending",
          "preparing",
          "ready",
          "served",
          "completed",
          "cancelled",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("orders")
        .update({ status: input.status })
        .eq("id", input.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),
});

const serviceRequestsRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        tableNumber: z.number(),
        type: z.enum(["waiter", "bill", "water", "napkins", "other"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("service_requests")
        .insert({
          table_number: input.tableNumber,
          type: input.type,
          notes: input.notes,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("service_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }),

  updateStatus: publicProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["pending", "in-progress", "completed"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("service_requests")
        .update({ status: input.status })
        .eq("id", input.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),
});

const ratingsRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        menuItemId: z.string(),
        tableNumber: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("ratings")
        .insert({
          menu_item_id: input.menuItemId,
          table_number: input.tableNumber,
          rating: input.rating,
          comment: input.comment,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  getByMenuItem: publicProcedure
    .input(z.object({ menuItemId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("ratings")
        .select("*")
        .eq("menu_item_id", input.menuItemId)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return data || [];
    }),

  getAllStats: publicProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("ratings")
      .select("menu_item_id, rating, menu_items(name, nameKurdish)");

    if (error) throw new Error(error.message);
    return data || [];
  }),
});

const customerHistoryRouter = createTRPCRouter({
  save: publicProcedure
    .input(
      z.object({
        tableNumber: z.number(),
        orderId: z.string(),
        items: z.array(z.any()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("customer_order_history")
        .insert({
          table_number: input.tableNumber,
          order_id: input.orderId,
          items: input.items,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  getByTable: publicProcedure
    .input(z.object({ tableId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("customer_order_history")
        .select("*")
        .eq("table_number", input.tableId)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return data || [];
    }),
});

const employeesRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("employees")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        role: z.enum(["waiter", "chef", "cashier", "manager"]),
        phoneNumber: z.string().optional(),
        hourlyRate: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("employees")
        .insert(input)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        role: z.enum(["waiter", "chef", "cashier", "manager"]).optional(),
        phoneNumber: z.string().optional(),
        hourlyRate: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const { data, error } = await ctx.supabase
        .from("employees")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("employees")
        .delete()
        .eq("id", input.id);

      if (error) throw new Error(error.message);
      return { success: true };
    }),

  clockIn: publicProcedure
    .input(z.object({ employeeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("time_clock")
        .insert({
          employee_id: input.employeeId,
          clock_in: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  clockOut: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("time_clock")
        .update({ clock_out: new Date().toISOString() })
        .eq("id", input.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  getClockRecords: publicProcedure
    .input(z.object({ employeeId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from("time_clock")
        .select("*, employees(name, role)")
        .order("clock_in", { ascending: false });

      if (input.employeeId) {
        query = query.eq("employee_id", input.employeeId);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);
      return data || [];
    }),

  getShifts: publicProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("shifts")
      .select("*, employees(name, role)")
      .order("start_time", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }),

  createShift: publicProcedure
    .input(
      z.object({
        employeeId: z.string(),
        startTime: z.string(),
        endTime: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("shifts")
        .insert({
          employee_id: input.employeeId,
          start_time: input.startTime,
          end_time: input.endTime,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  getMetrics: publicProcedure
    .input(z.object({ employeeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data: employee, error: empError } = await ctx.supabase
        .from("employees")
        .select("*")
        .eq("id", input.employeeId)
        .single();

      if (empError) throw new Error(empError.message);

      const { data: orders, error: ordersError } = await ctx.supabase
        .from("orders")
        .select("*")
        .eq("waiter_name", employee.name);

      if (ordersError) throw new Error(ordersError.message);

      return {
        employee,
        totalOrders: orders?.length || 0,
        totalRevenue:
          orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0,
      };
    }),
});

const inventoryRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("inventory_items")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }),

  getLowStock: publicProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("inventory_items")
      .select("*")
      .lt("quantity", 10)
      .order("quantity", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        quantity: z.number(),
        unit: z.string(),
        supplierId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("inventory_items")
        .insert(input)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        quantity: z.number().optional(),
        unit: z.string().optional(),
        supplierId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const { data, error } = await ctx.supabase
        .from("inventory_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  adjustStock: publicProcedure
    .input(
      z.object({
        inventoryItemId: z.string(),
        quantityChange: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data: item, error: fetchError } = await ctx.supabase
        .from("inventory_items")
        .select("quantity")
        .eq("id", input.inventoryItemId)
        .single();

      if (fetchError) throw new Error(fetchError.message);

      const newQuantity = (item.quantity || 0) + input.quantityChange;

      const { data, error } = await ctx.supabase
        .from("inventory_items")
        .update({ quantity: newQuantity })
        .eq("id", input.inventoryItemId)
        .select()
        .single();

      if (error) throw new Error(error.message);

      await ctx.supabase.from("stock_movements").insert({
        inventory_item_id: input.inventoryItemId,
        quantity_change: input.quantityChange,
        reason: input.reason,
      });

      return data;
    }),

  getMovements: publicProcedure
    .input(z.object({ inventoryItemId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from("stock_movements")
        .select("*, inventory_items(name)")
        .order("created_at", { ascending: false });

      if (input.inventoryItemId) {
        query = query.eq("inventory_item_id", input.inventoryItemId);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);
      return data || [];
    }),
});

const suppliersRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("suppliers")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        contactPerson: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("suppliers")
        .insert(input)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),
});

const reportsRouter = createTRPCRouter({
  summary: publicProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { data: orders, error } = await ctx.supabase
        .from("orders")
        .select("*")
        .gte("created_at", input.startDate)
        .lte("created_at", input.endDate);

      if (error) throw new Error(error.message);

      const totalRevenue = orders?.reduce((sum, o) => sum + o.total_amount, 0) || 0;
      const totalOrders = orders?.length || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      return {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        orders: orders || [],
      };
    }),

  comparison: publicProcedure
    .input(
      z.object({
        period1Start: z.string(),
        period1End: z.string(),
        period2Start: z.string(),
        period2End: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { data: period1, error: e1 } = await ctx.supabase
        .from("orders")
        .select("*")
        .gte("created_at", input.period1Start)
        .lte("created_at", input.period1End);

      const { data: period2, error: e2 } = await ctx.supabase
        .from("orders")
        .select("*")
        .gte("created_at", input.period2Start)
        .lte("created_at", input.period2End);

      if (e1 || e2) throw new Error("Failed to fetch comparison data");

      const p1Revenue = period1?.reduce((sum, o) => sum + o.total_amount, 0) || 0;
      const p2Revenue = period2?.reduce((sum, o) => sum + o.total_amount, 0) || 0;

      return {
        period1: {
          revenue: p1Revenue,
          orders: period1?.length || 0,
        },
        period2: {
          revenue: p2Revenue,
          orders: period2?.length || 0,
        },
        growth: {
          revenue: p1Revenue > 0 ? ((p2Revenue - p1Revenue) / p1Revenue) * 100 : 0,
          orders:
            (period1?.length || 0) > 0
              ? (((period2?.length || 0) - (period1?.length || 0)) / (period1?.length || 0)) * 100
              : 0,
        },
      };
    }),

  financial: publicProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { data: orders, error } = await ctx.supabase
        .from("orders")
        .select("*, order_items(*, menu_items(*))")
        .gte("created_at", input.startDate)
        .lte("created_at", input.endDate);

      if (error) throw new Error(error.message);

      const revenue = orders?.reduce((sum, o) => sum + o.total_amount, 0) || 0;

      return {
        revenue,
        orders: orders?.length || 0,
        averageOrderValue: orders?.length ? revenue / orders.length : 0,
        topItems: [],
      };
    }),

  employeePerformance: publicProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { data: orders, error } = await ctx.supabase
        .from("orders")
        .select("waiter_name, total_amount")
        .gte("created_at", input.startDate)
        .lte("created_at", input.endDate)
        .not("waiter_name", "is", null);

      if (error) throw new Error(error.message);

      const performance = (orders || []).reduce(
        (acc: any, order: any) => {
          const name = order.waiter_name;
          if (!acc[name]) {
            acc[name] = { orders: 0, revenue: 0 };
          }
          acc[name].orders += 1;
          acc[name].revenue += order.total_amount;
          return acc;
        },
        {}
      );

      return Object.entries(performance).map(([name, stats]: [string, any]) => ({
        name,
        orders: stats.orders,
        revenue: stats.revenue,
      }));
    }),
});

export const appRouter = createTRPCRouter({
  example: exampleRouter,
  menu: menuRouter,
  tables: tablesRouter,
  orders: ordersRouter,
  serviceRequests: serviceRequestsRouter,
  ratings: ratingsRouter,
  customerHistory: customerHistoryRouter,
  employees: employeesRouter,
  inventory: inventoryRouter,
  suppliers: suppliersRouter,
  reports: reportsRouter,
});

export type AppRouter = typeof appRouter;
