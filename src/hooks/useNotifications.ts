"use client";

import { useState, useCallback } from "react";
import { NotificationType } from "@/components/Notification";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback(
    (
      type: NotificationType,
      title: string,
      message?: string,
      duration?: number
    ) => {
      const id = `notification-${Date.now()}-${Math.random()}`;
      setNotifications((prev) => [
        ...prev,
        { id, type, title, message, duration: duration ?? 5000 },
      ]);
      return id;
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const success = useCallback(
    (title: string, message?: string, duration?: number) =>
      addNotification("success", title, message, duration),
    [addNotification]
  );

  const error = useCallback(
    (title: string, message?: string, duration?: number) =>
      addNotification("error", title, message, duration),
    [addNotification]
  );

  const warning = useCallback(
    (title: string, message?: string, duration?: number) =>
      addNotification("warning", title, message, duration),
    [addNotification]
  );

  const info = useCallback(
    (title: string, message?: string, duration?: number) =>
      addNotification("info", title, message, duration),
    [addNotification]
  );

  const clear = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    warning,
    info,
    clear,
  };
}
