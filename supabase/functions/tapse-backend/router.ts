import { createTRPCRouter, publicProcedure } from "../_shared/trpc-router.ts";
import type { Context } from "../_shared/trpc-context.ts";
import { z } from "npm:zod@3.22.4";

const tableStatusEnum = z.enum([
  "available",
  "occupied",
  "reserved",
  "needs-cleaning",
]);

const orderStatusEnum = z.enum([
  "pending",
  "preparing",
  "ready",
  "served",
  "completed",
  "cancelled",
  "paid",
]);

const serviceRequestStatusEnum = z.enum([
  "pending",
  "in-progress",
  "completed",
]);

const serviceRequestTypeEnum = z.enum([
  "waiter",
  "bill",
  "water",
  "napkins",
  "other",
]);

const getLowStockItems = async (
  supabase: Context["supabase"],
  threshold?: number
) => {
  const { data, error } = await supabase
    .from("inventory_items")
    .select("*")
    .order("current_stock", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).filter((item) =>
    typeof threshold === "number"
      ? item.current_stock <= threshold
      : item.current_stock <= item.minimum_stock
  );
};

const getRatingStats = async (supabase: Context["supabase"]) => {
  const { data, error } = await supabase
    .from("ratings")
    .select("menu_item_id, rating, menu_items(name, name_kurdish)");

  if (error) throw new Error(error.message);

  const statsMap: Record<
    string,
    { count: number; total: number; name: string; name_kurdish: string }
  > = {};

  (data ?? []).forEach((entry) => {
    if (!statsMap[entry.menu_item_id]) {
      statsMap[entry.menu_item_id] = {
        count: 0,
        total: 0,
        name: entry.menu_items?.name ?? "Unknown",
        name_kurdish: entry.menu_items?.name_kurdish ?? "",
      };
    }

    statsMap[entry.menu_item_id].count += 1;
    statsMap[entry.menu_item_id].total += entry.rating;
  });

  return Object.entries(statsMap).map(([menuItemId, stat]) => ({
    menuItemId,
    name: stat.name,
    nameKurdish: stat.name_kurdish,
    averageRating: stat.count ? stat.total / stat.count : 0,
    totalRatings: stat.count,
  }));
};

const menuRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("menu_items")
      .select("*")
      .order("category", { ascending: true })
      .order("name_kurdish", { ascending: true });

    if (error) throw new Error(error.message);
    return data ?? [];
  }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().optional(),
        nameKurdish: z.string(),
        nameArabic: z.string().optional(),
        category: z.string(),
        price: z.number(),
        cost: z.number().optional(),
        description: z.string().optional(),
        descriptionKurdish: z.string().optional(),
        descriptionArabic: z.string().optional(),
        image: z.string().optional(),
        available: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const payload = {
        name: input.name ?? input.nameKurdish,
        name_kurdish: input.nameKurdish,
        name_arabic: input.nameArabic ?? input.nameKurdish,
        category: input.category,
        price: input.price,
        cost: input.cost ?? input.price,
        description: input.description ?? input.nameKurdish,
        description_kurdish: input.descriptionKurdish ?? input.nameKurdish,
        description_arabic:
          input.descriptionArabic ?? input.description ?? input.nameKurdish,
        image: input.image ?? null,
        available: input.available ?? true,
      };

      const { data, error } = await ctx.supabase
        .from("menu_items")
        .insert(payload)
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
        nameArabic: z.string().optional(),
        category: z.string().optional(),
        price: z.number().optional(),
        cost: z.number().optional(),
        description: z.string().optional(),
        descriptionKurdish: z.string().optional(),
        descriptionArabic: z.string().optional(),
        image: z.string().optional(),
        available: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      const updates: Record<string, unknown> = {};

      if (rest.name !== undefined) updates.name = rest.name;
      if (rest.nameKurdish !== undefined)
        updates.name_kurdish = rest.nameKurdish;
      if (rest.nameArabic !== undefined) updates.name_arabic = rest.nameArabic;
      if (rest.category !== undefined) updates.category = rest.category;
      if (rest.price !== undefined) updates.price = rest.price;
      if (rest.cost !== undefined) updates.cost = rest.cost;
      if (rest.description !== undefined) updates.description = rest.description;
      if (rest.descriptionKurdish !== undefined)
        updates.description_kurdish = rest.descriptionKurdish;
      if (rest.descriptionArabic !== undefined)
        updates.description_arabic = rest.descriptionArabic;
      if (rest.image !== undefined) updates.image = rest.image;
      if (rest.available !== undefined) updates.available = rest.available;

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
      await ctx.supabase
        .from("menu_ingredients")
        .delete()
        .eq("menu_item_id", input.id);

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
      return data ?? [];
    }),

  linkIngredients: publicProcedure
    .input(
      z.object({
        menuItemId: z.string(),
        ingredients: z.array(
          z.object({
            inventoryItemId: z.string(),
            quantityNeeded: z.number().positive(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.supabase
        .from("menu_ingredients")
        .delete()
        .eq("menu_item_id", input.menuItemId);

      if (input.ingredients.length === 0) {
        return { success: true };
      }

      const rows = input.ingredients.map((ingredient) => ({
        menu_item_id: input.menuItemId,
        inventory_item_id: ingredient.inventoryItemId,
        quantity_needed: ingredient.quantityNeeded,
      }));

      const { error } = await ctx.supabase
        .from("menu_ingredients")
        .insert(rows);

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

    return (data ?? []).map((table) => ({
      ...table,
      number: table.table_number,
    }));
  }),

  getByNumber: publicProcedure
    .input(z.object({ tableNumber: z.number() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("tables")
        .select("*")
        .eq("table_number", input.tableNumber)
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!data) return null;

      return { ...data, number: data.table_number };
    }),

  updateStatus: publicProcedure
    .input(
      z.object({
        tableNumber: z.number(),
        status: tableStatusEnum,
        currentOrderId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("tables")
        .update({
          status: input.status,
          current_order_id: input.currentOrderId ?? null,
          last_cleaned:
            input.status === "available"
              ? new Date().toISOString()
              : undefined,
        })
        .eq("table_number", input.tableNumber)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return { ...data, number: data.table_number };
    }),
});

const ordersRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        tableNumber: z.number(),
        items: z
          .array(
            z.object({
              menuItemId: z.string(),
              quantity: z.number().positive(),
              price: z.number().nonnegative(),
              notes: z.string().optional(),
            })
          )
          .min(1),
        waiterName: z.string().optional(),
        totalAmount: z.number().nonnegative(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const computedTotal = input.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const totalToPersist = Number.isFinite(computedTotal)
        ? computedTotal
        : input.totalAmount;

      const { data: order, error: orderError } = await ctx.supabase
        .from("orders")
        .insert({
          table_number: input.tableNumber,
          waiter_name: input.waiterName ?? null,
          total_amount: totalToPersist,
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
        notes: item.notes ?? null,
      }));

      const { error: itemsError } = await ctx.supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw new Error(itemsError.message);

      await ctx.supabase
        .from("tables")
        .update({ status: "occupied", current_order_id: order.id })
        .eq("table_number", input.tableNumber);

      return { orderId: order.id, ...order };
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("orders")
      .select("*, order_items(*, menu_items(*)), tables!inner(table_number, status)")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  }),

  updateStatus: publicProcedure
    .input(
      z.object({
        id: z.string(),
        status: orderStatusEnum,
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

      if (["completed", "paid", "cancelled"].includes(input.status)) {
        await ctx.supabase
          .from("tables")
          .update({
            status: input.status === "cancelled" ? "available" : "needs-cleaning",
            current_order_id: null,
          })
          .eq("table_number", data.table_number);
      }

      return data;
    }),
});

const serviceRequestsRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        tableNumber: z.number(),
        type: serviceRequestTypeEnum,
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("service_requests")
        .insert({
          table_number: input.tableNumber,
          type: input.type,
          notes: input.notes ?? null,
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
    return data ?? [];
  }),

  updateStatus: publicProcedure
    .input(
      z.object({
        id: z.string(),
        status: serviceRequestStatusEnum,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const payload: Record<string, unknown> = { status: input.status };
      if (input.status === "completed") {
        payload["completed_at"] = new Date().toISOString();
      }

      const { data, error } = await ctx.supabase
        .from("service_requests")
        .update(payload)
        .eq("id", input.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),
});

const customerHistoryRouter = createTRPCRouter({
  save: publicProcedure
    .input(
      z.object({
        tableNumber: z.number(),
        orderId: z.string(),
        items: z.array(
          z.object({
            name: z.string(),
            quantity: z.number(),
            price: z.number(),
            notes: z.string().optional().nullable(),
          })
        ),
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
    .input(
      z.object({
        tableNumber: z.union([z.number(), z.string()]),
      })
    )
    .query(async ({ ctx, input }) => {
      const tableNumber = Number(input.tableNumber);

      const { data, error } = await ctx.supabase
        .from("customer_order_history")
        .select("*")
        .eq("table_number", tableNumber)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return data ?? [];
    }),
});

const employeesRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    return data ?? [];
  }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        role: z.enum(["waiter", "chef", "cashier", "manager"]),
        phone: z.string().optional(),
        email: z.string().optional(),
        hourlyRate: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("employees")
        .insert({
          name: input.name,
          role: input.role,
          phone: input.phone ?? null,
          email: input.email ?? null,
          hourly_rate: input.hourlyRate,
          status: "active",
        })
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
      const { data: existingOpen } = await ctx.supabase
        .from("clock_records")
        .select("id")
        .eq("employee_id", input.employeeId)
        .is("clock_out", null)
        .maybeSingle();

      if (existingOpen) {
        throw new Error("Employee already clocked in");
      }

      const { data, error } = await ctx.supabase
        .from("clock_records")
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
    .input(
      z.object({
        employeeId: z.string(),
        breakMinutes: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data: openRecord, error: fetchError } = await ctx.supabase
        .from("clock_records")
        .select("id")
        .eq("employee_id", input.employeeId)
        .is("clock_out", null)
        .order("clock_in", { ascending: false })
        .limit(1)
        .single();

      if (fetchError) throw new Error(fetchError.message);
      if (!openRecord) throw new Error("No active clock-in found");

      const { data, error } = await ctx.supabase
        .from("clock_records")
        .update({
          clock_out: new Date().toISOString(),
          break_minutes: input.breakMinutes ?? 0,
        })
        .eq("id", openRecord.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  getClockRecords: publicProcedure
    .input(z.object({ employeeId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from("clock_records")
        .select("*, employees(name, role)")
        .order("clock_in", { ascending: false });

      if (input.employeeId) {
        query = query.eq("employee_id", input.employeeId);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);
      return data ?? [];
    }),

  getShifts: publicProcedure
    .input(z.object({ employeeId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from("shifts")
        .select("*")
        .order("shift_date", { ascending: false });

      if (input?.employeeId) {
        query = query.eq("employee_id", input.employeeId);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);
      return data ?? [];
    }),

  getMetrics: publicProcedure
    .input(z.object({ employeeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data: employee, error: employeeError } = await ctx.supabase
        .from("employees")
        .select("*")
        .eq("id", input.employeeId)
        .single();

      if (employeeError) throw new Error(employeeError.message);

      const { data: orders, error: ordersError } = await ctx.supabase
        .from("orders")
        .select("*")
        .eq("waiter_name", employee.name);

      if (ordersError) throw new Error(ordersError.message);

      const totalOrders = orders?.length ?? 0;
      const totalRevenue =
        orders?.reduce((sum, order) => sum + (order.total_amount ?? 0), 0) ?? 0;

      return {
        employee,
        totalOrders,
        totalRevenue,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
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
    return data ?? [];
  }),

  getLowStock: publicProcedure
    .input(z.object({ threshold: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return getLowStockItems(ctx.supabase, input?.threshold);
    }),

  lowStock: publicProcedure
    .input(z.object({ threshold: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return getLowStockItems(ctx.supabase, input?.threshold);
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        category: z.string(),
        unit: z.string(),
        currentStock: z.number(),
        minimumStock: z.number(),
        costPerUnit: z.number(),
        supplierId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const payload = {
        name: input.name,
        category: input.category,
        unit: input.unit,
        current_stock: input.currentStock,
        minimum_stock: input.minimumStock,
        cost_per_unit: input.costPerUnit,
        supplier_id: input.supplierId ?? null,
      };

      const { data, error } = await ctx.supabase
        .from("inventory_items")
        .insert(payload)
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
        category: z.string().optional(),
        unit: z.string().optional(),
        currentStock: z.number().optional(),
        minimumStock: z.number().optional(),
        costPerUnit: z.number().optional(),
        supplierId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      const updates: Record<string, unknown> = {};

      if (rest.name !== undefined) updates.name = rest.name;
      if (rest.category !== undefined) updates.category = rest.category;
      if (rest.unit !== undefined) updates.unit = rest.unit;
      if (rest.currentStock !== undefined)
        updates.current_stock = rest.currentStock;
      if (rest.minimumStock !== undefined)
        updates.minimum_stock = rest.minimumStock;
      if (rest.costPerUnit !== undefined)
        updates.cost_per_unit = rest.costPerUnit;
      if (rest.supplierId !== undefined)
        updates.supplier_id = rest.supplierId;

      const { data, error } = await ctx.supabase
        .from("inventory_items")
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
      await ctx.supabase
        .from("menu_ingredients")
        .delete()
        .eq("inventory_item_id", input.id);

      const { error } = await ctx.supabase
        .from("inventory_items")
        .delete()
        .eq("id", input.id);

      if (error) throw new Error(error.message);
      return { success: true };
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
        .select("current_stock")
        .eq("id", input.inventoryItemId)
        .single();

      if (fetchError) throw new Error(fetchError.message);

      const newQuantity = Math.max(
        0,
        (item.current_stock ?? 0) + input.quantityChange
      );

      const { data, error } = await ctx.supabase
        .from("inventory_items")
        .update({ current_stock: newQuantity })
        .eq("id", input.inventoryItemId)
        .select()
        .single();

      if (error) throw new Error(error.message);

      await ctx.supabase.from("stock_movements").insert({
        inventory_item_id: input.inventoryItemId,
        quantity_change: input.quantityChange,
        reason: input.reason ?? null,
      });

      return data;
    }),

  getMovements: publicProcedure
    .input(z.object({ inventoryItemId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from("stock_movements")
        .select("*, inventory_items(name, unit)")
        .order("created_at", { ascending: false });

      if (input?.inventoryItemId) {
        query = query.eq("inventory_item_id", input.inventoryItemId);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);
      return data ?? [];
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
          comment: input.comment ?? null,
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
      return data ?? [];
    }),

  getStats: publicProcedure.query(async ({ ctx }) => {
    return getRatingStats(ctx.supabase);
  }),

  getAllStats: publicProcedure.query(async ({ ctx }) => {
    return getRatingStats(ctx.supabase);
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

      const totalRevenue =
        orders?.reduce((sum, order) => sum + (order.total_amount ?? 0), 0) ?? 0;
      const totalOrders = orders?.length ?? 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      return {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        orders: orders ?? [],
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
      const [{ data: period1, error: e1 }, { data: period2, error: e2 }] =
        await Promise.all([
          ctx.supabase
            .from("orders")
            .select("*")
            .gte("created_at", input.period1Start)
            .lte("created_at", input.period1End),
          ctx.supabase
            .from("orders")
            .select("*")
            .gte("created_at", input.period2Start)
            .lte("created_at", input.period2End),
        ]);

      if (e1 || e2) throw new Error("Failed to fetch comparison data");

      const getStats = (orders: any[] | null | undefined) => ({
        revenue:
          orders?.reduce((sum, order) => sum + (order.total_amount ?? 0), 0) ?? 0,
        orders: orders?.length ?? 0,
      });

      const stats1 = getStats(period1);
      const stats2 = getStats(period2);

      return {
        period1: stats1,
        period2: stats2,
        growth: {
          revenue:
            stats1.revenue > 0
              ? ((stats2.revenue - stats1.revenue) / stats1.revenue) * 100
              : 0,
          orders:
            stats1.orders > 0
              ? ((stats2.orders - stats1.orders) / stats1.orders) * 100
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
      const { data: orders, error: ordersError } = await ctx.supabase
        .from("orders")
        .select("id, total_amount, created_at")
        .gte("created_at", input.startDate)
        .lte("created_at", input.endDate);

      if (ordersError) throw new Error(ordersError.message);

      const { data: items, error: itemsError } = await ctx.supabase
        .from("order_items")
        .select("quantity, menu_items(name, name_kurdish, price)")
        .gte("created_at", input.startDate)
        .lte("created_at", input.endDate);

      if (itemsError) throw new Error(itemsError.message);

      const revenue =
        orders?.reduce((sum, order) => sum + (order.total_amount ?? 0), 0) ?? 0;
      const dailyTotals = (orders ?? []).reduce(
        (acc: Record<string, number>, order) => {
          const day = order.created_at.split("T")[0];
          acc[day] = (acc[day] ?? 0) + (order.total_amount ?? 0);
          return acc;
        },
        {}
      );

      const topItemsMap: Record<string, { name: string; nameKurdish: string; quantity: number; revenue: number }> = {};
      (items ?? []).forEach((item) => {
        const key = item.menu_items?.name ?? item.menu_items?.name_kurdish ?? "unknown";
        if (!topItemsMap[key]) {
          topItemsMap[key] = {
            name: item.menu_items?.name ?? "Unknown",
            nameKurdish: item.menu_items?.name_kurdish ?? "",
            quantity: 0,
            revenue: 0,
          };
        }
        topItemsMap[key].quantity += item.quantity;
        topItemsMap[key].revenue +=
          (item.menu_items?.price ?? 0) * item.quantity;
      });

      const topItems = Object.values(topItemsMap)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);

      return {
        revenue,
        orders: orders?.length ?? 0,
        averageOrderValue: orders && orders.length > 0 ? revenue / orders.length : 0,
        topItems,
        dailyTotals,
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
      const { data, error } = await ctx.supabase
        .from("orders")
        .select("waiter_name, total_amount")
        .gte("created_at", input.startDate)
        .lte("created_at", input.endDate)
        .not("waiter_name", "is", null);

      if (error) throw new Error(error.message);

      const stats = (data ?? []).reduce(
        (
          acc: Record<string, { orders: number; revenue: number }>,
          order
        ) => {
          const name = order.waiter_name as string;
          if (!acc[name]) {
            acc[name] = { orders: 0, revenue: 0 };
          }
          acc[name].orders += 1;
          acc[name].revenue += order.total_amount ?? 0;
          return acc;
        },
        {}
      );

      return Object.entries(stats).map(([name, stat]) => ({
        name,
        orders: stat.orders,
        revenue: stat.revenue,
        averageOrderValue:
          stat.orders > 0 ? stat.revenue / stat.orders : 0,
      }));
    }),
});

export const appRouter = createTRPCRouter({
  menu: menuRouter,
  tables: tablesRouter,
  orders: ordersRouter,
  serviceRequests: serviceRequestsRouter,
  employees: employeesRouter,
  inventory: inventoryRouter,
  ratings: ratingsRouter,
  reports: reportsRouter,
  customerHistory: customerHistoryRouter,
});

export type AppRouter = typeof appRouter;
