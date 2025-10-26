import { publicProcedure } from "@/backend/trpc/create-context";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

export default publicProcedure
  .input(
    z.object({
      tableNumber: z.number(),
      items: z.array(
        z.object({
          menuItemId: z.string(),
          quantity: z.number(),
          notes: z.string().optional(),
        })
      ),
      waiterName: z.string().optional(),
      total: z.number(),
    })
  )
  .mutation(async ({ input }) => {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        table_number: input.tableNumber,
        status: 'new',
        waiter_name: input.waiterName,
        total: input.total,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Error creating order:', orderError);
      throw new Error('Failed to create order');
    }

    const orderItems = input.items.map(item => ({
      order_id: order.id,
      menu_item_id: item.menuItemId,
      quantity: item.quantity,
      notes: item.notes,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      throw new Error('Failed to create order items');
    }

    for (const item of input.items) {
      const { data: ingredients } = await supabase
        .from('menu_item_ingredients')
        .select('inventory_item_id, quantity_needed')
        .eq('menu_item_id', item.menuItemId);

      if (ingredients && ingredients.length > 0) {
        for (const ingredient of ingredients) {
          const quantityToDeduct = ingredient.quantity_needed * item.quantity;

          const { data: inventoryItem } = await supabase
            .from('inventory_items')
            .select('current_stock')
            .eq('id', ingredient.inventory_item_id)
            .single();

          if (inventoryItem) {
            const newStock = inventoryItem.current_stock - quantityToDeduct;

            await supabase
              .from('inventory_items')
              .update({ current_stock: newStock })
              .eq('id', ingredient.inventory_item_id);

            await supabase.from('stock_movements').insert({
              inventory_item_id: ingredient.inventory_item_id,
              movement_type: 'order',
              quantity: -quantityToDeduct,
              reference_id: order.id,
              notes: `Order #${order.id} - Table ${input.tableNumber}`,
            });
          }
        }
      }
    }

    const { error: tableError } = await supabase
      .from('tables')
      .update({
        status: 'occupied',
        current_order_id: order.id,
        updated_at: new Date().toISOString(),
      })
      .eq('number', input.tableNumber);

    if (tableError) {
      console.error('Error updating table:', tableError);
    }

    return { orderId: order.id, success: true };
  });
