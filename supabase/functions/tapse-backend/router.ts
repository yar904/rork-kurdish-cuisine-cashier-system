import { createTRPCRouter, publicProcedure } from "../_shared/trpc-router.ts";
import { z } from "npm:zod@3.22.4";

const exampleRouter = createTRPCRouter({
  hi: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(({ input }) => {
      return {
        hello: input.name,
        date: new Date(),
      };
    }),
});

const menuRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    console.log("[tRPC] menu.getAll called");
    const { data, error } = await ctx.supabase
      .from('menu_items')
      .select('*')
      .order('category', { ascending: true });

    if (error) {
      console.error('[tRPC] Error fetching menu items:', error);
      throw new Error('Failed to fetch menu items');
    }

    return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      nameKurdish: item.name_kurdish,
      nameArabic: item.name_arabic,
      category: item.category,
      price: item.price,
      description: item.description,
      descriptionKurdish: item.description_kurdish,
      descriptionArabic: item.description_arabic,
      image: item.image,
      available: item.available,
    }));
  }),

  create: publicProcedure
    .input(z.object({
      name: z.string(),
      nameKurdish: z.string().optional(),
      nameArabic: z.string().optional(),
      category: z.string(),
      price: z.number(),
      description: z.string().optional(),
      descriptionKurdish: z.string().optional(),
      descriptionArabic: z.string().optional(),
      image: z.string().optional(),
      available: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log("[tRPC] menu.create called");
      const { data, error } = await ctx.supabase
        .from('menu_items')
        .insert({
          name: input.name,
          name_kurdish: input.nameKurdish,
          name_arabic: input.nameArabic,
          category: input.category,
          price: input.price,
          description: input.description,
          description_kurdish: input.descriptionKurdish,
          description_arabic: input.descriptionArabic,
          image: input.image,
          available: input.available,
        })
        .select()
        .single();

      if (error) {
        console.error('[tRPC] Error creating menu item:', error);
        throw new Error('Failed to create menu item');
      }

      return data;
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      nameKurdish: z.string().optional(),
      nameArabic: z.string().optional(),
      category: z.string().optional(),
      price: z.number().optional(),
      description: z.string().optional(),
      descriptionKurdish: z.string().optional(),
      descriptionArabic: z.string().optional(),
      image: z.string().optional(),
      available: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log("[tRPC] menu.update called");
      const { id, ...updates } = input;
      
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.nameKurdish !== undefined) updateData.name_kurdish = updates.nameKurdish;
      if (updates.nameArabic !== undefined) updateData.name_arabic = updates.nameArabic;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.descriptionKurdish !== undefined) updateData.description_kurdish = updates.descriptionKurdish;
      if (updates.descriptionArabic !== undefined) updateData.description_arabic = updates.descriptionArabic;
      if (updates.image !== undefined) updateData.image = updates.image;
      if (updates.available !== undefined) updateData.available = updates.available;

      const { data, error } = await ctx.supabase
        .from('menu_items')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[tRPC] Error updating menu item:', error);
        throw new Error('Failed to update menu item');
      }

      return data;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      console.log("[tRPC] menu.delete called");
      const { error } = await ctx.supabase
        .from('menu_items')
        .delete()
        .eq('id', input.id);

      if (error) {
        console.error('[tRPC] Error deleting menu item:', error);
        throw new Error('Failed to delete menu item');
      }

      return { success: true };
    }),

  linkIngredients: publicProcedure
    .input(z.object({
      menuItemId: z.string(),
      ingredients: z.array(z.object({
        inventoryItemId: z.string(),
        quantityRequired: z.number(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log("[tRPC] menu.linkIngredients called");
      
      await ctx.supabase
        .from('menu_item_ingredients')
        .delete()
        .eq('menu_item_id', input.menuItemId);

      if (input.ingredients.length > 0) {
        const { error } = await ctx.supabase
          .from('menu_item_ingredients')
          .insert(
            input.ingredients.map(ing => ({
              menu_item_id: input.menuItemId,
              inventory_item_id: ing.inventoryItemId,
              quantity_required: ing.quantityRequired,
            }))
          );

        if (error) {
          console.error('[tRPC] Error linking ingredients:', error);
          throw new Error('Failed to link ingredients');
        }
      }

      return { success: true };
    }),

  getIngredients: publicProcedure
    .input(z.object({ menuItemId: z.string() }))
    .query(async ({ ctx, input }) => {
      console.log("[tRPC] menu.getIngredients called");
      const { data, error } = await ctx.supabase
        .from('menu_item_ingredients')
        .select(`
          *,
          inventory_item:inventory_items(*)
        `)
        .eq('menu_item_id', input.menuItemId);

      if (error) {
        console.error('[tRPC] Error fetching ingredients:', error);
        throw new Error('Failed to fetch ingredients');
      }

      return data;
    }),
});

const tablesRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    console.log("[tRPC] tables.getAll called");
    const { data, error } = await ctx.supabase
      .from('tables')
      .select('*')
      .order('table_number', { ascending: true });

    if (error) {
      console.error('[tRPC] Error fetching tables:', error);
      throw new Error('Failed to fetch tables');
    }

    return data;
  }),

  updateStatus: publicProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['available', 'occupied', 'reserved']),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log("[tRPC] tables.updateStatus called");
      const { data, error } = await ctx.supabase
        .from('tables')
        .update({ status: input.status })
        .eq('id', input.id)
        .select()
        .single();

      if (error) {
        console.error('[tRPC] Error updating table status:', error);
        throw new Error('Failed to update table status');
      }

      return data;
    }),
});

const ordersRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({
      tableId: z.string(),
      items: z.array(z.object({
        menuItemId: z.string(),
        quantity: z.number(),
        notes: z.string().optional(),
      })),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log("[tRPC] orders.create called");
      
      const { data: order, error: orderError } = await ctx.supabase
        .from('orders')
        .insert({
          table_id: input.tableId,
          status: 'pending',
          notes: input.notes,
          total: 0,
        })
        .select()
        .single();

      if (orderError || !order) {
        console.error('[tRPC] Error creating order:', orderError);
        throw new Error('Failed to create order');
      }

      let total = 0;
      
      for (const item of input.items) {
        const { data: menuItem } = await ctx.supabase
          .from('menu_items')
          .select('price')
          .eq('id', item.menuItemId)
          .single();

        if (menuItem) {
          total += menuItem.price * item.quantity;
          
          await ctx.supabase
            .from('order_items')
            .insert({
              order_id: order.id,
              menu_item_id: item.menuItemId,
              quantity: item.quantity,
              price: menuItem.price,
              notes: item.notes,
            });
        }
      }

      await ctx.supabase
        .from('orders')
        .update({ total })
        .eq('id', order.id);

      return { ...order, total };
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    console.log("[tRPC] orders.getAll called");
    const { data, error } = await ctx.supabase
      .from('orders')
      .select(`
        *,
        table:tables(*),
        items:order_items(
          *,
          menu_item:menu_items(*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[tRPC] Error fetching orders:', error);
      throw new Error('Failed to fetch orders');
    }

    return data;
  }),

  updateStatus: publicProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['pending', 'preparing', 'ready', 'served', 'paid']),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log("[tRPC] orders.updateStatus called");
      const { data, error } = await ctx.supabase
        .from('orders')
        .update({ status: input.status })
        .eq('id', input.id)
        .select()
        .single();

      if (error) {
        console.error('[tRPC] Error updating order status:', error);
        throw new Error('Failed to update order status');
      }

      return data;
    }),
});

const serviceRequestsRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({
      tableId: z.string(),
      requestType: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log("[tRPC] serviceRequests.create called");
      const { data, error } = await ctx.supabase
        .from('service_requests')
        .insert({
          table_id: input.tableId,
          request_type: input.requestType,
          notes: input.notes,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('[tRPC] Error creating service request:', error);
        throw new Error('Failed to create service request');
      }

      return data;
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    console.log("[tRPC] serviceRequests.getAll called");
    const { data, error } = await ctx.supabase
      .from('service_requests')
      .select(`
        *,
        table:tables(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[tRPC] Error fetching service requests:', error);
      throw new Error('Failed to fetch service requests');
    }

    return data;
  }),

  updateStatus: publicProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['pending', 'in_progress', 'completed']),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log("[tRPC] serviceRequests.updateStatus called");
      const { data, error } = await ctx.supabase
        .from('service_requests')
        .update({ status: input.status })
        .eq('id', input.id)
        .select()
        .single();

      if (error) {
        console.error('[tRPC] Error updating service request:', error);
        throw new Error('Failed to update service request');
      }

      return data;
    }),
});

const ratingsRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({
      menuItemId: z.string(),
      tableId: z.string(),
      rating: z.number().min(1).max(5),
      comment: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log("[tRPC] ratings.create called");
      const { data, error } = await ctx.supabase
        .from('ratings')
        .insert({
          menu_item_id: input.menuItemId,
          table_id: input.tableId,
          rating: input.rating,
          comment: input.comment,
        })
        .select()
        .single();

      if (error) {
        console.error('[tRPC] Error creating rating:', error);
        throw new Error('Failed to create rating');
      }

      return data;
    }),

  getByMenuItem: publicProcedure
    .input(z.object({ menuItemId: z.string() }))
    .query(async ({ ctx, input }) => {
      console.log("[tRPC] ratings.getByMenuItem called");
      const { data, error } = await ctx.supabase
        .from('ratings')
        .select('*')
        .eq('menu_item_id', input.menuItemId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[tRPC] Error fetching ratings:', error);
        throw new Error('Failed to fetch ratings');
      }

      return data;
    }),

  getAllStats: publicProcedure.query(async ({ ctx }) => {
    console.log("[tRPC] ratings.getAllStats called");
    const { data, error } = await ctx.supabase
      .from('ratings')
      .select(`
        *,
        menu_item:menu_items(name)
      `);

    if (error) {
      console.error('[tRPC] Error fetching rating stats:', error);
      throw new Error('Failed to fetch rating stats');
    }

    return data;
  }),
});

