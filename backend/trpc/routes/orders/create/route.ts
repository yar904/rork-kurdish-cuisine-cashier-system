import { publicProcedure } from "../../../create-context";
import { supabase } from "../../../lib/supabase";
import { z } from "zod";

export default publicProcedure
  .input(z.object({
    tableNumber: z.number(),
    items: z.array(z.object({
      menuItemId: z.string(),
      quantity: z.number(),
      notes: z.string().optional(),
    })),
    waiterName: z.string().optional(),
    total: z.number(),
  }))
  .mutation(async ({ input }) => {
    console.log('[Orders Create] 🚀 ORDER CREATION ROUTE HIT');
    console.log('[Orders Create] 📥 Full input received:', JSON.stringify(input, null, 2));
    console.log('[Orders Create] Creating order for table:', input.tableNumber);
    
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
      console.error('[Orders Create] Error creating order:', orderError);
      throw new Error("Failed to create order");
    }

    console.log('[Orders Create] Order created, ID:', order.id);

    const itemInserts = input.items.map(item => ({
      order_id: order.id,
      menu_item_id: item.menuItemId,
      quantity: item.quantity,
      notes: item.notes || null,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itemInserts);

    if (itemsError) {
      console.error('[Orders Create] Error creating order items:', itemsError);
      throw new Error("Failed to create order items");
    }

    console.log('[Orders Create] Order items created successfully');

    await supabase
      .from('tables')
      .update({
        status: 'occupied',
        current_order_id: order.id,
        updated_at: new Date().toISOString(),
      })
      .eq('number', input.tableNumber);

    return { orderId: order.id, success: true };
  });