import { useCallback, useEffect, useMemo, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { trpc } from "@/lib/trpc";
import { useRealtime } from "@/contexts/RealtimeContext";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Notification } from "@/types/restaurant";

export type NotificationType = "assist" | "notify";

export type TableNotification = Notification;

type PublishInput = {
  tableNumber: number;
  type: NotificationType;
};

type NotificationContextValue = {
  notifications: TableNotification[];
  isLoading: boolean;
  isRefetching: boolean;
  error: unknown;
  publish: (input: PublishInput) => Promise<TableNotification | null>;
  list: () => Promise<TableNotification[]>;
  clear: (id: number) => Promise<void>;
  clearByTable: (tableNumber: number) => Promise<void>;
  clearAll: () => Promise<void>;
};

type NotificationRow = {
  id: number;
  table_number: number;
  type: NotificationType;
  created_at: string;
};

const mapNotificationRow = (record: NotificationRow): TableNotification => ({
  id: record.id,
  tableNumber: record.table_number,
  type: record.type,
  createdAt: record.created_at,
});

export const [NotificationProvider, useNotificationsContext] =
  createContextHook<NotificationContextValue>(() => {
    const { subscribeToNotifications } = useRealtime();
    const utils = trpc.useUtils();

    const [notifications, setNotifications] = useState<TableNotification[]>([]);

    const notificationsQuery = trpc.notifications.list.useQuery(undefined);

    useEffect(() => {
      if (notificationsQuery.data) {
        setNotifications(notificationsQuery.data);
      }
    }, [notificationsQuery.data]);

    const publishMutation = trpc.notifications.publish.useMutation();
    const clearMutation = trpc.notifications.clear.useMutation();
    const clearTableMutation = trpc.notifications.clearByTable.useMutation();
    const clearAllMutation = trpc.notifications.clearAll.useMutation();

    useEffect(() => {
      return subscribeToNotifications((payload: RealtimePostgresChangesPayload<NotificationRow>) => {
        if (payload.eventType === "INSERT") {
          const record = payload.new as NotificationRow;
          setNotifications((prev) => {
            const mapped = mapNotificationRow(record);
            const next = [mapped, ...prev.filter((item) => item.id !== mapped.id)];
            return next.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
          });
          return;
        }

        if (payload.eventType === "DELETE") {
          const record = payload.old as NotificationRow;
          setNotifications((prev) => prev.filter((item) => item.id !== record.id));
        }
      });
    }, [subscribeToNotifications]);

    const publish = useCallback(
      async (input: PublishInput) => {
        if (!input.tableNumber) {
          return null;
        }

        const created = await publishMutation.mutateAsync({
          tableNumber: input.tableNumber,
          type: input.type,
        });

        setNotifications((prev) => [created, ...prev.filter((item) => item.id !== created.id)]);
        await utils.notifications.list.invalidate();
        return created;
      },
      [publishMutation, utils],
    );

    const list = useCallback(async () => {
      const data = await utils.notifications.list.fetch();
      const mapped = data ?? [];
      setNotifications(mapped);
      return mapped;
    }, [utils]);

    const clear = useCallback(
      async (id: number) => {
        await clearMutation.mutateAsync({ id });
        setNotifications((prev) => prev.filter((item) => item.id !== id));
        await utils.notifications.list.invalidate();
      },
      [clearMutation, utils],
    );

    const clearByTable = useCallback(
      async (tableNumber: number) => {
        await clearTableMutation.mutateAsync({ tableNumber });
        setNotifications((prev) => prev.filter((item) => item.tableNumber !== tableNumber));
        await utils.notifications.list.invalidate();
      },
      [clearTableMutation, utils],
    );

    const clearAll = useCallback(async () => {
      await clearAllMutation.mutateAsync();
      setNotifications([]);
      await utils.notifications.list.invalidate();
    }, [clearAllMutation, utils]);

    const value = useMemo<NotificationContextValue>(
      () => ({
        notifications,
        isLoading: notificationsQuery.isLoading,
        isRefetching: notificationsQuery.isRefetching,
        error: notificationsQuery.error,
        publish,
        list,
        clear,
        clearByTable,
        clearAll,
      }),
      [notifications, notificationsQuery.isLoading, notificationsQuery.isRefetching, notificationsQuery.error, publish, list, clear, clearByTable, clearAll],
    );

    return value;
  });

export const useNotifications = () => {
  const context = useNotificationsContext();
  return context;
};

export const usePublishNotification = () => {
  const context = useNotificationsContext();
  return context.publish;
};

export const useClearNotification = () => {
  const context = useNotificationsContext();
  return context.clear;
};

export const useClearTableNotifications = () => {
  const context = useNotificationsContext();
  return context.clearByTable;
};

export const useClearAllNotifications = () => {
  const context = useNotificationsContext();
  return context.clearAll;
};