const customerHistoryRouter = createTRPCRouter({
  save: publicProcedure
    .input(z.object({
      tableId: z.string(),
      orderId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log("[tRPC] customerHistory.save called");
      const { data, error } = await ctx.supabase
        .from('customer_order_history')
        .insert({
          table_id: input.tableId,
          order_id: input.orderId,
        })
        .select()
        .single();

      if (error) {
        console.error('[tRPC] Error saving customer history:', error);
        throw new Error('Failed to save customer history');
      }

      return data;
    }),

  getByTable: publicProcedure
    .input(z.object({ tableId: z.string() }))
    .query(async ({ ctx, input }) => {
      console.log("[tRPC] customerHistory.getByTable called");
      const { data, error } = await ctx.supabase
        .from('customer_order_history')
        .select(`
          *,
          order:orders(
            *,
            items:order_items(
              *,
              menu_item:menu_items(*)
            )
          )
        `)
        .eq('table_id', input.tableId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[tRPC] Error fetching customer history:', error);
        throw new Error('Failed to fetch customer history');
      }

      return data;
    }),
});

const employeesRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    console.log("[tRPC] employees.getAll called");
    const { data, error } = await ctx.supabase
      .from('employees')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('[tRPC] Error fetching employees:', error);
      throw new Error('Failed to fetch employees');
    }

    return data;
  }),

  create: publicProcedure
    .input(z.object({
      name: z.string(),
      role: z.enum(['waiter', 'chef', 'cashier', 'manager']),
      pin: z.string(),
      phone: z.string().optional(),
      email: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log("[tRPC] employees.create called");
      const { data, error } = await ctx.supabase
        .from('employees')
        .insert(input)
        .select()
        .single();

      if (error) {
        console.error('[tRPC] Error creating employee:', error);
        throw new Error('Failed to create employee');
      }

      return data;
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      role: z.enum(['waiter', 'chef', 'cashier', 'manager']).optional(),
      pin: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      active: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log("[tRPC] employees.update called");
      const { id, ...updates } = input;
      const { data, error } = await ctx.supabase
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[tRPC] Error updating employee:', error);
        throw new Error('Failed to update employee');
      }

      return data;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      console.log("[tRPC] employees.delete called");
      const { error } = await ctx.supabase
        .from('employees')
        .delete()
        .eq('id', input.id);

      if (error) {
        console.error('[tRPC] Error deleting employee:', error);
        throw new Error('Failed to delete employee');
      }

      return { success: true };
    }),

  clockIn: publicProcedure
    .input(z.object({
      employeeId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log("[tRPC] employees.clockIn called");
      const { data, error } = await ctx.supabase
        .from('clock_records')
        .insert({
          employee_id: input.employeeId,
          clock_in: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('[tRPC] Error clocking in:', error);
        throw new Error('Failed to clock in');
      }

      return data;
    }),

  clockOut: publicProcedure
    .input(z.object({
      recordId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log("[tRPC] employees.clockOut called");
      const { data, error } = await ctx.supabase
        .from('clock_records')
        .update({ clock_out: new Date().toISOString() })
        .eq('id', input.recordId)
        .select()
        .single();

      if (error) {
        console.error('[tRPC] Error clocking out:', error);
        throw new Error('Failed to clock out');
      }

      return data;
    }),

  getClockRecords: publicProcedure
    .input(z.object({
      employeeId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      console.log("[tRPC] employees.getClockRecords called");
      let query = ctx.supabase
        .from('clock_records')
        .select(`
          *,
          employee:employees(*)
        `)
        .order('clock_in', { ascending: false });

      if (input.employeeId) {
        query = query.eq('employee_id', input.employeeId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[tRPC] Error fetching clock records:', error);
        throw new Error('Failed to fetch clock records');
      }

      return data;
    }),

  getShifts: publicProcedure.query(async ({ ctx }) => {
    console.log("[tRPC] employees.getShifts called");
    const { data, error } = await ctx.supabase
      .from('shifts')
      .select(`
        *,
        employee:employees(*)
      `)
      .order('start_time', { ascending: false });

    if (error) {
      console.error('[tRPC] Error fetching shifts:', error);
      throw new Error('Failed to fetch shifts');
    }

    return data;
  }),

  createShift: publicProcedure
    .input(z.object({
      employeeId: z.string(),
      startTime: z.string(),
      endTime: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log("[tRPC] employees.createShift called");
      const { data, error } = await ctx.supabase
        .from('shifts')
        .insert({
          employee_id: input.employeeId,
          start_time: input.startTime,
          end_time: input.endTime,
        })
        .select()
        .single();

      if (error) {
        console.error('[tRPC] Error creating shift:', error);
        throw new Error('Failed to create shift');
      }

      return data;
    }),

  getMetrics: publicProcedure
    .input(z.object({
      employeeId: z.string(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      console.log("[tRPC] employees.getMetrics called");
      
      return {
        totalHours: 0,
        ordersServed: 0,
        averageOrderValue: 0,
        customerRating: 0,
      };
    }),
});

const inventoryRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    console.log("[tRPC] inventory.getAll called");
    const { data, error } = await ctx.supabase
      .from('inventory_items')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('[tRPC] Error fetching inventory:', error);
      throw new Error('Failed to fetch inventory');
    }

    return data;
  }),

  getLowStock: publicProcedure.query(async ({ ctx }) => {
    console.log("[tRPC] inventory.getLowStock called");
    const { data, error } = await ctx.supabase
      .from('inventory_items')
      .select('*')
      .lte('current_quantity', 'reorder_level')
      .order('name', { ascending: true });

    if (error) {
      console.error('[tRPC] Error fetching low stock:', error);
      throw new Error('Failed to fetch low stock items');
    }

    return data;
  }),

  create: publicProcedure
    .input(z.object({
      name: z.string(),
      unit: z.string(),
      currentQuantity: z.number(),
      reorderLevel: z.number(),
      supplierId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log("[tRPC] inventory.create called");
      const { data, error } = await ctx.supabase
        .from('inventory_items')
        .insert({
          name: input.name,
          unit: input.unit,
          current_quantity: input.currentQuantity,
          reorder_level: input.reorderLevel,
          supplier_id: input.supplierId,
        })
        .select()
        .single();

      if (error) {
        console.error('[tRPC] Error creating inventory item:', error);
        throw new Error('Failed to create inventory item');
      }

      return data;
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      unit: z.string().optional(),
      currentQuantity: z.number().optional(),
      reorderLevel: z.number().optional(),
      supplierId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log("[tRPC] inventory.update called");
      const { id, ...updates } = input;
      
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.unit !== undefined) updateData.unit = updates.unit;
      if (updates.currentQuantity !== undefined) updateData.current_quantity = updates.currentQuantity;
      if (updates.reorderLevel !== undefined) updateData.reorder_level = updates.reorderLevel;
      if (updates.supplierId !== undefined) updateData.supplier_id = updates.supplierId;

      const { data, error } = await ctx.supabase
        .from('inventory_items')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[tRPC] Error updating inventory item:', error);
        throw new Error('Failed to update inventory item');
      }

      return data;
    }),

  adjustStock: publicProcedure
    .input(z.object({
      itemId: z.string(),
      quantity: z.number(),
      type: z.enum(['add', 'remove', 'set']),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log("[tRPC] inventory.adjustStock called");
      
      const { data: item } = await ctx.supabase
        .from('inventory_items')
        .select('current_quantity')
        .eq('id', input.itemId)
        .single();

      if (!item) {
        throw new Error('Item not found');
      }

      let newQuantity = item.current_quantity;
      if (input.type === 'add') {
        newQuantity += input.quantity;
      } else if (input.type === 'remove') {
        newQuantity -= input.quantity;
      } else {
        newQuantity = input.quantity;
      }

      const { data, error } = await ctx.supabase
        .from('inventory_items')
        .update({ current_quantity: newQuantity })
        .eq('id', input.itemId)
        .select()
        .single();

      if (error) {
        console.error('[tRPC] Error adjusting stock:', error);
        throw new Error('Failed to adjust stock');
      }

      await ctx.supabase
        .from('stock_movements')
        .insert({
          inventory_item_id: input.itemId,
          quantity: input.quantity,
          type: input.type,
          reason: input.reason,
        });

      return data;
    }),

  getMovements: publicProcedure
    .input(z.object({
      itemId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      console.log("[tRPC] inventory.getMovements called");
      let query = ctx.supabase
        .from('stock_movements')
        .select(`
          *,
          inventory_item:inventory_items(*)
        `)
        .order('created_at', { ascending: false });

      if (input.itemId) {
        query = query.eq('inventory_item_id', input.itemId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[tRPC] Error fetching stock movements:', error);
        throw new Error('Failed to fetch stock movements');
      }

      return data;
    }),
});

const suppliersRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    console.log("[tRPC] suppliers.getAll called");
    const { data, error } = await ctx.supabase
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('[tRPC] Error fetching suppliers:', error);
      throw new Error('Failed to fetch suppliers');
    }

    return data;
  }),

  create: publicProcedure
    .input(z.object({
      name: z.string(),
      contact: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log("[tRPC] suppliers.create called");
      const { data, error } = await ctx.supabase
        .from('suppliers')
        .insert(input)
        .select()
        .single();

      if (error) {
        console.error('[tRPC] Error creating supplier:', error);
        throw new Error('Failed to create supplier');
      }

      return data;
    }),
});

