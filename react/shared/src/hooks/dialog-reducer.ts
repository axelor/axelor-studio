export interface DialogState {
  open: boolean;
  title: string | null;
  message: string | null;
  onSave: () => void;
  onClose: () => void;
}

export type DialogAction =
  | {
      type: "OPEN_DIALOG";
      payload?: {
        title?: string;
        message?: string;
        onSave?: () => void;
        onClose?: () => void;
      };
    }
  | { type: "ON_SAVE" }
  | { type: "ON_CLOSE" };

export function dialogReducer(state: DialogState, action: DialogAction): DialogState {
  switch (action.type) {
    case "OPEN_DIALOG": {
      return {
        ...state,
        open: true,
        title: action.payload?.title ?? null,
        message: action.payload?.message ?? null,
        onSave: action.payload?.onSave ?? (() => {}),
        onClose: action.payload?.onClose || state.onClose,
      };
    }
    case "ON_SAVE": {
      return {
        ...state,
        open: false,
        title: null,
        message: null,
        onSave: () => {},
        onClose: () => {},
      };
    }
    case "ON_CLOSE": {
      return {
        ...state,
        open: false,
        title: null,
        message: null,
        onSave: () => {},
        onClose: () => {},
      };
    }
  }
}
