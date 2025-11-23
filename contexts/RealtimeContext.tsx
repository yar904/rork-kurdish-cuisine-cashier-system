import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

type RealtimeContextType = {
  isConnected: boolean;
  subscribeToOrders: (callback: (payload: any) => void) => () => void;
  subscribeToMenuItems: (callback: (payload: any) => void) => () => void;
};

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    const checkConnection = async () => {
      const { data, error } = await supabase.from('menu_items').select('count');
      setIsConnected(!error);
    };
    checkConnection();
  }, []);

  const subscribeToOrders = (callback: (payload: any) => void) => {
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

  const subscribeToMenuItems = (callback: (payload: any) => void) => {
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

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        subscribeToOrders,
        subscribeToMenuItems,
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