const reportsRouter = createTRPCRouter({
  summary: publicProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      console.log("[tRPC] reports.summary called");
      
      const { data: orders } = await ctx.supabase
        .from('orders')
        .select('*')
        .gte('created_at', input.startDate)
        .lte('created_at', input.endDate);

      const totalRevenue = orders?.reduce((sum: number, order: any) => sum + (order.total || 0), 0) || 0;
      const totalOrders = orders?.length || 0;

      return {
        totalRevenue,
        totalOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      };
    }),

  comparison: publicProcedure
    .input(z.object({
      period1Start: z.string(),
      period1End: z.string(),
      period2Start: z.string(),
      period2End: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      console.log("[tRPC] reports.comparison called");
      
      return {
        period1: {
          revenue: 0,
          orders: 0,
        },
        period2: {
          revenue: 0,
          orders: 0,
        },
      };
    }),

  financial: publicProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      console.log("[tRPC] reports.financial called");
      return {
        revenue: 0,
        expenses: 0,
        profit: 0,
      };
    }),

  employeePerformance: publicProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      console.log("[tRPC] reports.employeePerformance called");
      return [];
    }),
});

export const appRouter = createTRPCRouter({
  example: exampleRouter,
  menu: menuRouter,
  tables: tablesRouter,
  orders: ordersRouter,
  serviceRequests: serviceRequestsRouter,
  customerHistory: customerHistoryRouter,
  ratings: ratingsRouter,
  employees: employeesRouter,
  inventory: inventoryRouter,
  suppliers: suppliersRouter,
  reports: reportsRouter,
});

export type AppRouter = typeof appRouter;
