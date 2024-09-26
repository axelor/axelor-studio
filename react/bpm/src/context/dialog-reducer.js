const dialogReducer = (state, action) => {
  switch (action.type) {
    case "OPEN_DIALOG": {
      return {
        ...state,
        open: true,
        title: action.payload?.title,
        message: action.payload?.message,
        onSave: action.payload?.onSave,
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
    case "ON_ClOSE": {
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
};
export default dialogReducer;
