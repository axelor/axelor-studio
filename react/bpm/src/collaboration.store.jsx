import { useSyncExternalStore } from "react";

function isFunction(value) {
  return typeof value === "function";
}

export function createStore(initialState) {
  let state = initialState;
  let listeners = new Set();

  const subscribe = (listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const get = () => state;
  const set = (value) => {
    const prevState = state;
    const nextState = isFunction(value) ? value(prevState) : value;
    if (nextState !== prevState) {
      state = nextState;
      listeners.forEach((fn) => fn(state, prevState));
    }
  };

  return {
    get,
    set,
    subscribe,
  };
}

export function useStore(store) {
  return useSyncExternalStore(store.subscribe, store.get);
}
