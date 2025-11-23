import { useCallback, useEffect, useMemo } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/supabase";
import type { NotificationType, TableNotification } from "@/types/restaurant";

type NotificationContextValue = {
  data: TableNotification[] | undefined;
  isLoading: boolean;
  publish: (tableNumber: number, type?: NotificationType) => Promise<TableNotification | null>;
  clear: (id: number) => Promise<void>;
  clearTable: (tableNumber: number) => Promise<void>;
  clearAll: () => Promise<void>;
};

export const [NotificationProvider, useNotifications] = createContextHook<NotificationContextValue>(() => {
  const utils = trpc.useUtils();
  const notificationsQuery = trpc.notifications.list.useQuery(undefined, {
    refetchInterval: 7000,
  });

  const publishMutation = trpc.notifications.publish.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
    },
  });

  const clearMutation = trpc.notifications.clearById.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
    },
  });

  const clearTableMutation = trpc.notifications.clearByTable.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
    },
  });

  const clearAllMutation = trpc.notifications.clearAll.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => {
          utils.notifications.list.invalidate();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [utils]);

  const publish = useCallback(
    async (tableNumber: number, type: NotificationType = "help") => {
      const result = await publishMutation.mutateAsync({
        table_number: tableNumber,
        type,
      });
      return result ?? null;
    },
    [publishMutation],
  );

  const clear = useCallback(
    async (id: number) => {
      await clearMutation.mutateAsync({ id });
    },
    [clearMutation],
  );

  const clearTable = useCallback(
    async (tableNumber: number) => {
      await clearTableMutation.mutateAsync({ table_number: tableNumber });
    },
    [clearTableMutation],
  );

  const clearAll = useCallback(async () => {
    await clearAllMutation.mutateAsync();
  }, [clearAllMutation]);

  return useMemo<NotificationContextValue>(
    () => ({
      data: notificationsQuery.data,
      isLoading: notificationsQuery.isLoading,
      publish,
      clear,
      clearTable,
      clearAll,
    }),
    [notificationsQuery.data, notificationsQuery.isLoading, publish, clear, clearTable, clearAll],
  );
});
