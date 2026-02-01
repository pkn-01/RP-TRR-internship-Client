"use client";

import React from "react";
import { useDialog, DialogConfig } from "./DialogContext";
import Dialog from "./Dialog";

export default function DialogRenderer() {
  const { dialogs, closeDialog } = useDialog();

  return (
    <>
      {dialogs.map((dialog) => (
        <Dialog
          key={dialog.id}
          {...dialog}
          onClose={() => {
            dialog.onClose?.();
            closeDialog(dialog.id);
          }}
        />
      ))}
    </>
  );
}
