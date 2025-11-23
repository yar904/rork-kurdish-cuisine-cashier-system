import { useCallback, useEffect, useMemo } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/supabase";
import type { NotificationRecord } from "@/supabase/functions/tapse-backend/_shared/trpc-router";

type NotificationType = "help" | "bill" | "other" | "call_waiter" | "request_bill" | "assist";
type PublishInput = { table_number: number; type: NotificationType };

type NotificationContextValue = ReturnType<typeof trpc.notifications.list.useQuery> & {
  publish: (input: PublishInput) => Promise<NotificationRecord | null>;
  list: () => Promise<NotificationRecord[]>;
  clearById: (id: number) => Promise<void>;
  clearByTable: (tableNumber: number) => Promise<void>;
  clearAll: () => Promise<void>;
};

export const [NotificationProvider, useNotificationsContext] =
  createContextHook<NotificationContextValue>(() => {
    const notificationsQuery = trpc.notifications.list.useQuery(undefined, {
      refetchInterval: 7000,
    });

    const utils = trpc.useUtils();

    const publishMutation = trpc.notifications.publish.useMutation({
      onSuccess: () => {
        notificationsQuery.refetch();
      },
    });

    const clearMutation = trpc.notifications.clearById.useMutation({
      onSuccess: () => {
        notificationsQuery.refetch();
      },
    });

    const clearTableMutation = trpc.notifications.clearByTable.useMutation({
      onSuccess: () => {
        notificationsQuery.refetch();
      },
    });

    const clearAllMutation = trpc.notifications.clearAll.useMutation({
      onSuccess: () => {
        notificationsQuery.refetch();
      },
    });

    useEffect(() => {
      const channel = supabase
        .channel("notifications-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notifications" },
          () => {
            notificationsQuery.refetch();
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, [notificationsQuery]);

    const publish = useCallback(
      async (input: PublishInput) => {
        const result = await publishMutation.mutateAsync(input);
        await utils.notifications.list.invalidate();
        return result ?? null;
      },
      [publishMutation, utils],
    );

    const list = useCallback(async () => {
      const result = await utils.notifications.list.fetch();
      return result ?? [];
    }, [utils]);

    const clearById = useCallback(
      async (id: number) => {
        await clearMutation.mutateAsync({ id });
        await utils.notifications.list.invalidate();
      },
      [clearMutation, utils],
    );

    const clearByTable = useCallback(
      async (tableNumber: number) => {
        await clearTableMutation.mutateAsync({ table_number: tableNumber });
        await utils.notifications.list.invalidate();
      },
      [clearTableMutation, utils],
    );

    const clearAll = useCallback(async () => {
      await clearAllMutation.mutateAsync();
      await utils.notifications.list.invalidate();
    }, [clearAllMutation, utils]);

    const value = useMemo<NotificationContextValue>(
      () => ({
        ...notificationsQuery,
        publish,
        list,
        clearById,
        clearByTable,
        clearAll,
      }),
      [notificationsQuery, publish, list, clearById, clearByTable, clearAll],
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
  return context.clearById;
};

export const useClearTableNotifications = () => {
  const context = useNotificationsContext();
  return context.clearByTable;
};

export const useClearAllNotifications = () => {
  const context = useNotificationsContext();
  return context.clearAll;
};
