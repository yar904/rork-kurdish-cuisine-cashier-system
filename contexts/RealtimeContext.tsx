import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type RealtimePayload = RealtimePostgresChangesPayload<Record<string, any>>;

type RealtimeContextType = {
  isConnected: boolean;
  subscribeToOrders: (callback: (payload: RealtimePayload) => void) => () => void;
  subscribeToMenuItems: (callback: (payload: RealtimePayload) => void) => () => void;
  subscribeToOrderTracking: (callback: (payload: RealtimePayload) => void) => () => void;
  subscribeToNotifications: (callback: (payload: RealtimePayload) => void) => () => void;
};

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    const checkConnection = async () => {
      const { error } = await supabase.from('menu_items').select('count');
      setIsConnected(!error);
    };
    checkConnection();
  }, []);

  const subscribeToOrders = (callback: (payload: RealtimePayload) => void) => {
    console.log('[Realtime] Subscribing to orders table');
    
    const channel: RealtimeChannel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('[Realtime] Orders change:', payload);
          callback(payload);
        }
      )
      .subscribe();

    return () => {
      console.log('[Realtime] Unsubscribing from orders');
      channel.unsubscribe();
    };
  };


  const subscribeToMenuItems = (callback: (payload: RealtimePayload) => void) => {
    console.log('[Realtime] Subscribing to menu_items table');
    
    const channel: RealtimeChannel = supabase
      .channel('menu-items-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'menu_items',
        },
        (payload) => {
          console.log('[Realtime] Menu item change:', payload);
          callback(payload);
        }
      )
      .subscribe();

    return () => {
      console.log('[Realtime] Unsubscribing from menu items');
      channel.unsubscribe();
    };
  };

  const subscribeToOrderTracking = (callback: (payload: RealtimePayload) => void) => {
    console.log('[Realtime] Subscribing to order_tracking table');

    const channel: RealtimeChannel = supabase
      .channel('order-tracking-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_tracking',
        },
        (payload) => {
          console.log('[Realtime] Order tracking change:', payload);
          callback(payload);
        }
      )
      .subscribe();

    return () => {
      console.log('[Realtime] Unsubscribing from order tracking');
      channel.unsubscribe();
    };
  };

  const subscribeToNotifications = (callback: (payload: RealtimePayload) => void) => {
    console.log('[Realtime] Subscribing to notifications table');

    const channel: RealtimeChannel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          console.log('[Realtime] Notification INSERT:', payload);
          callback(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          console.log('[Realtime] Notification DELETE:', payload);
          callback(payload);
        }
      )
      .subscribe();

    return () => {
      console.log('[Realtime] Unsubscribing from notifications');
      channel.unsubscribe();
    };
  };

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        subscribeToOrders,
        subscribeToMenuItems,
        subscribeToOrderTracking,
        subscribeToNotifications,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
}
