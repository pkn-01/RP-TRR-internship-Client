// Dialog System
export { DialogProvider, useDialog, DialogRenderer } from "./Dialog";
export type { DialogConfig } from "./Dialog";

// Forms & Modals
export { default as FormModal } from "./FormModal";
export type { FormField } from "./FormModal";

export { default as UserModal } from "./UserModal";
export { default as DepartmentModal } from "./DepartmentModal";
export { default as RoleModal } from "./RoleModal";

// Data Display
export { default as DataTable } from "./DataTable";
export type { TableColumn } from "./DataTable";

export { default as StatCard } from "./StatCard";
export { Badge, RoleBadge, StatusBadge } from "./Badge";
export type { BadgeProps } from "./Badge";

// Navigation & Feedback
export { default as Pagination } from "./Pagination";
export { default as SearchBox } from "./SearchBox";
export { default as Loading } from "./Loading";
export { default as Notification, NotificationContainer } from "./Notification";
export type { NotificationType } from "./Notification";

// Layout
export { default as AdminSidebar } from "./AdminSidebar";

// Legacy (keep for backward compatibility)
export { default as ConfirmDialog } from "./ConfirmDialog";
export { default as SuccessModal } from "./SuccessModal";
export { default as Alert } from "./Alert";
