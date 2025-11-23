import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import type { TRPCContext } from "./trpc-context.ts";
import { supabase } from "./supabase.ts";

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

const createTRPCRouter = t.router;
const publicProcedure = t.procedure;

const exampleRouter = createTRPCRouter({
  hi: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(({ input }) => ({
      hello: input.name,
      date: new Date(),
    })),
});

const menuRouter = createTRPCRouter({
  getAll: publicProcedure.query(async () => {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .order("category", { ascending: true });

    if (error) {
      console.error("Error fetching menu items:", error);
      throw new Error("Failed to fetch menu items");
    }

    return (data ?? []).map((item) => ({
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
    .input(
      z.object({
        name: z.string().optional().default(""),
        nameKurdish: z.string().min(1, "Kurdish name is required"),
        nameArabic: z.string().optional().default(""),
        category: z.string().min(1, "Category is required"),
        price: z.number().min(0, "Price must be positive"),
        description: z.string().optional().default(""),
        descriptionKurdish: z.string().min(1, "Kurdish description is required"),
        descriptionArabic: z.string().optional().default(""),
        image: z.string().nullable().optional(),
        available: z.boolean().default(true),
      }),
    )
    .mutation(async ({ input }) => {
      const name = input.name || input.nameKurdish;
      const nameArabic = input.nameArabic || input.nameKurdish;
      const description = input.description || input.descriptionKurdish;
      const descriptionArabic = input.descriptionArabic || input.descriptionKurdish;

      const { data, error } = await supabase
        .from("menu_items")
        .insert({
          name,
          name_kurdish: input.nameKurdish,
          name_arabic: nameArabic,
          category: input.category,
          price: input.price,
          description,
          description_kurdish: input.descriptionKurdish,
          description_arabic: descriptionArabic,
          image: input.image || null,
          available: input.available,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating menu item:", error);
        throw new Error("Failed to create menu item");
      }

      return data;
    }),
  update: publicProcedure
    .input(
      z.object({
        id: z.string().min(1, "ID is required"),
        name: z.string().min(1, "Name is required").optional(),
        nameKurdish: z.string().min(1, "Kurdish name is required").optional(),
        nameArabic: z.string().min(1, "Arabic name is required").optional(),
        category: z.string().min(1, "Category is required").optional(),
        price: z.number().min(0, "Price must be positive").optional(),
        description: z.string().min(1, "Description is required").optional(),
        descriptionKurdish: z.string().min(1, "Kurdish description is required").optional(),
        descriptionArabic: z.string().min(1, "Arabic description is required").optional(),
        image: z.string().nullable().optional(),
        available: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;

      const { data: currentItem, error: fetchError } = await supabase
        .from("menu_items")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError || !currentItem) {
        console.error("Error fetching menu item:", fetchError);
        throw new Error("Failed to fetch menu item");
      }

      const kurdishName = updateData.nameKurdish ?? currentItem.name_kurdish;

      const dbUpdateData: Record<string, unknown> = {};
      if (updateData.name !== undefined) dbUpdateData.name = updateData.name || kurdishName;
      if (updateData.nameKurdish !== undefined) dbUpdateData.name_kurdish = updateData.nameKurdish;
      if (updateData.nameArabic !== undefined)
        dbUpdateData.name_arabic = updateData.nameArabic || kurdishName;
      if (updateData.category !== undefined) dbUpdateData.category = updateData.category;
      if (updateData.price !== undefined) dbUpdateData.price = updateData.price;
      if (updateData.description !== undefined)
        dbUpdateData.description = updateData.description || (updateData.descriptionKurdish ?? currentItem.description_kurdish);
      if (updateData.descriptionKurdish !== undefined)
        dbUpdateData.description_kurdish = updateData.descriptionKurdish;
      if (updateData.descriptionArabic !== undefined)
        dbUpdateData.description_arabic =
          updateData.descriptionArabic || (updateData.descriptionKurdish ?? currentItem.description_kurdish);
      if (updateData.image !== undefined) dbUpdateData.image = updateData.image;
      if (updateData.available !== undefined) dbUpdateData.available = updateData.available;

      dbUpdateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from("menu_items")
        .update(dbUpdateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating menu item:", error);
        throw new Error("Failed to update menu item");
      }

      return data;
    }),
  delete: publicProcedure
    .input(z.object({ id: z.string().min(1, "ID is required") }))
    .mutation(async ({ input }) => {
      const { error } = await supabase.from("menu_items").delete().eq("id", input.id);

      if (error) {
        console.error("Error deleting menu item:", error);
        throw new Error("Failed to delete menu item");
      }

      return { success: true };
    }),
  linkIngredients: publicProcedure
    .input(
      z.object({
        menuItemId: z.string(),
        ingredients: z.array(
          z.object({
            inventoryItemId: z.string(),
            quantityNeeded: z.number(),
          }),
        ),
      }),
    )
    .mutation(async ({ input }) => {
      await supabase.from("menu_item_ingredients").delete().eq("menu_item_id", input.menuItemId);

      if (input.ingredients.length > 0) {
        const { error } = await supabase
          .from("menu_item_ingredients")
          .insert(
            input.ingredients.map((ingredient) => ({
              menu_item_id: input.menuItemId,
              inventory_item_id: ingredient.inventoryItemId,
              quantity_needed: ingredient.quantityNeeded,
            })),
          );

        if (error) {
          console.error("Error linking ingredients:", error);
          throw new Error("Failed to link ingredients");
        }
      }

      return { success: true };
    }),
  getIngredients: publicProcedure
    .input(z.object({ menuItemId: z.string() }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from("menu_item_ingredients")
        .select("*, inventory_items(*)")
        .eq("menu_item_id", input.menuItemId);

      if (error) {
        console.error("Error fetching menu ingredients:", error);
        throw new Error("Failed to fetch menu ingredients");
      }

      return data ?? [];
    }),
});

const tablesRouter = createTRPCRouter({
  getAll: publicProcedure.query(async () => {
    const { data, error } = await supabase
      .from("tables")
      .select("*")
      .order("number", { ascending: true });

    if (error) {
      console.error("Error fetching tables:", error);
      throw new Error("Failed to fetch tables");
    }

    return (data ?? []).map((table) => ({
      number: table.number,
      status: table.status,
      capacity: table.capacity,
      currentOrderId: table.current_order_id,
      reservedFor: table.reserved_for,
      lastCleaned: table.last_cleaned ? new Date(table.last_cleaned) : undefined,
    }));
  }),
  updateStatus: publicProcedure
    .input(
      z.object({
        tableNumber: z.number(),
        status: z.enum(["available", "occupied", "reserved", "needs-cleaning"]),
      }),
    )
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from("tables")
        .update({
          status: input.status,
          last_cleaned: input.status === "available" ? new Date().toISOString() : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("number", input.tableNumber);

      if (error) {
        console.error("Error updating table status:", error);
        throw new Error("Failed to update table status");
      }

      return { success: true };
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
            notes: z.string().optional(),
          }),
        ),
        waiterName: z.string().optional(),
        total: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      console.log("[Orders Create] 🚀 ORDER CREATION ROUTE HIT");
      console.log("[Orders Create] 📥 Full input received:", JSON.stringify(input, null, 2));
      console.log("[Orders Create] Creating order for table:", input.tableNumber);

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          table_number: input.tableNumber,
          status: "new",
          total: input.total,
          waiter_name: input.waiterName || null,
        })
        .select()
        .single();

      if (orderError || !order) {
        console.error("[Orders Create] Error creating order:", orderError);
        throw new Error("Failed to create order");
      }

      console.log("[Orders Create] Order created, ID:", order.id);

      const itemInserts = input.items.map((item) => ({
        order_id: order.id,
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        notes: item.notes || null,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(itemInserts);

      if (itemsError) {
        console.error("[Orders Create] Error creating order items:", itemsError);
        throw new Error("Failed to create order items");
      }

      console.log("[Orders Create] Order items created successfully");

      await supabase
        .from("tables")
        .update({
          status: "occupied",
          current_order_id: order.id,
          updated_at: new Date().toISOString(),
        })
        .eq("number", input.tableNumber);

      return { orderId: order.id, success: true };
    }),
  getAll: publicProcedure.query(async () => {
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_items (
          id,
          menu_item_id,
          quantity,
          notes
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("[Orders GetAll] Error fetching orders:", ordersError);
      throw new Error("Failed to fetch orders");
    }

    const { data: menuItems, error: menuError } = await supabase.from("menu_items").select("*");

    if (menuError) {
      console.error("[Orders GetAll] Error fetching menu items:", menuError);
      throw new Error("Failed to fetch menu items");
    }

    return (orders ?? []).map((order) => ({
      id: order.id,
      tableNumber: order.table_number,
      status: order.status,
      waiterName: order.waiter_name,
      total: order.total,
      splitInfo: order.split_info,
      createdAt: new Date(order.created_at),
      updatedAt: new Date(order.updated_at),
      items: ((order.order_items as unknown[]) ?? []).map((item) => {
        const menuItem = (menuItems ?? []).find((mi) => mi.id === (item as any).menu_item_id);
        return {
          menuItem: menuItem
            ? {
                id: menuItem.id,
                name: menuItem.name,
                nameKurdish: menuItem.name_kurdish || menuItem.name,
                nameArabic: menuItem.name_arabic || menuItem.name,
                category: menuItem.category,
                price: menuItem.price,
                cost: menuItem.cost,
                description: menuItem.description || "",
                descriptionKurdish: menuItem.description || "",
                descriptionArabic: menuItem.description || "",
                image: menuItem.image,
                available: menuItem.available,
              }
            : null,
          quantity: (item as any).quantity,
          notes: (item as any).notes,
        };
      }),
    }));
  }),
  updateStatus: publicProcedure
    .input(
      z.object({
        orderId: z.string(),
        status: z.enum(["new", "preparing", "ready", "served", "paid"]),
      }),
    )
    .mutation(async ({ input }) => {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .update({
          status: input.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.orderId)
        .select()
        .single();

      if (orderError || !order) {
        console.error("Error updating order status:", orderError);
        throw new Error("Failed to update order status");
      }

      if (input.status === "paid") {
        const { error: tableError } = await supabase
          .from("tables")
          .update({
            status: "needs-cleaning",
            current_order_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("number", order.table_number);

        if (tableError) {
          console.error("Error updating table after payment:", tableError);
        }
      }

      return { success: true };
    }),
  addItem: publicProcedure
    .input(
      z.object({
        orderId: z.string(),
        menuItemId: z.string(),
        quantity: z.number().min(1),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from("order_items")
        .insert({
          order_id: input.orderId,
          menu_item_id: input.menuItemId,
          quantity: input.quantity,
          notes: input.notes || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding item to order:", error);
        throw new Error("Failed to add item to order");
      }

      const { data: orderItems } = await supabase
        .from("order_items")
        .select("*, menu_items(price)")
        .eq("order_id", input.orderId);

      let newTotal = 0;
      (orderItems ?? []).forEach((item) => {
        const menuItem = (item as any).menu_items;
        if (menuItem) {
          newTotal += menuItem.price * item.quantity;
        }
      });

      await supabase
        .from("orders")
        .update({ total: newTotal, updated_at: new Date().toISOString() })
        .eq("id", input.orderId);

      return { success: true, item: data };
    }),
  updateItemQty: publicProcedure
    .input(
      z.object({
        orderItemId: z.string(),
        quantity: z.number().min(0),
      }),
    )
    .mutation(async ({ input }) => {
      if (input.quantity === 0) {
        const { error } = await supabase
          .from("order_items")
          .delete()
          .eq("id", input.orderItemId);

        if (error) {
          console.error("Error removing order item:", error);
          throw new Error("Failed to remove item");
        }
      } else {
        const { error } = await supabase
          .from("order_items")
          .update({ quantity: input.quantity })
          .eq("id", input.orderItemId);

        if (error) {
          console.error("Error updating item quantity:", error);
          throw new Error("Failed to update quantity");
        }
      }

      return { success: true };
    }),
  getByTable: publicProcedure
    .input(z.object({ tableNumber: z.number() }))
    .query(async ({ input }) => {
      const { data: orders, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items (
            id,
            menu_item_id,
            quantity,
            notes
          )
        `,
        )
        .eq("table_number", input.tableNumber)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching orders by table:", error);
        throw new Error("Failed to fetch orders");
      }

      const { data: menuItems } = await supabase.from("menu_items").select("*");

      return (orders ?? []).map((order) => ({
        id: order.id,
        tableNumber: order.table_number,
        status: order.status,
        waiterName: order.waiter_name,
        total: order.total,
        splitInfo: order.split_info,
        createdAt: new Date(order.created_at),
        updatedAt: new Date(order.updated_at),
        items: ((order.order_items as unknown[]) ?? []).map((item) => {
          const menuItem = (menuItems ?? []).find((mi) => mi.id === (item as any).menu_item_id);
          return {
            menuItem: menuItem
              ? {
                  id: menuItem.id,
                  name: menuItem.name,
                  nameKurdish: menuItem.name_kurdish || menuItem.name,
                  nameArabic: menuItem.name_arabic || menuItem.name,
                  category: menuItem.category,
                  price: menuItem.price,
                  cost: menuItem.cost,
                  description: menuItem.description || "",
                  descriptionKurdish: menuItem.description || "",
                  descriptionArabic: menuItem.description || "",
                  image: menuItem.image,
                  available: menuItem.available,
                }
              : null,
            quantity: (item as any).quantity,
            notes: (item as any).notes,
          };
        }),
      }));
    }),
  getCustomerStatus: publicProcedure
    .input(z.object({ tableNumber: z.number() }))
    .query(async ({ input }) => {
      const { data: orders, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items (
            id,
            menu_item_id,
            quantity,
            notes
          )
        `,
        )
        .eq("table_number", input.tableNumber)
        .not("status", "eq", "paid")
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching customer order status:", error);
        throw new Error("Failed to fetch order status");
      }

      if (!orders || orders.length === 0) {
        return { status: "no_order" as const };
      }

      const order = orders[0];
      const { data: menuItems } = await supabase.from("menu_items").select("*");

      const items = ((order.order_items as unknown[]) ?? []).map((item) => {
        const menuItem = (menuItems ?? []).find((mi) => mi.id === (item as any).menu_item_id);
        return {
          name: menuItem?.name || "Unknown",
          nameKurdish: menuItem?.name_kurdish || menuItem?.name || "Unknown",
          quantity: (item as any).quantity,
        };
      });

      return {
        orderId: order.id,
        status: order.status as "new" | "preparing" | "ready" | "served" | "paid",
        items,
        subtotal: order.total,
        tax: 0,
        total: order.total,
        createdAt: new Date(order.created_at).toISOString(),
      };
    }),
  getActive: publicProcedure.query(async () => {
    const { data: orders, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_items (
          id,
          menu_item_id,
          quantity,
          notes
        )
      `,
      )
      .in("status", ["new", "preparing", "ready", "served"])
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching active orders:", error);
      throw new Error("Failed to fetch active orders");
    }

    const { data: menuItems } = await supabase.from("menu_items").select("*");

    return (orders ?? []).map((order) => ({
      id: order.id,
      tableNumber: order.table_number,
      status: order.status,
      waiterName: order.waiter_name,
      total: order.total,
      splitInfo: order.split_info,
      createdAt: new Date(order.created_at),
      updatedAt: new Date(order.updated_at),
      items: ((order.order_items as unknown[]) ?? []).map((item) => {
        const menuItem = (menuItems ?? []).find((mi) => mi.id === (item as any).menu_item_id);
        return {
          menuItem: menuItem
            ? {
                id: menuItem.id,
                name: menuItem.name,
                nameKurdish: menuItem.name_kurdish || menuItem.name,
                nameArabic: menuItem.name_arabic || menuItem.name,
                category: menuItem.category,
                price: menuItem.price,
                cost: menuItem.cost,
                description: menuItem.description || "",
                descriptionKurdish: menuItem.description || "",
                descriptionArabic: menuItem.description || "",
                image: menuItem.image,
                available: menuItem.available,
              }
            : null,
          quantity: (item as any).quantity,
          notes: (item as any).notes,
        };
      }),
    }));
  }),
});

export type NotificationRecord = {
  id: number;
  table_number: number;
  type: "help" | "other";
  created_at: string;
};

const notificationsRouter = createTRPCRouter({
  publish: publicProcedure
    .input(
      z.object({
        table_number: z.number(),
        type: z.enum(["help", "other"]),
      }),
    )
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from("notifications")
        .insert({
          table_number: input.table_number,
          type: input.type,
        })
        .select("id, table_number, type, created_at")
        .single();

      if (error) {
        console.error("Error publishing notification:", error);
        throw new Error("Failed to publish notification");
      }

      return data;
    }),
  list: publicProcedure
    .input(z.object({ since: z.string().nullable().optional() }).optional())
    .query(async ({ input }) => {
      let query = supabase
        .from("notifications")
        .select("id, table_number, type, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      if (input?.since) {
        query = query.gt("created_at", input.since);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching notifications:", error);
        throw new Error("Failed to fetch notifications");
      }

      return data ?? [];
    }),
  clearById: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { error } = await supabase.from("notifications").delete().eq("id", input.id);

      if (error) {
        console.error("Error clearing notification:", error);
        throw new Error("Failed to clear notification");
      }

      return { success: true };
    }),
  clearByTable: publicProcedure
    .input(z.object({ table_number: z.number() }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("table_number", input.table_number);

      if (error) {
        console.error("Error clearing notifications for table:", error);
        throw new Error("Failed to clear notifications for table");
      }

      return { success: true };
    }),
  clearAll: publicProcedure.mutation(async () => {
    const { error } = await supabase.from("notifications").delete();

    if (error) {
      console.error("Error clearing notifications:", error);
      throw new Error("Failed to clear notifications");
    }

    return { success: true };
  }),
});

const customerHistoryRouter = createTRPCRouter({
  save: publicProcedure
    .input(
      z.object({
        tableNumber: z.number(),
        orderId: z.string(),
        orderData: z.object({
          id: z.string(),
          tableNumber: z.number(),
          items: z.array(z.any()),
          total: z.number(),
          status: z.string(),
          createdAt: z.string(),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from("customer_order_history")
        .insert({
          table_number: input.tableNumber,
          order_id: input.orderId,
          order_data: input.orderData,
        })
        .select()
        .single();

      if (error) {
        console.error("Error saving order history:", error);
        throw new Error("Failed to save order history");
      }

      return { historyId: data.id, success: true };
    }),
  getByTable: publicProcedure
    .input(z.object({ tableNumber: z.number() }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from("customer_order_history")
        .select("*")
        .eq("table_number", input.tableNumber)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching order history:", error);
        throw new Error("Failed to fetch order history");
      }

      return (data ?? []).map((record) => ({
        id: record.id,
        tableNumber: record.table_number,
        orderId: record.order_id,
        orderData: record.order_data,
        createdAt: new Date(record.created_at),
      }));
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
      }),
    )
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from("menu_item_ratings")
        .insert({
          menu_item_id: input.menuItemId,
          table_number: input.tableNumber,
          rating: input.rating,
          comment: input.comment || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating rating:", error);
        throw new Error("Failed to create rating");
      }

      return { success: true, rating: data };
    }),
  getByMenuItem: publicProcedure
    .input(z.object({ menuItemId: z.string() }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from("menu_item_ratings")
        .select("*")
        .eq("menu_item_id", input.menuItemId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching ratings:", error);
        throw new Error("Failed to fetch ratings");
      }

      const ratings = data ?? [];
      const totalRatings = ratings.length;
      const averageRating =
        totalRatings > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings : 0;

      return {
        ratings,
        totalRatings,
        averageRating: Math.round(averageRating * 10) / 10,
      };
    }),
  getAllStats: publicProcedure.query(async () => {
    const { data, error } = await supabase.from("menu_item_ratings").select("menu_item_id, rating");

    if (error) {
      console.error("Error fetching all ratings:", error);
      throw new Error("Failed to fetch ratings");
    }

    const ratings = data ?? [];
    const statsMap = new Map<string, { total: number; sum: number; count: number }>();

    ratings.forEach((rating) => {
      const existing = statsMap.get(rating.menu_item_id) || { total: 0, sum: 0, count: 0 };
      existing.sum += rating.rating;
      existing.count += 1;
      existing.total = existing.sum / existing.count;
      statsMap.set(rating.menu_item_id, existing);
    });

    const stats: Record<string, { averageRating: number; totalRatings: number }> = {};
    statsMap.forEach((value, key) => {
      stats[key] = {
        averageRating: Math.round(value.total * 10) / 10,
        totalRatings: value.count,
      };
    });

    return stats;
  }),
});

const reportsRouter = createTRPCRouter({
  summary: publicProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const { startDate, endDate } = input;

      const { data: orders, error } = await supabase
        .from("orders")
        .select(
          `
        *,
        order_items (
          id,
          menu_item_id,
          quantity,
          notes
        )
      `,
        )
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching orders for report:", error);
        throw new Error("Failed to fetch report data");
      }

      const { data: menuItems } = await supabase.from("menu_items").select("*");

      const totalRevenue = (orders ?? []).reduce((sum, order) => sum + order.total, 0);
      const totalOrders = orders?.length ?? 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const paidOrders = (orders ?? []).filter((o) => o.status === "paid");
      const paidRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0);

      const itemSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
      const categorySales: Record<string, number> = {};
      const hourlySales: Record<string, number> = {};
      const dailySales: Record<string, { revenue: number; orders: number }> = {};

      (orders ?? []).forEach((order) => {
        const orderDate = new Date(order.created_at);
        const hour = orderDate.getHours();
        const day = orderDate.toISOString().split("T")[0];

        hourlySales[hour] = (hourlySales[hour] || 0) + order.total;

        if (!dailySales[day]) {
          dailySales[day] = { revenue: 0, orders: 0 };
        }
        dailySales[day].revenue += order.total;
        dailySales[day].orders += 1;

        ((order.order_items as unknown[]) ?? []).forEach((item) => {
          const menuItem = (menuItems ?? []).find((mi) => mi.id === (item as any).menu_item_id);
          if (!menuItem) return;

          if (!itemSales[menuItem.id]) {
            itemSales[menuItem.id] = { name: menuItem.name, quantity: 0, revenue: 0 };
          }
          itemSales[menuItem.id].quantity += (item as any).quantity;
          itemSales[menuItem.id].revenue += menuItem.price * (item as any).quantity;

          categorySales[menuItem.category] =
            (categorySales[menuItem.category] || 0) + menuItem.price * (item as any).quantity;
        });
      });

      const topItems = Object.entries(itemSales)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 10)
        .map(([id, data]) => ({ id, ...data }));

      const categoryBreakdown = Object.entries(categorySales)
        .sort((a, b) => b[1] - a[1])
        .map(([category, revenue]) => ({
          category,
          revenue,
          percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
        }));

      const statusBreakdown = {
        new: (orders ?? []).filter((o) => o.status === "new").length,
        preparing: (orders ?? []).filter((o) => o.status === "preparing").length,
        ready: (orders ?? []).filter((o) => o.status === "ready").length,
        served: (orders ?? []).filter((o) => o.status === "served").length,
        paid: paidOrders.length,
      };

      const peakHours = Object.entries(hourlySales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([hour, revenue]) => ({ hour: parseInt(hour, 10), revenue }));

      return {
        period: { startDate, endDate },
        summary: {
          totalRevenue,
          totalOrders,
          averageOrderValue,
          paidRevenue,
          paidOrders: paidOrders.length,
        },
        topItems,
        categoryBreakdown,
        statusBreakdown,
        peakHours,
        dailySales: Object.entries(dailySales)
          .map(([date, data]) => ({ date, ...data }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        hourlySales: Object.entries(hourlySales)
          .map(([hour, revenue]) => ({ hour: parseInt(hour, 10), revenue }))
          .sort((a, b) => a.hour - b.hour),
      };
    }),
  comparison: publicProcedure
    .input(
      z.object({
        currentStartDate: z.string(),
        currentEndDate: z.string(),
        previousStartDate: z.string(),
        previousEndDate: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const fetchPeriodData = async (startDate: string, endDate: string) => {
        const { data: orders, error } = await supabase
          .from("orders")
          .select("*")
          .gte("created_at", startDate)
          .lte("created_at", endDate);

        if (error) {
          throw new Error("Failed to fetch comparison data");
        }

        const totalRevenue = (orders ?? []).reduce((sum, order) => sum + order.total, 0);
        const totalOrders = orders?.length ?? 0;
        const paidOrders = (orders ?? []).filter((o) => o.status === "paid");
        const paidRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0);

        return {
          totalRevenue,
          totalOrders,
          averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
          paidRevenue,
          paidOrders: paidOrders.length,
        };
      };

      const currentData = await fetchPeriodData(input.currentStartDate, input.currentEndDate);
      const previousData = await fetchPeriodData(input.previousStartDate, input.previousEndDate);

      const calculateGrowth = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      return {
        current: currentData,
        previous: previousData,
        growth: {
          revenue: calculateGrowth(currentData.totalRevenue, previousData.totalRevenue),
          orders: calculateGrowth(currentData.totalOrders, previousData.totalOrders),
          averageOrderValue: calculateGrowth(currentData.averageOrderValue, previousData.averageOrderValue),
          paidRevenue: calculateGrowth(currentData.paidRevenue, previousData.paidRevenue),
        },
      };
    }),
  financial: publicProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const { startDate, endDate } = input;

      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select(
          `
        *,
        order_items (
          id,
          menu_item_id,
          quantity,
          notes
        )
      `,
        )
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error("[Financial Report] Error fetching orders:", ordersError);
        throw new Error("Failed to fetch orders for financial report");
      }

      const { data: menuItems, error: menuError } = await supabase.from("menu_items").select("*");

      if (menuError) {
        console.error("[Financial Report] Error fetching menu items:", menuError);
        throw new Error("Failed to fetch menu items");
      }

      const { data: employees, error: employeesError } = await supabase
        .from("employees")
        .select("id, name, role, hourly_rate");

      if (employeesError) {
        console.error("[Financial Report] Error fetching employees:", employeesError);
      }

      const { data: clockRecords, error: clockError } = await supabase
        .from("clock_records")
        .select("*")
        .gte("clock_in", startDate)
        .lte("clock_in", endDate);

      if (clockError) {
        console.error("[Financial Report] Error fetching clock records:", clockError);
      }

      let totalRevenue = 0;
      let totalCost = 0;
      const totalOrders = orders?.length ?? 0;

      const itemProfits: Record<string, { name: string; quantity: number; revenue: number; cost: number; profit: number; margin: number }> = {};
      const categoryProfits: Record<string, { revenue: number; cost: number; profit: number; margin: number }> = {};
      const dailyFinancials: Record<string, { revenue: number; cost: number; profit: number; orders: number }> = {};

      (orders ?? []).forEach((order) => {
        const orderDate = new Date(order.created_at);
        const day = orderDate.toISOString().split("T")[0];
        totalRevenue += order.total;

        if (!dailyFinancials[day]) {
          dailyFinancials[day] = { revenue: 0, cost: 0, profit: 0, orders: 0 };
        }
        dailyFinancials[day].revenue += order.total;
        dailyFinancials[day].orders += 1;

        ((order.order_items as unknown[]) ?? []).forEach((item) => {
          const menuItem = (menuItems ?? []).find((mi) => mi.id === (item as any).menu_item_id);
          if (!menuItem) return;

          const itemRevenue = menuItem.price * (item as any).quantity;
          const itemCost = (menuItem.cost || 0) * (item as any).quantity;
          const itemProfit = itemRevenue - itemCost;

          totalCost += itemCost;
          dailyFinancials[day].cost += itemCost;
          dailyFinancials[day].profit += itemProfit;

          if (!itemProfits[menuItem.id]) {
            itemProfits[menuItem.id] = {
              name: menuItem.name,
              quantity: 0,
              revenue: 0,
              cost: 0,
              profit: 0,
              margin: 0,
            };
          }

          itemProfits[menuItem.id].quantity += (item as any).quantity;
          itemProfits[menuItem.id].revenue += itemRevenue;
          itemProfits[menuItem.id].cost += itemCost;
          itemProfits[menuItem.id].profit += itemProfit;
          itemProfits[menuItem.id].margin =
            itemProfits[menuItem.id].revenue > 0
              ? (itemProfits[menuItem.id].profit / itemProfits[menuItem.id].revenue) * 100
              : 0;

          if (!categoryProfits[menuItem.category]) {
            categoryProfits[menuItem.category] = {
              revenue: 0,
              cost: 0,
              profit: 0,
              margin: 0,
            };
          }

          categoryProfits[menuItem.category].revenue += itemRevenue;
          categoryProfits[menuItem.category].cost += itemCost;
          categoryProfits[menuItem.category].profit += itemProfit;
          categoryProfits[menuItem.category].margin =
            categoryProfits[menuItem.category].revenue > 0
              ? (categoryProfits[menuItem.category].profit / categoryProfits[menuItem.category].revenue) * 100
              : 0;
        });
      });

      const totalProfit = totalRevenue - totalCost;
      const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

      let laborCost = 0;
      if (clockRecords && employees) {
        clockRecords.forEach((record) => {
          if (!record.clock_out) return;
          const employee = employees.find((e) => e.id === record.employee_id);
          if (!employee) return;

          const clockIn = new Date(record.clock_in);
          const clockOut = new Date(record.clock_out);
          const hoursWorked = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
          const breakHours = (record.break_minutes || 0) / 60;
          const paidHours = hoursWorked - breakHours;

          laborCost += paidHours * (employee.hourly_rate || 0);
        });
      }

      const netProfit = totalProfit - laborCost;

      const topProfitableItems = Object.entries(itemProfits)
        .sort((a, b) => b[1].profit - a[1].profit)
        .slice(0, 10)
        .map(([id, data]) => ({ id, ...data }));

      const topMarginItems = Object.entries(itemProfits)
        .filter(([, data]) => data.quantity >= 3)
        .sort((a, b) => b[1].margin - a[1].margin)
        .slice(0, 10)
        .map(([id, data]) => ({ id, ...data }));

      const categoryBreakdown = Object.entries(categoryProfits)
        .sort((a, b) => b[1].profit - a[1].profit)
        .map(([category, data]) => ({ category, ...data }));

      const paidOrders = (orders ?? []).filter((o) => o.status === "paid");
      const paidRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0);

      return {
        period: { startDate, endDate },
        summary: {
          totalRevenue,
          totalCost,
          totalProfit,
          netProfit,
          overallMargin,
          totalOrders,
          averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
          paidRevenue,
          paidOrders: paidOrders.length,
          laborCost,
        },
        topProfitableItems,
        topMarginItems,
        categoryBreakdown,
        dailyFinancials: Object.entries(dailyFinancials)
          .map(([date, data]) => ({
            date,
            ...data,
            margin: data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0,
          }))
          .sort((a, b) => a.date.localeCompare(b.date)),
      };
    }),
  employeePerformance: publicProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const { startDate, endDate } = input;

      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .not("waiter_name", "is", null);

      if (ordersError) {
        console.error("[Employee Performance] Error fetching orders:", ordersError);
        throw new Error("Failed to fetch orders");
      }

      const { data: clockRecords, error: clockError } = await supabase
        .from("clock_records")
        .select("*, employees!inner(name, role, hourly_rate)")
        .gte("clock_in", startDate)
        .lte("clock_in", endDate);

      if (clockError) {
        console.error("[Employee Performance] Error fetching clock records:", clockError);
        throw new Error("Failed to fetch employee data");
      }

      const waiterPerformance: Record<string, {
        name: string;
        totalOrders: number;
        totalRevenue: number;
        averageOrderValue: number;
        paidOrders: number;
      }> = {};

      (orders ?? []).forEach((order) => {
        const waiterName = order.waiter_name;
        if (!waiterName) return;

        if (!waiterPerformance[waiterName]) {
          waiterPerformance[waiterName] = {
            name: waiterName,
            totalOrders: 0,
            totalRevenue: 0,
            averageOrderValue: 0,
            paidOrders: 0,
          };
        }

        waiterPerformance[waiterName].totalOrders += 1;
        waiterPerformance[waiterName].totalRevenue += order.total;

        if (order.status === "paid") {
          waiterPerformance[waiterName].paidOrders += 1;
        }
      });

      Object.values(waiterPerformance).forEach((waiter) => {
        waiter.averageOrderValue = waiter.totalOrders > 0 ? waiter.totalRevenue / waiter.totalOrders : 0;
      });

      const employeeHours: Record<string, {
        name: string;
        role: string;
        totalHours: number;
        totalShifts: number;
        hourlyRate: number;
        totalEarnings: number;
      }> = {};

      (clockRecords ?? []).forEach((record) => {
        if (!record.clock_out) return;
        const employee = (record as any).employees;
        if (!employee) return;
        const employeeId = record.employee_id;

        if (!employeeHours[employeeId]) {
          employeeHours[employeeId] = {
            name: employee.name,
            role: employee.role,
            totalHours: 0,
            totalShifts: 0,
            hourlyRate: employee.hourly_rate || 0,
            totalEarnings: 0,
          };
        }

        const clockIn = new Date(record.clock_in);
        const clockOut = new Date(record.clock_out);
        const hoursWorked = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
        const breakHours = (record.break_minutes || 0) / 60;
        const paidHours = hoursWorked - breakHours;

        employeeHours[employeeId].totalHours += paidHours;
        employeeHours[employeeId].totalShifts += 1;
        employeeHours[employeeId].totalEarnings += paidHours * (employee.hourly_rate || 0);
      });

      const topWaiters = Object.values(waiterPerformance)
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10);

      const employeeStats = Object.entries(employeeHours)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.totalHours - a.totalHours);

      const totalLaborCost = employeeStats.reduce((sum, emp) => sum + emp.totalEarnings, 0);

      return {
        period: { startDate, endDate },
        waiterPerformance: topWaiters,
        employeeHours: employeeStats,
        summary: {
          totalLaborCost,
          totalEmployees: employeeStats.length,
          averageHoursPerEmployee:
            employeeStats.length > 0
              ? employeeStats.reduce((sum, emp) => sum + emp.totalHours, 0) / employeeStats.length
              : 0,
        },
      };
    }),
});

const employeesRouter = createTRPCRouter({
  getAll: publicProcedure.query(async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching employees:", error);
      throw new Error("Failed to fetch employees");
    }

    return data ?? [];
  }),
  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        role: z.string(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        hourlyRate: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from("employees")
        .insert({
          name: input.name,
          role: input.role,
          phone: input.phone || null,
          email: input.email || null,
          hourly_rate: input.hourlyRate,
          status: "active",
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating employee:", error);
        throw new Error("Failed to create employee");
      }

      return data;
    }),
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        role: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        hourlyRate: z.number().optional(),
        status: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const updateData: Record<string, unknown> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.role !== undefined) updateData.role = input.role;
      if (input.phone !== undefined) updateData.phone = input.phone;
      if (input.email !== undefined) updateData.email = input.email;
      if (input.hourlyRate !== undefined) updateData.hourly_rate = input.hourlyRate;
      if (input.status !== undefined) updateData.status = input.status;

      const { data, error } = await supabase
        .from("employees")
        .update(updateData)
        .eq("id", input.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating employee:", error);
        throw new Error("Failed to update employee");
      }

      return data;
    }),
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const { error } = await supabase.from("employees").delete().eq("id", input.id);

      if (error) {
        console.error("Error deleting employee:", error);
        throw new Error("Failed to delete employee");
      }

      return { success: true };
    }),
  clockIn: publicProcedure
    .input(z.object({ employeeId: z.string() }))
    .mutation(async ({ input }) => {
      const { data: existingRecord } = await supabase
        .from("clock_records")
        .select("*")
        .eq("employee_id", input.employeeId)
        .is("clock_out", null)
        .single();

      if (existingRecord) {
        throw new Error("Employee is already clocked in");
      }

      const { data, error } = await supabase
        .from("clock_records")
        .insert({
          employee_id: input.employeeId,
          clock_in: new Date().toISOString(),
          break_minutes: 0,
        })
        .select()
        .single();

      if (error) {
        console.error("Error clocking in:", error);
        throw new Error("Failed to clock in");
      }

      return data;
    }),
  clockOut: publicProcedure
    .input(
      z.object({
        employeeId: z.string(),
        breakMinutes: z.number().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { data: existingRecord } = await supabase
        .from("clock_records")
        .select("*")
        .eq("employee_id", input.employeeId)
        .is("clock_out", null)
        .order("clock_in", { ascending: false })
        .limit(1)
        .single();

      if (!existingRecord) {
        throw new Error("No active clock-in record found");
      }

      const { data, error } = await supabase
        .from("clock_records")
        .update({
          clock_out: new Date().toISOString(),
          break_minutes: input.breakMinutes || 0,
        })
        .eq("id", existingRecord.id)
        .select()
        .single();

      if (error) {
        console.error("Error clocking out:", error);
        throw new Error("Failed to clock out");
      }

      return data;
    }),
  getClockRecords: publicProcedure
    .input(
      z.object({
        employeeId: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      let query = supabase
        .from("clock_records")
        .select("*, employees(name, role)")
        .order("clock_in", { ascending: false });

      if (input.employeeId) {
        query = query.eq("employee_id", input.employeeId);
      }

      if (input.startDate) {
        query = query.gte("clock_in", input.startDate);
      }

      if (input.endDate) {
        query = query.lte("clock_in", input.endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching clock records:", error);
        throw new Error("Failed to fetch clock records");
      }

      return data ?? [];
    }),
  getShifts: publicProcedure
    .input(
      z.object({
        employeeId: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      let query = supabase
        .from("shifts")
        .select("*, employees(name, role)")
        .order("shift_date", { ascending: true });

      if (input.employeeId) {
        query = query.eq("employee_id", input.employeeId);
      }

      if (input.startDate) {
        query = query.gte("shift_date", input.startDate);
      }

      if (input.endDate) {
        query = query.lte("shift_date", input.endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching shifts:", error);
        throw new Error("Failed to fetch shifts");
      }

      return data ?? [];
    }),
  createShift: publicProcedure
    .input(
      z.object({
        employeeId: z.string(),
        shiftDate: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from("shifts")
        .insert({
          employee_id: input.employeeId,
          shift_date: input.shiftDate,
          start_time: input.startTime,
          end_time: input.endTime,
          notes: input.notes || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating shift:", error);
        throw new Error("Failed to create shift");
      }

      return data;
    }),
  getMetrics: publicProcedure
    .input(
      z.object({
        employeeId: z.string(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      let query = supabase
        .from("clock_records")
        .select("*")
        .eq("employee_id", input.employeeId)
        .not("clock_out", "is", null);

      if (input.startDate) {
        query = query.gte("clock_in", input.startDate);
      }

      if (input.endDate) {
        query = query.lte("clock_in", input.endDate);
      }

      const { data: clockRecords, error } = await query;

      if (error) {
        console.error("Error fetching clock records for metrics:", error);
        throw new Error("Failed to fetch employee metrics");
      }

      const totalHours = (clockRecords ?? []).reduce((acc, record) => {
        const clockIn = new Date(record.clock_in).getTime();
        const clockOut = new Date(record.clock_out as string).getTime();
        const hoursWorked = (clockOut - clockIn) / (1000 * 60 * 60);
        const breakHours = (record.break_minutes || 0) / 60;
        return acc + hoursWorked - breakHours;
      }, 0);

      const { data: employee } = await supabase
        .from("employees")
        .select("hourly_rate")
        .eq("id", input.employeeId)
        .single();

      const totalEarnings = totalHours * (employee?.hourly_rate || 0);

      return {
        totalHours: Math.round(totalHours * 100) / 100,
        totalDays: clockRecords?.length ?? 0,
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        averageHoursPerDay:
          (clockRecords?.length ?? 0) > 0 ? Math.round((totalHours / (clockRecords?.length ?? 1)) * 100) / 100 : 0,
      };
    }),
});

const inventoryRouter = createTRPCRouter({
  getAll: publicProcedure.query(async () => {
    const { data, error } = await supabase
      .from("inventory_items")
      .select("*, suppliers(name)")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching inventory:", error);
      throw new Error("Failed to fetch inventory");
    }

    return data ?? [];
  }),
  getLowStock: publicProcedure.query(async () => {
    const { data: allItems, error } = await supabase.from("inventory_items").select("*, suppliers(name)");

    if (error) {
      console.error("Error fetching inventory items:", error);
      throw new Error("Failed to fetch inventory items");
    }

    return (allItems ?? [])
      .filter((item) => item.current_stock < item.minimum_stock)
      .sort((a, b) => a.current_stock - b.current_stock);
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
      }),
    )
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from("inventory_items")
        .insert({
          name: input.name,
          category: input.category,
          unit: input.unit,
          current_stock: input.currentStock,
          minimum_stock: input.minimumStock,
          cost_per_unit: input.costPerUnit,
          supplier_id: input.supplierId || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating inventory item:", error);
        throw new Error("Failed to create inventory item");
      }

      await supabase.from("stock_movements").insert({
        inventory_item_id: data.id,
        movement_type: "initial",
        quantity: input.currentStock,
        notes: "Initial stock",
      });

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
        supplierId: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      const updateData: Record<string, unknown> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.unit !== undefined) updateData.unit = input.unit;
      if (input.currentStock !== undefined) updateData.current_stock = input.currentStock;
      if (input.minimumStock !== undefined) updateData.minimum_stock = input.minimumStock;
      if (input.costPerUnit !== undefined) updateData.cost_per_unit = input.costPerUnit;
      if (input.supplierId !== undefined) updateData.supplier_id = input.supplierId;

      const { data, error } = await supabase
        .from("inventory_items")
        .update(updateData)
        .eq("id", input.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating inventory item:", error);
        throw new Error("Failed to update inventory item");
      }

      return data;
    }),
  adjustStock: publicProcedure
    .input(
      z.object({
        inventoryItemId: z.string(),
        quantity: z.number(),
        movementType: z.enum(["purchase", "waste", "adjustment", "order"]),
        notes: z.string().optional(),
        referenceId: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { data: item } = await supabase
        .from("inventory_items")
        .select("current_stock")
        .eq("id", input.inventoryItemId)
        .single();

      if (!item) {
        throw new Error("Inventory item not found");
      }

      const newStock = item.current_stock + input.quantity;

      if (newStock < 0) {
        throw new Error("Insufficient stock");
      }

      const { error: updateError } = await supabase
        .from("inventory_items")
        .update({ current_stock: newStock })
        .eq("id", input.inventoryItemId);

      if (updateError) {
        console.error("Error updating stock:", updateError);
        throw new Error("Failed to update stock");
      }

      const { data: movement, error: movementError } = await supabase
        .from("stock_movements")
        .insert({
          inventory_item_id: input.inventoryItemId,
          movement_type: input.movementType,
          quantity: input.quantity,
          reference_id: input.referenceId || null,
          notes: input.notes || null,
        })
        .select()
        .single();

      if (movementError) {
        console.error("Error creating stock movement:", movementError);
        throw new Error("Failed to create stock movement");
      }

      return movement;
    }),
  getMovements: publicProcedure
    .input(
      z.object({
        inventoryItemId: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      let query = supabase
        .from("stock_movements")
        .select("*, inventory_items(name, unit)")
        .order("created_at", { ascending: false });

      if (input.inventoryItemId) {
        query = query.eq("inventory_item_id", input.inventoryItemId);
      }

      if (input.startDate) {
        query = query.gte("created_at", input.startDate);
      }

      if (input.endDate) {
        query = query.lte("created_at", input.endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching stock movements:", error);
        throw new Error("Failed to fetch stock movements");
      }

      return data ?? [];
    }),
});

const suppliersRouter = createTRPCRouter({
  getAll: publicProcedure.query(async () => {
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching suppliers:", error);
      throw new Error("Failed to fetch suppliers");
    }

    return data ?? [];
  }),
  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        contactPerson: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        address: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from("suppliers")
        .insert({
          name: input.name,
          contact_person: input.contactPerson || null,
          phone: input.phone || null,
          email: input.email || null,
          address: input.address || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating supplier:", error);
        throw new Error("Failed to create supplier");
      }

      return data;
    }),
});

export const appRouter = createTRPCRouter({
  example: exampleRouter,
  menu: menuRouter,
  tables: tablesRouter,
  orders: ordersRouter,
  notifications: notificationsRouter,
  customerHistory: customerHistoryRouter,
  ratings: ratingsRouter,
  reports: reportsRouter,
  employees: employeesRouter,
  inventory: inventoryRouter,
  suppliers: suppliersRouter,
});

export type AppRouter = typeof appRouter;
