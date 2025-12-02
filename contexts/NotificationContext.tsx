import { useCallback, useEffect, useMemo, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { trpc } from "@/lib/trpcClient";
import { useRealtime } from "@/contexts/RealtimeContext";
import type { Notification } from "@/types/restaurant";
import type { RealtimePayload } from "@/contexts/RealtimeContext";

export type NotificationType = "assist" | "bill" | "notify";

export type TableNotification = {
  id: number;
  tableNumber: number;
  type: NotificationType;
  createdAt: string;
};

type PublishInput = {
  tableNumber: number;
  type?: NotificationType;
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

type NotificationRecord = RouterOutputs["notifications"]["list"][number];
type NotificationRowShape = {
  id: number;
  table_number: number;
  type: NotificationType;
  created_at: string;
};

const normalizeNotification = (record: NotificationRecord | NotificationRowShape): TableNotification => ({
  id: record.id,
  tableNumber: "table_number" in record ? record.table_number : record.tableNumber,
  type: record.type,
  createdAt: "created_at" in record ? record.created_at : record.createdAt,
});

export const [NotificationProvider, useNotificationsContext] =
  createContextHook<NotificationContextValue>(() => {
    const { subscribeToNotifications } = useRealtime();
    const utils = trpc.useUtils();

    const [notifications, setNotifications] = useState<TableNotification[]>([]);

    const notificationsQuery = trpc.notifications.list.useQuery(undefined);

    useEffect(() => {
      if (notificationsQuery.data) {
        setNotifications(notificationsQuery.data.map(normalizeNotification));
      }
    }, [notificationsQuery.data]);

    const publishMutation = trpc.notifications.publish.useMutation();
    const clearMutation = trpc.notifications.clear.useMutation();
    const clearTableMutation = trpc.notifications.clearByTable.useMutation();
    const clearAllMutation = trpc.notifications.clearAll.useMutation();

    useEffect(() => {
      return subscribeToNotifications((payload: RealtimePayload) => {
        if (payload.eventType === "INSERT") {
          const record = payload.new as NotificationRowShape | NotificationRecord;
          setNotifications((prev) => {
            const mapped = normalizeNotification(record);
            const next = [mapped, ...prev.filter((item) => item.id !== mapped.id)];
            return next.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
          });
          return;
        }

        if (payload.eventType === "DELETE") {
          const record = payload.old as NotificationRowShape | NotificationRecord;
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
          type: input.type ?? "notify",
        });

        const mapped = normalizeNotification(created as NotificationRecord);
        setNotifications((prev) => [mapped, ...prev.filter((item) => item.id !== mapped.id)]);
        await utils.notifications.list.invalidate();
        return created;
      },
      [publishMutation, utils],
    );

    const list = useCallback(async () => {
      const data = await utils.notifications.list.fetch();
      const mapped = (data ?? []).map(normalizeNotification);
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
