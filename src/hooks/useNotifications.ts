import { useCallback, useEffect, useMemo, useState } from "react";
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

  const [liveNotifications, setLiveNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    setLiveNotifications(data?.notifications || []);
  }, [data?.notifications]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const handleNewNotification = (payload: NotificationItem) => {
      if (!payload?.id) return;
      setLiveNotifications((prev) => {
        if (prev.some((item) => item.id === payload.id)) return prev;
        const next = [payload, ...prev];
        next.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        return next;
      });
    };

    const handleReadSync = (payload: {
      notificationId?: number;
      isRead: boolean;
      all?: boolean;
    }) => {
      if (payload?.all) {
        setLiveNotifications((prev) =>
          prev.map((item) => ({ ...item, isRead: payload.isRead })),
        );
        return;
      }

      if (!payload?.notificationId) return;
      setLiveNotifications((prev) =>
        prev.map((item) =>
          item.id === payload.notificationId
            ? { ...item, isRead: payload.isRead }
            : item,
        ),
      );
    };

    const handleReadAllSync = () => {
      setLiveNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
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

  const unreadCount = useMemo(
    () => liveNotifications.filter((item) => !item.isRead).length,
    [liveNotifications],
  );

  const markAsRead = useCallback(
    async (notificationId: number) => {
      const prevNotifications = liveNotifications;
      setLiveNotifications((prev) =>
        prev.map((item) =>
          item.id === notificationId ? { ...item, isRead: true } : item,
        ),
      );

      try {
        await axiosInstance.patch(`/api/notifications/read/${notificationId}`);
      } catch (error) {
        setLiveNotifications(prevNotifications);
        throw error;
      }
    },
    [liveNotifications],
  );

  const markAllAsRead = useCallback(async () => {
    const prevNotifications = liveNotifications;
    setLiveNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));

    try {
      await axiosInstance.patch("/api/notifications/read-all");
    } catch (error) {
      setLiveNotifications(prevNotifications);
      throw error;
    }
  }, [liveNotifications]);

  return {
    notifications: liveNotifications,
    unreadCount,
    isLoading,
    isError: error,
    mutate,
    markAsRead,
    markAllAsRead,
  };
}
