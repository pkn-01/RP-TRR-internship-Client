"use client";

import React, { useEffect } from "react";
import {
  X,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";

export type NotificationType = "success" | "error" | "warning" | "info";

interface NotificationProps {
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  onClose: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const typeConfig = {
  success: {
    icon: CheckCircle2,
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-800",
    iconColor: "text-green-600",
  },
  error: {
    icon: AlertCircle,
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-800",
    iconColor: "text-red-600",
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    textColor: "text-yellow-800",
    iconColor: "text-yellow-600",
  },
  info: {
    icon: Info,
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-800",
    iconColor: "text-blue-600",
  },
};

export default function Notification({
  type,
  title,
  message,
  duration = 5000,
  onClose,
  action,
}: NotificationProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div
      className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 shadow-lg flex gap-3 items-start animate-in fade-in slide-in-from-top-2 duration-300`}
    >
      <Icon className={`${config.iconColor} flex-shrink-0 mt-0.5`} size={20} />

      <div className="flex-1">
        <h3 className={`${config.textColor} font-medium text-sm`}>{title}</h3>
        {message && (
          <p className={`${config.textColor} text-xs opacity-75 mt-1`}>
            {message}
          </p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className={`${config.textColor} text-xs font-medium mt-2 hover:opacity-75 transition-opacity`}
          >
            {action.label}
          </button>
        )}
      </div>

      <button
        onClick={onClose}
        className={`${config.textColor} flex-shrink-0 hover:opacity-75 transition-opacity`}
      >
        <X size={16} />
      </button>
    </div>
  );
}

// Notification Container for multiple notifications
interface NotificationContainerProps {
  notifications: Array<NotificationProps & { id: string }>;
  onRemove: (id: string) => void;
}

export function NotificationContainer({
  notifications,
  onRemove,
}: NotificationContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-md">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          {...notification}
          onClose={() => onRemove(notification.id)}
        />
      ))}
    </div>
  );
}
