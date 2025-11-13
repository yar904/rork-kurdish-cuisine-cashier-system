import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import createContextHook from '@nkzw/create-context-hook';
import { Order, OrderItem, OrderStatus, MenuItem } from '@/types/restaurant';

import { useTables } from '@/contexts/TableContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { trpc, trpcClient } from '@/lib/trpc';

const generateDemoOrders = (): Order[] => {
  return [];
};

export const [RestaurantProvider, useRestaurant] = createContextHook(() => {
  const [orders, setOrders] = useState<Order[]>(generateDemoOrders());
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<number>(1);
  const [readyNotification, setReadyNotification] = useState<string | null>(null);
  const previousOrderStatuses = useRef<Record<string, OrderStatus>>({});
  
  const menuQuery = trpc.menu.getAll.useQuery();
  const ordersQuery = trpc.orders.getAll.useQuery(undefined, {
    refetchInterval: 3000,
  });
  const updateOrderStatusMutation = trpc.orders.updateStatus.useMutation();
  
  const { assignOrderToTable, clearTable } = useTables();
  const { notifyNewOrder, notifyOrderReady } = useNotifications();
  
  const menuData = useMemo(() => menuQuery.data || [], [menuQuery.data]);
  
  useEffect(() => {
    const data = ordersQuery.data;
    if (data && data.length > 0) {
      const mappedOrders = data.map(o => {
          const items: OrderItem[] = o.items.map(item => {
            const menuItem = menuData.find(m => m.id === item.menu_item_id);
            if (!menuItem) {
              return null;
            }
            return {
              menuItem,
              quantity: item.quantity,
              notes: item.notes || undefined,
            };
          }).filter((item): item is OrderItem => item !== null);
          
          return {
            id: o.id,
            tableNumber: o.table_number,
            items,
            status: o.status as OrderStatus,
            createdAt: new Date(o.created_at),
            updatedAt: new Date(o.updated_at),
            waiterName: o.waiter_name || undefined,
            total: o.total,
          };
      });
      setOrders(mappedOrders);
    }
  }, [ordersQuery.data, menuData]);




  const playSound = useCallback(async (soundType: 'new' | 'ready' | 'paid') => {
    if (Platform.OS === 'web') {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        switch (soundType) {
          case 'new':
            oscillator.frequency.value = 800;
            gainNode.gain.value = 0.3;
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
            break;
          case 'ready':
            oscillator.frequency.value = 1000;
            gainNode.gain.value = 0.4;
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);
            setTimeout(() => {
              const osc2 = audioContext.createOscillator();
              const gain2 = audioContext.createGain();
              osc2.connect(gain2);
              gain2.connect(audioContext.destination);
              osc2.frequency.value = 1200;
              gain2.gain.value = 0.4;
              osc2.start(audioContext.currentTime);
              osc2.stop(audioContext.currentTime + 0.15);
            }, 150);
            break;
          case 'paid':
            oscillator.frequency.value = 600;
            gainNode.gain.value = 0.3;
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);
            break;
        }
      } catch (error) {
        console.log('Error playing web sound:', error);
      }
      return;
    }

    console.log(`Playing ${soundType} sound on mobile is not implemented in this version`);
    console.log('You can play sounds using useAudioPlayer hook at the component level');
  }, []);

  useEffect(() => {
    orders.forEach(order => {
      const prevStatus = previousOrderStatuses.current[order.id];
      
      if (!prevStatus) {
        if (order.status === 'new') {
          playSound('new');
        }
      } else if (prevStatus !== order.status) {
        if (order.status === 'ready') {
          setReadyNotification(order.id);
          playSound('ready');
          notifyOrderReady(order.id, order.tableNumber);
          console.log(`Order ${order.id} is now READY for Table ${order.tableNumber}!`);
          
          setTimeout(() => {
            setReadyNotification(null);
          }, 10000);
        } else if (order.status === 'paid') {
          playSound('paid');
        }
      }
      
      previousOrderStatuses.current[order.id] = order.status;
    });
  }, [orders, playSound, notifyOrderReady]);

  const addItemToCurrentOrder = useCallback((itemId: string, quantity: number = 1, notes?: string) => {
    const menuItem = menuData.find(item => item.id === itemId);
    if (!menuItem) return;

    setCurrentOrder(prev => {
      const existingIndex = prev.findIndex(
        item => item.menuItem.id === itemId && item.notes === notes
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      }

      return [...prev, { menuItem, quantity, notes }];
    });
  }, [menuData]);

  const removeItemFromCurrentOrder = useCallback((index: number) => {
    setCurrentOrder(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateItemQuantity = useCallback((index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromCurrentOrder(index);
      return;
    }

    setCurrentOrder(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity };
      return updated;
    });
  }, [removeItemFromCurrentOrder]);

  const calculateTotal = useCallback((items: OrderItem[]) => {
    return items.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
  }, []);

  const submitOrder = useCallback(async (waiterName?: string) => {
    if (currentOrder.length === 0) return;

    const total = calculateTotal(currentOrder);
    
    try {
      const result = await trpcClient.orders.create.mutate({
        tableNumber: selectedTable,
        items: currentOrder.map(item => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
          notes: item.notes,
        })),
        waiterName,
        total,
      });
      
      console.log('Order submitted successfully:', result);
      
      const newOrder: Order = {
        id: result.orderId,
        tableNumber: selectedTable,
        items: currentOrder,
        status: 'new',
        createdAt: new Date(),
        updatedAt: new Date(),
        waiterName,
        total,
      };
      
      setOrders(prev => [newOrder, ...prev]);
      assignOrderToTable(selectedTable, newOrder.id);
      
      await notifyNewOrder(result.orderId, selectedTable);
      
      try {
        await trpcClient.customerHistory.save.mutate({
          tableNumber: selectedTable,
          orderId: result.orderId,
          orderData: {
            id: result.orderId,
            tableNumber: selectedTable,
            items: currentOrder.map(item => ({
              name: item.menuItem.name,
              quantity: item.quantity,
              price: item.menuItem.price,
              notes: item.notes,
            })),
            total,
            status: 'new',
            createdAt: new Date().toISOString(),
          },
        });
        console.log('Order history saved for customer');
      } catch (historyError) {
        console.error('Error saving order history:', historyError);
      }
      
      setCurrentOrder([]);
      
      return { orderId: result.orderId, success: true };
    } catch (error) {
      console.error('Error submitting order:', error);
      throw error;
    }
  }, [currentOrder, selectedTable, calculateTotal, assignOrderToTable, notifyNewOrder]);

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        if (status === 'paid') {
          clearTable(order.tableNumber);
        }
        return { ...order, status, updatedAt: new Date() };
      }
      return order;
    }));
    
    try {
      await updateOrderStatusMutation.mutateAsync({
        orderId,
        status,
      });
      console.log(`Order ${orderId} status updated to ${status} in database`);
      await ordersQuery.refetch();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  }, [clearTable, updateOrderStatusMutation, ordersQuery]);

  const clearCurrentOrder = useCallback(() => {
    setCurrentOrder([]);
  }, []);

  const getAIRecommendations = useCallback(async (tableNumber: number): Promise<MenuItem[]> => {
    const itemSales: Record<string, { item: MenuItem; count: number; totalRevenue: number }> = {};
    
    orders.forEach(order => {
      order.items.forEach(orderItem => {
        const itemId = orderItem.menuItem.id;
        if (!itemSales[itemId]) {
          itemSales[itemId] = {
            item: orderItem.menuItem,
            count: 0,
            totalRevenue: 0,
          };
        }
        itemSales[itemId].count += orderItem.quantity;
        itemSales[itemId].totalRevenue += orderItem.menuItem.price * orderItem.quantity;
      });
    });

    const topItems = Object.values(itemSales)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(sale => sale.item)
      .filter(item => item.available);

    return topItems;
  }, [orders]);

  const optimizeKitchenQueue = useCallback((orders: Order[]) => {
    const activeOrders = orders.filter(o => o.status === 'new' || o.status === 'preparing');
    
    return activeOrders.sort((a, b) => {
      if (a.status === 'preparing' && b.status === 'new') return -1;
      if (a.status === 'new' && b.status === 'preparing') return 1;
      
      const aItemCount = a.items.reduce((sum, item) => sum + item.quantity, 0);
      const bItemCount = b.items.reduce((sum, item) => sum + item.quantity, 0);
      
      if (aItemCount !== bItemCount) {
        return aItemCount - bItemCount;
      }
      
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, []);

  return useMemo(() => ({
    orders,
    currentOrder,
    selectedTable,
    readyNotification,
    setSelectedTable,
    addItemToCurrentOrder,
    removeItemFromCurrentOrder,
    updateItemQuantity,
    submitOrder,
    updateOrderStatus,
    clearCurrentOrder,
    calculateTotal,
    getAIRecommendations,
    optimizeKitchenQueue,
    isLoading: ordersQuery.isLoading,
    isError: ordersQuery.isError,
    refetch: ordersQuery.refetch,
  }), [orders, currentOrder, selectedTable, readyNotification, addItemToCurrentOrder, removeItemFromCurrentOrder, updateItemQuantity, submitOrder, updateOrderStatus, clearCurrentOrder, calculateTotal, getAIRecommendations, optimizeKitchenQueue, ordersQuery.isLoading, ordersQuery.isError, ordersQuery.refetch]);
});
