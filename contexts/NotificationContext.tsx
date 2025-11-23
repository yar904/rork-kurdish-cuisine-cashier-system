import { useState, useCallback, useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';

import { trpcClient } from '@/lib/trpc';
import { useRealtime } from '@/contexts/RealtimeContext';

interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
}

type NotificationType = 'assist' | 'bill' | 'notify' | string;

type NotificationRecord = {
  id: number;
  tableNumber: number;
  type: NotificationType;
  createdAt: string;
};

const asNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const resolveTimestamp = (value: unknown): string => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }
  return new Date().toISOString();
};

const mapNotificationRecord = (input: any): NotificationRecord => ({
  id: asNumber(input?.id),
  tableNumber: asNumber(input?.table_number ?? input?.tableNumber),
  type: (input?.type as NotificationType) ?? 'notify',
  createdAt: resolveTimestamp(input?.created_at ?? input?.createdAt),
});

const sortByNewest = (items: NotificationRecord[]) =>
  [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

const getResponseData = <T,>(payload: T | { data?: T } | null | undefined, fallback: T): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const value = (payload as { data?: T }).data;
    return value ?? fallback;
  }
  return (payload ?? fallback) as T;
};

export const [NotificationProvider, useNotifications] = createContextHook(() => {
  const [permission, setPermission] = useState<NotificationPermission>({
    granted: false,
    denied: false,
    prompt: true,
  });
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState<boolean>(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);

  const { subscribeToNotifications } = useRealtime();

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

  const showNotification = useCallback(
    async (
      title: string,
      options?: {
        body?: string;
        icon?: string;
        tag?: string;
        requireInteraction?: boolean;
        url?: string;
      },
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
    },
    [permission.granted],
  );

  const notifyNewOrder = useCallback(
    async (orderId: string, tableNumber: number) => {
      await showNotification('داواکاریی نوێ! / New Order! 🍽️', {
        body: `داواکاریی نوێ بۆ میزی / New order received for Table ${tableNumber}`,
        tag: `order-${orderId}`,
        requireInteraction: true,
        url: '/kitchen',
      });
    },
    [showNotification],
  );

  const notifyOrderReady = useCallback(
    async (orderId: string, tableNumber: number) => {
      await showNotification('داواکاری ئامادەیە! / Order Ready! ✅', {
        body: `داواکاری بۆ میزی ${tableNumber} ئامادەیە / Order for Table ${tableNumber} is ready to serve`,
        tag: `order-ready-${orderId}`,
        requireInteraction: true,
        url: '/waiter',
      });
    },
    [showNotification],
  );

  const notifyServiceRequest = useCallback(
    async (tableNumber: number, requestType: string) => {
      const requestTypeText =
        requestType === 'waiter'
          ? 'پێشخزمەتکار / waiter'
          : requestType === 'bill'
            ? 'حیساب / bill'
            : requestType;
      await showNotification('داواکاری خزمەتگوزاری / Service Request 🔔', {
        body: `میزی ${tableNumber} پێویستی / Table ${tableNumber} needs ${requestTypeText}`,
        tag: `service-${tableNumber}`,
        requireInteraction: true,
        url: '/waiter',
      });
    },
    [showNotification],
  );

  const mergeNotification = useCallback((record: NotificationRecord) => {
    if (!record.id) {
      return;
    }
    setNotifications((prev) => {
      const filtered = prev.filter((item) => item.id !== record.id);
      return sortByNewest([record, ...filtered]);
    });
  }, []);

  const removeNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const list = useCallback(async () => {
    setIsNotificationsLoading(true);
    setNotificationsError(null);
    try {
      const response = await trpcClient.notifications.list.query();
      const rows = getResponseData<any[]>(response, []);
      const mapped = rows.map(mapNotificationRecord);
      const sorted = sortByNewest(mapped);
      setNotifications(sorted);
      return sorted;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[Notifications] List failed', message);
      setNotificationsError(message);
      throw error instanceof Error ? error : new Error(message);
    } finally {
      setIsNotificationsLoading(false);
    }
  }, []);

  const publish = useCallback(
    async (tableNumber: number, type: NotificationType = 'notify') => {
      try {
        const response = await trpcClient.notifications.publish.mutate({ tableNumber, type });
        const saved = mapNotificationRecord(getResponseData(response, {} as NotificationRecord));
        mergeNotification(saved);
        return saved;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('[Notifications] Publish failed', message);
        throw error instanceof Error ? error : new Error(message);
      }
    },
    [mergeNotification],
  );

  const clear = useCallback(
    async (id: number) => {
      try {
        await trpcClient.notifications.clear.mutate({ id });
        removeNotification(id);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('[Notifications] Clear failed', message);
        throw error instanceof Error ? error : new Error(message);
      }
    },
    [removeNotification],
  );

  const clearAll = useCallback(async () => {
    try {
      await trpcClient.notifications.clearAll.mutate();
      setNotifications([]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[Notifications] Clear all failed', message);
      throw error instanceof Error ? error : new Error(message);
    }
  }, []);

  useEffect(() => {
    list();
  }, [list]);

  useEffect(() => {
    const unsubscribe = subscribeToNotifications((payload) => {
      if (payload.eventType === 'INSERT') {
        mergeNotification(mapNotificationRecord(payload.new));
        return;
      }

      if (payload.eventType === 'DELETE') {
        const deletedId = asNumber(payload.old?.id);
        if (deletedId) {
          removeNotification(deletedId);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [mergeNotification, removeNotification, subscribeToNotifications]);

  return useMemo(
    () => ({
      permission,
      subscription,
      requestPermission,
      showNotification,
      notifyNewOrder,
      notifyOrderReady,
      notifyServiceRequest,
      notifications,
      isNotificationsLoading,
      notificationsError,
      publish,
      list,
      clear,
      clearAll,
    }),
    [
      permission,
      subscription,
      requestPermission,
      showNotification,
      notifyNewOrder,
      notifyOrderReady,
      notifyServiceRequest,
      notifications,
      isNotificationsLoading,
      notificationsError,
      publish,
      list,
      clear,
      clearAll,
    ],
  );
});
