import React from 'react';
import produce from 'immer';

const StoreContext = React.createContext();

function useMutableState(defaultValue) {
  const [state, setState] = React.useState(defaultValue);
  return [
    state,
    React.useCallback((updater) => setState(produce(updater)), [setState]),
  ];
}

function StoreProvider({ children }) {
  const [state, setState] = useMutableState({
    builderFields: [],
  });

  const value = {
    state,
    update: setState,
  };
  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  return React.useContext(StoreContext);
}

export function useStoreState() {
  const { state } = React.useContext(StoreContext);
  return state;
}

export function useWidget(id) {
  const { widgets } = useStore();
  return widgets[id];
}

export default StoreProvider;
