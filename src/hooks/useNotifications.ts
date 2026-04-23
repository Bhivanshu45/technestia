import { useCallback, useEffect, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import axiosInstance from "@/lib/axios";
import { getSocket } from "@/socket";
import { NotificationItem } from "@/types/notification";

interface NotificationsResponse {
  success: boolean;
  message: string;
  notifications: NotificationItem[];
  unreadCount: number;
}

export function useNotifications() {
  const { data, error, isLoading, mutate } = useSWR<NotificationsResponse>(
    "/api/notifications/my",
    fetcher,
    { refreshInterval: 0 },
  );

  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const handleNewNotification = (payload: NotificationItem) => {
      if (!payload?.id) return;
      mutate((prev) => {
        if (!prev) {
          return {
            success: true,
            message: "Notifications updated",
            notifications: [payload],
            unreadCount: payload.isRead ? 0 : 1,
          };
        }

        if (prev.notifications.some((item) => item.id === payload.id)) return prev;

        const notifications = [payload, ...prev.notifications].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        return {
          ...prev,
          notifications,
          unreadCount: notifications.filter((item) => !item.isRead).length,
        };
      }, { revalidate: false });
    };

    const handleReadSync = (payload: {
      notificationId?: number;
      isRead: boolean;
      all?: boolean;
    }) => {
      if (!payload) return;

      mutate((prev) => {
        if (!prev) return prev;

        let notifications = prev.notifications;

        if (payload.all) {
          notifications = notifications.map((item) => ({
            ...item,
            isRead: payload.isRead,
          }));
        } else if (payload.notificationId) {
          notifications = notifications.map((item) =>
            item.id === payload.notificationId
              ? { ...item, isRead: payload.isRead }
              : item,
          );
        }

        return {
          ...prev,
          notifications,
          unreadCount: notifications.filter((item) => !item.isRead).length,
        };
      }, { revalidate: false });

      if (payload?.all) {
        return;
      }
    };

    const handleReadAllSync = () => {
      handleReadSync({ all: true, isRead: true });
    };

    socket.on("notification:new", handleNewNotification);
    socket.on("notification:read-sync", handleReadSync);
    socket.on("notification:read-all-sync", handleReadAllSync);

    return () => {
      socket.off("notification:new", handleNewNotification);
      socket.off("notification:read-sync", handleReadSync);
      socket.off("notification:read-all-sync", handleReadAllSync);
    };
  }, []);

  const notifications = useMemo(() => data?.notifications || [], [data?.notifications]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications],
  );

  const markAsRead = useCallback(
    async (notificationId: number) => {
      let previousState: NotificationsResponse | undefined;

      mutate((prev) => {
        previousState = prev;
        if (!prev) return prev;

        const notifications = prev.notifications.map((item) =>
          item.id === notificationId ? { ...item, isRead: true } : item,
        );

        return {
          ...prev,
          notifications,
          unreadCount: notifications.filter((item) => !item.isRead).length,
        };
      }, { revalidate: false });

      try {
        await axiosInstance.patch(`/api/notifications/read/${notificationId}`);
      } catch (error) {
        mutate(previousState, { revalidate: false });
        throw error;
      }
    },
    [mutate],
  );

  const markAllAsRead = useCallback(async () => {
    let previousState: NotificationsResponse | undefined;

    mutate((prev) => {
      previousState = prev;
      if (!prev) return prev;

      const notifications = prev.notifications.map((item) => ({
        ...item,
        isRead: true,
      }));

      return {
        ...prev,
        notifications,
        unreadCount: 0,
      };
    }, { revalidate: false });

    try {
      await axiosInstance.patch("/api/notifications/read-all");
    } catch (error) {
      mutate(previousState, { revalidate: false });
      throw error;
    }
  }, [mutate]);

  return {
    notifications,
    unreadCount,
    isLoading,
    isError: error,
    mutate,
    markAsRead,
    markAllAsRead,
  };
}
