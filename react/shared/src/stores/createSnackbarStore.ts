import { create } from "zustand";

export interface SnackbarState {
  open: boolean;
  message: string | null;
  messageType: string | null;
  show: (messageType: string, message: string) => void;
  close: () => void;
  reset: () => void;
}

/**
 * Factory that creates an independent Zustand snackbar store instance.
 * Each call returns a new store with identical API but separate state.
 */
export function createSnackbarStore() {
  return create<SnackbarState>((set) => ({
    // State
    open: false,
    message: null,
    messageType: null,

    // Actions
    show: (messageType: string, message: string) => set({ open: true, messageType, message }),
    close: () => set({ open: false, message: null, messageType: null }),

    // Reset (same as close)
    reset: () => set({ open: false, message: null, messageType: null }),
  }));
}
