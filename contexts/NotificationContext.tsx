import { useState, useCallback, useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';

interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
}

export const [NotificationProvider, useNotifications] = createContextHook(() => {
  const [permission, setPermission] = useState<NotificationPermission>({
    granted: false,
    denied: false,
    prompt: true,
  });
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    if ('Notification' in window) {
      const current = Notification.permission;
      setPermission({
        granted: current === 'granted',
        denied: current === 'denied',
        prompt: current === 'default',
      });
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (Platform.OS !== 'web') {
      console.log('Push notifications are web-only in this implementation');
      return false;
    }

    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      const granted = result === 'granted';
      
      setPermission({
        granted,
        denied: result === 'denied',
        prompt: result === 'default',
      });

      if (granted && 'serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
          setSubscription(existingSubscription);
          console.log('Using existing push subscription');
          return true;
        }

        console.log('Push notification permission granted');
      }

      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

  const showNotification = useCallback(async (
    title: string,
    options?: {
      body?: string;
      icon?: string;
      tag?: string;
      requireInteraction?: boolean;
      url?: string;
    }
  ) => {
    if (Platform.OS !== 'web') {
      console.log('Web notifications not supported on native platforms');
      return;
    }

    if (!permission.granted) {
      console.warn('Notification permission not granted');
      return;
    }

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body: options?.body || '',
        icon: options?.icon || '/assets/images/icon.png',
        badge: '/assets/images/icon.png',
        tag: options?.tag || 'default',
        requireInteraction: options?.requireInteraction || false,
        data: { url: options?.url },
      });
    }
  }, [permission.granted]);

  const notifyNewOrder = useCallback(async (orderId: string, tableNumber: number) => {
    await showNotification('New Order! 🍽️', {
      body: `New order received for Table ${tableNumber}`,
      tag: `order-${orderId}`,
      requireInteraction: true,
      url: '/kitchen',
    });
  }, [showNotification]);

  const notifyOrderReady = useCallback(async (orderId: string, tableNumber: number) => {
    await showNotification('Order Ready! ✅', {
      body: `Order for Table ${tableNumber} is ready to serve`,
      tag: `order-ready-${orderId}`,
      requireInteraction: true,
      url: '/waiter',
    });
  }, [showNotification]);

  const notifyServiceRequest = useCallback(async (
    tableNumber: number,
    requestType: string
  ) => {
    await showNotification('Service Request 🔔', {
      body: `Table ${tableNumber} needs ${requestType}`,
      tag: `service-${tableNumber}`,
      requireInteraction: true,
      url: '/waiter',
    });
  }, [showNotification]);

  return useMemo(() => ({
    permission,
    subscription,
    requestPermission,
    showNotification,
    notifyNewOrder,
    notifyOrderReady,
    notifyServiceRequest,
  }), [permission, subscription, requestPermission, showNotification, notifyNewOrder, notifyOrderReady, notifyServiceRequest]);
});
