import React from "react";

import { AlertComponent } from "./Alert";

interface SnackbarNotificationProps {
  store: () => { open: boolean; message: string | null; messageType: string | null };
  onClose: (...args: unknown[]) => void;
}

/**
 * Shared snackbar notification component.
 * Subscribes to a Zustand snackbar store and renders Alert when open.
 */
export function SnackbarNotification({ store, onClose }: SnackbarNotificationProps) {
  const { open, message, messageType } = store();

  if (!open || !message) return null;

  return (
    <AlertComponent
      open={open}
      message={message}
      messageType={messageType ?? undefined}
      onClose={() => onClose()}
    />
  );
}
