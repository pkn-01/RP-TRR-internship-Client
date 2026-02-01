"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { userService, User } from "@/services/userService";

type Role = "ADMIN" | "IT" | "USER";

interface RoleAccessContext {
  currentUser: User | null;
  role: Role | null;
  isLoading: boolean;
  isAdmin: () => boolean;
  isIT: () => boolean;
  isUser: () => boolean;
  canManageUsers: () => boolean;
  canDeleteRepairs: () => boolean;
  canAccessSettings: () => boolean;
  canAccessAuditLogs: () => boolean;
  canExportData: () => boolean;
}

const RoleContext = createContext<RoleAccessContext | null>(null);

export function RoleAccessProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (userId) {
          const user = await userService.getUserById(parseInt(userId));
          setCurrentUser(user);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const role = currentUser?.role as Role | null;

  const isAdmin = () => role === "ADMIN";
  const isIT = () => role === "IT";
  const isUser = () => role === "USER";

  // Admin-only permissions
  const canManageUsers = () => isAdmin();
  const canDeleteRepairs = () => isAdmin();
  const canAccessSettings = () => isAdmin();
  const canAccessAuditLogs = () => isAdmin();
  const canExportData = () => isAdmin();

  return (
    <RoleContext.Provider
      value={{
        currentUser,
        role,
        isLoading,
        isAdmin,
        isIT,
        isUser,
        canManageUsers,
        canDeleteRepairs,
        canAccessSettings,
        canAccessAuditLogs,
        canExportData,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRoleAccess(): RoleAccessContext {
  const context = useContext(RoleContext);
  if (!context) {
    // Return default values for SSR or when not wrapped in provider
    return {
      currentUser: null,
      role: null,
      isLoading: true,
      isAdmin: () => false,
      isIT: () => false,
      isUser: () => false,
      canManageUsers: () => false,
      canDeleteRepairs: () => false,
      canAccessSettings: () => false,
      canAccessAuditLogs: () => false,
      canExportData: () => false,
    };
  }
  return context;
}

// Simple hook for quick role checks without context
export function useCurrentRole(): { role: Role | null; isLoading: boolean } {
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (userId) {
          const user = await userService.getUserById(parseInt(userId));
          setRole(user.role as Role);
        }
      } catch (error) {
        console.error("Failed to fetch role:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRole();
  }, []);

  return { role, isLoading };
}
