"use client";

import React from "react";
import { Shield, User, AlertCircle, CheckCircle, Clock } from "lucide-react";

export interface BadgeProps {
  variant: "default" | "success" | "warning" | "danger" | "info";
  children: React.ReactNode;
  icon?: React.ReactNode;
  size?: "sm" | "md";
}

const variantClasses = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
};

const sizeClasses = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
};

export function Badge({
  variant = "default",
  size = "md",
  children,
  icon,
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

// Role Badge Helper
export function RoleBadge({ role }: { role: string }) {
  const config = {
    ADMIN: {
      icon: <Shield size={14} />,
      label: "ผู้ดูแลระบบ",
      variant: "danger" as const,
    },
    IT: {
      icon: <User size={14} />,
      label: "ทีมไอที",
      variant: "info" as const,
    },
    USER: {
      icon: <User size={14} />,
      label: "ผู้ใช้ทั่วไป",
      variant: "default" as const,
    },
  };

  const config_item = config[role as keyof typeof config] || config.USER;

  return (
    <Badge variant={config_item.variant} icon={config_item.icon}>
      {config_item.label}
    </Badge>
  );
}

// Status Badge Helper
export function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    ACTIVE: { label: "ใช้งาน", variant: "success" as const },
    INACTIVE: { label: "ไม่ใช้งาน", variant: "default" as const },
    PENDING: {
      label: "รอดำเนินการ",
      variant: "warning" as const,
      icon: <Clock size={14} />,
    },
    COMPLETED: {
      label: "เสร็จสิ้น",
      variant: "success" as const,
      icon: <CheckCircle size={14} />,
    },
    ERROR: {
      label: "ข้อผิดพลาด",
      variant: "danger" as const,
      icon: <AlertCircle size={14} />,
    },
  };

  const config_item =
    statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;

  const iconToRender =
    "icon" in config_item ? (config_item as any).icon : undefined;
  return (
    <Badge variant={config_item.variant} icon={iconToRender}>
      {config_item.label}
    </Badge>
  );
}
