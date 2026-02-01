"use client";

import { useState, useCallback } from "react";

export function useModal(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}

// Multiple modals management
export function useModals(initialState: Record<string, boolean> = {}) {
  const [modals, setModals] = useState(initialState);

  const open = useCallback((key: string) => {
    setModals((prev) => ({ ...prev, [key]: true }));
  }, []);

  const close = useCallback((key: string) => {
    setModals((prev) => ({ ...prev, [key]: false }));
  }, []);

  const toggle = useCallback((key: string) => {
    setModals((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const isOpen = useCallback((key: string) => {
    return modals[key] ?? false;
  }, [modals]);

  return {
    modals,
    open,
    close,
    toggle,
    isOpen,
  };
}
