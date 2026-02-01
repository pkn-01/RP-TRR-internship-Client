"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export interface DialogConfig {
  id: string;
  type: "info" | "warning" | "error" | "success" | "form" | "custom";
  title: string;
  message?: string;
  content?: React.ReactNode;
  icon?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  isLoading?: boolean;
  onConfirm?: () => Promise<void> | void;
  onCancel?: () => void;
  onClose?: () => void;
}

interface DialogContextType {
  dialogs: DialogConfig[];
  openDialog: (config: Omit<DialogConfig, "id">) => string;
  closeDialog: (id: string) => void;
  updateDialog: (id: string, config: Partial<DialogConfig>) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialogs, setDialogs] = useState<DialogConfig[]>([]);

  const openDialog = useCallback((config: Omit<DialogConfig, "id">) => {
    const id = `dialog-${Date.now()}-${Math.random()}`;
    const dialogConfig: DialogConfig = { ...config, id };
    setDialogs((prev) => [...prev, dialogConfig]);
    return id;
  }, []);

  const closeDialog = useCallback((id: string) => {
    setDialogs((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const updateDialog = useCallback(
    (id: string, config: Partial<DialogConfig>) => {
      setDialogs((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...config } : d)),
      );
    },
    [],
  );

  return (
    <DialogContext.Provider
      value={{ dialogs, openDialog, closeDialog, updateDialog }}
    >
      {children}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within DialogProvider");
  }
  return context;
}
