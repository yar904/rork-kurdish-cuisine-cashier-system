import { useCallback, useEffect, useMemo } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/supabase";

type NotificationType = "help" | "bill" | "other";

type NotificationContextValue = {
  notify: (tableNumber: number, type?: NotificationType) => Promise<void>;
  useNotificationsList: () => ReturnType<typeof trpc.notifications.list.useQuery>;
  clear: (id: number) => Promise<void>;
};

export const [NotificationProvider, useNotificationsContext] = createContextHook<NotificationContextValue>(() => {
  const listQuery = trpc.notifications.list.useQuery(undefined, {
    refetchInterval: 3000,
  });

  const publishMutation = trpc.notifications.publish.useMutation();
  const clearMutation = trpc.notifications.clear.useMutation({
    onSuccess: () => {
      listQuery.refetch();
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => {
          listQuery.refetch();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [listQuery]);

  const notify = useCallback(
    async (tableNumber: number, type: NotificationType = "help") => {
      await publishMutation.mutateAsync({ tableNumber, type });
    },
    [publishMutation],
  );

  const clear = useCallback(
    async (id: number) => {
      await clearMutation.mutateAsync({ id });
    },
    [clearMutation],
  );

  return useMemo<NotificationContextValue>(
    () => ({
      notify,
      useNotificationsList: () => listQuery,
      clear,
    }),
    [notify, clear, listQuery],
  );
});

export const useNotificationsList = () => {
  const context = useNotificationsContext();
  return context.useNotificationsList();
};

export const useNotifications = useNotificationsContext;
