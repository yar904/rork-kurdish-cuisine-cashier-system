import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
export type RealtimePayload = {
  eventType?: string;
  new?: Record<string, any>;
  old?: Record<string, any>;
};

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
    setIsConnected(true);
  }, []);

  const subscribeToOrders = (callback: (payload: RealtimePayload) => void) => {
    console.log('[Realtime] Subscribing to orders updates via polling stub');
    callback({ eventType: 'INIT' });
    return () => undefined;
  };


  const subscribeToMenuItems = (callback: (payload: RealtimePayload) => void) => {
    console.log('[Realtime] Subscribing to menu_items updates via polling stub');
    callback({ eventType: 'INIT' });
    return () => undefined;
  };

  const subscribeToOrderTracking = (callback: (payload: RealtimePayload) => void) => {
    console.log('[Realtime] Subscribing to order_tracking updates via polling stub');
    callback({ eventType: 'INIT' });
    return () => undefined;
  };

  const subscribeToNotifications = (callback: (payload: RealtimePayload) => void) => {
    console.log('[Realtime] Subscribing to notifications updates via polling stub');
    callback({ eventType: 'INIT' });
    return () => undefined;
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
