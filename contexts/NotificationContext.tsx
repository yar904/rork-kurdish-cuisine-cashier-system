import { useCallback, useEffect, useMemo } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/supabase";
import type { NotificationRecord } from "@/supabase/functions/tapse-backend/_shared/trpc-router";

type PublishInput = { table_number: number; type: string };

type NotificationContextValue = {
  useNotifications: () => ReturnType<typeof trpc.notifications.list.useQuery>;
  publish: (input: PublishInput) => Promise<NotificationRecord | null>;
  clearById: (id: number) => Promise<void>;
  clearByTable: (tableNumber: number) => Promise<void>;
};

export const [NotificationProvider, useNotificationsContext] = createContextHook<NotificationContextValue>(() => {
  const notificationsQuery = trpc.notifications.list.useQuery(undefined, {
    refetchInterval: 7000,
  });

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
      return result ?? null;
    },
    [publishMutation],
  );

  const clearById = useCallback(
    async (id: number) => {
      await clearMutation.mutateAsync({ id });
    },
    [clearMutation],
  );

  const clearByTable = useCallback(
    async (tableNumber: number) => {
      await clearTableMutation.mutateAsync({ table_number: tableNumber });
    },
    [clearTableMutation],
  );

  return useMemo<NotificationContextValue>(
    () => ({
      useNotifications: () => notificationsQuery,
      publish,
      clearById,
      clearByTable,
    }),
    [notificationsQuery, publish, clearById, clearByTable],
  );
});

export const useNotifications = () => {
  const context = useNotificationsContext();
  return context.useNotifications();
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
