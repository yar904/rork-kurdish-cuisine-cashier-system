import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import createContextHook from '@nkzw/create-context-hook';
import { Order, OrderItem, OrderStatus, MenuItem } from '@/types/restaurant';
import { MENU_ITEMS } from '@/constants/menu';
import { useTables } from '@/contexts/TableContext';
import { trpcClient } from '@/lib/trpc';

const generateDemoOrders = (): Order[] => {
  const now = new Date();
  return [
    {
      id: 'ORD-001',
      tableNumber: 3,
      items: [
        { menuItem: MENU_ITEMS[6], quantity: 2, notes: undefined },
        { menuItem: MENU_ITEMS[10], quantity: 1, notes: undefined },
        { menuItem: MENU_ITEMS[22], quantity: 2, notes: undefined },
      ],
      status: 'new',
      createdAt: new Date(now.getTime() - 2 * 60000),
      updatedAt: new Date(now.getTime() - 2 * 60000),
      waiterName: 'Sarah',
      total: 2 * 25000 + 34000 + 2 * 4000,
    },
    {
      id: 'ORD-002',
      tableNumber: 5,
      items: [
        { menuItem: MENU_ITEMS[7], quantity: 1, notes: undefined },
        { menuItem: MENU_ITEMS[11], quantity: 1, notes: undefined },
        { menuItem: MENU_ITEMS[23], quantity: 1, notes: undefined },
      ],
      status: 'preparing',
      createdAt: new Date(now.getTime() - 8 * 60000),
      updatedAt: new Date(now.getTime() - 5 * 60000),
      waiterName: 'Ahmed',
      total: 23000 + 22000 + 5000,
    },
    {
      id: 'ORD-003',
      tableNumber: 2,
      items: [
        { menuItem: MENU_ITEMS[0], quantity: 1, notes: undefined },
        { menuItem: MENU_ITEMS[4], quantity: 2, notes: undefined },
        { menuItem: MENU_ITEMS[8], quantity: 2, notes: undefined },
        { menuItem: MENU_ITEMS[19], quantity: 2, notes: undefined },
      ],
      status: 'ready',
      createdAt: new Date(now.getTime() - 15 * 60000),
      updatedAt: new Date(now.getTime() - 3 * 60000),
      waiterName: 'Sarah',
      total: 13000 + 2 * 9000 + 2 * 22000 + 2 * 9000,
    },
  ];
};

export const [RestaurantProvider, useRestaurant] = createContextHook(() => {
  const { assignOrderToTable, clearTable } = useTables();
  const [orders, setOrders] = useState<Order[]>(generateDemoOrders());
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<number>(1);
  const [readyNotification, setReadyNotification] = useState<string | null>(null);
  const previousOrderStatuses = useRef<Record<string, OrderStatus>>({});




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
  }, [orders, playSound]);

  const addItemToCurrentOrder = useCallback((itemId: string, quantity: number = 1, notes?: string) => {
    const menuItem = MENU_ITEMS.find(item => item.id === itemId);
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
  }, []);

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
  }, [currentOrder, selectedTable, calculateTotal, assignOrderToTable]);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        if (status === 'paid') {
          clearTable(order.tableNumber);
        }
        return { ...order, status, updatedAt: new Date() };
      }
      return order;
    }));
    console.log(`Order ${orderId} status updated to ${status}`);
  }, [clearTable]);

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
  }), [orders, currentOrder, selectedTable, readyNotification, addItemToCurrentOrder, removeItemFromCurrentOrder, updateItemQuantity, submitOrder, updateOrderStatus, clearCurrentOrder, calculateTotal, getAIRecommendations, optimizeKitchenQueue]);
});
