import { useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';

interface OfflineQueue {
  id: string;
  type: 'order' | 'status' | 'service-request';
  data: any;
  timestamp: number;
}

export const [OfflineProvider, useOffline] = createContextHook(() => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueue[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setIsOnline(navigator.onLine);

      const handleOnline = () => {
        console.log('[Offline] Connection restored');
        setIsOnline(true);
      };

      const handleOffline = () => {
        console.log('[Offline] Connection lost');
        setIsOnline(false);
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  useEffect(() => {
    loadOfflineQueue();
  }, []);



  const loadOfflineQueue = async () => {
    try {
      const stored = await AsyncStorage.getItem('offline-queue');
      if (stored) {
        const queue = JSON.parse(stored);
        setOfflineQueue(queue);
        console.log('[Offline] Loaded offline queue:', queue.length, 'items');
      }
    } catch (error) {
      console.error('[Offline] Error loading offline queue:', error);
    }
  };

  const saveOfflineQueue = async (queue: OfflineQueue[]) => {
    try {
      await AsyncStorage.setItem('offline-queue', JSON.stringify(queue));
      console.log('[Offline] Saved offline queue:', queue.length, 'items');
    } catch (error) {
      console.error('[Offline] Error saving offline queue:', error);
    }
  };

  const addToOfflineQueue = useCallback(async (
    type: OfflineQueue['type'],
    data: any
  ) => {
    const item: OfflineQueue = {
      id: `offline-${Date.now()}-${Math.random()}`,
      type,
      data,
      timestamp: Date.now(),
    };

    const updatedQueue = [...offlineQueue, item];
    setOfflineQueue(updatedQueue);
    await saveOfflineQueue(updatedQueue);
    
    console.log('[Offline] Added to queue:', item);
    
    return item.id;
  }, [offlineQueue]);

  const removeFromOfflineQueue = useCallback(async (id: string) => {
    const updatedQueue = offlineQueue.filter(item => item.id !== id);
    setOfflineQueue(updatedQueue);
    await saveOfflineQueue(updatedQueue);
    
    console.log('[Offline] Removed from queue:', id);
  }, [offlineQueue]);

  const syncOfflineQueue = useCallback(async () => {
    if (isSyncing || offlineQueue.length === 0) return;

    console.log('[Offline] Starting sync of', offlineQueue.length, 'items');
    setIsSyncing(true);

    try {
      for (const item of offlineQueue) {
        try {
          console.log('[Offline] Syncing item:', item.id, item.type);
          
          await removeFromOfflineQueue(item.id);
          console.log('[Offline] Successfully synced:', item.id);
        } catch (error) {
          console.error('[Offline] Error syncing item:', item.id, error);
        }
      }
      
      console.log('[Offline] Sync complete');
    } finally {
      setIsSyncing(false);
    }
  }, [offlineQueue, isSyncing, removeFromOfflineQueue]);

  useEffect(() => {
    if (isOnline && offlineQueue.length > 0 && !isSyncing) {
      syncOfflineQueue();
    }
  }, [isOnline, offlineQueue.length, isSyncing, syncOfflineQueue]);

  const clearOfflineQueue = useCallback(async () => {
    setOfflineQueue([]);
    await AsyncStorage.removeItem('offline-queue');
    console.log('[Offline] Cleared offline queue');
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('[SW] Service Worker registered:', registration);
          
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('[SW] New service worker found');
            
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[SW] New service worker installed, update available');
                }
              });
            }
          });
        })
        .catch(error => {
          console.error('[SW] Service Worker registration failed:', error);
        });
    }
  }, []);

  return useMemo(() => ({
    isOnline,
    offlineQueue,
    isSyncing,
    addToOfflineQueue,
    removeFromOfflineQueue,
    syncOfflineQueue,
    clearOfflineQueue,
  }), [
    isOnline,
    offlineQueue,
    isSyncing,
    addToOfflineQueue,
    removeFromOfflineQueue,
    syncOfflineQueue,
    clearOfflineQueue,
  ]);
});
