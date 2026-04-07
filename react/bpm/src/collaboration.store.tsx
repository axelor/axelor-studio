function isFunction<T>(value: T | ((prev: T) => T)): value is (prev: T) => T {
  return typeof value === "function";
}

interface Store<T> {
  get: () => T;
  set: (value: T | ((prev: T) => T)) => void;
  subscribe: (listener: (state: T, prevState: T) => void) => () => void;
}

export function createStore<T>(initialState: T): Store<T> {
  let state = initialState;
  const listeners = new Set<(state: T, prevState: T) => void>();

  const subscribe = (listener: (state: T, prevState: T) => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const get = () => state;
  const set = (value: T | ((prev: T) => T)) => {
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

