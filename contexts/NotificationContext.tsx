import { useCallback, useEffect, useMemo } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/supabase";
import type { NotificationRecord } from "@/supabase/functions/tapse-backend/_shared/trpc-router";

type PublishInput = { tableNumber: number; message?: string };

type NotificationContextValue = {
  list: ReturnType<typeof trpc.notifications.list.useQuery>;
  publish: (input: PublishInput) => Promise<NotificationRecord | null>;
  clear: (id: number) => Promise<void>;
  clearTable: (tableNumber: number) => Promise<void>;
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
    async ({ tableNumber, message }: PublishInput) => {
      const result = await publishMutation.mutateAsync({
        table_number: tableNumber,
        type: message || "help",
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

  return useMemo<NotificationContextValue>(
    () => ({
      list: notificationsQuery,
      publish,
      clear,
      clearTable,
    }),
    [notificationsQuery, publish, clear, clearTable],
  );
});

export const useNotifications = () => useNotificationsContext();
