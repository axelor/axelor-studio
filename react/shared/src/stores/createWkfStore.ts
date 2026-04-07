import { create } from "zustand";

/**
 * Factory that creates an independent Zustand wkf store instance.
 * Generates dynamic setters from initialState keys.
 *
 * For key "wkf" -> creates "setWkf"
 * For key "enableStudioApp" -> creates "setEnableStudioApp"
 *
 * Always includes a reset() action that restores to initialState.
 */
type Setters<T> = {
  [K in keyof T as `set${Capitalize<string & K>}`]: (val: T[K]) => void;
};

export function createWkfStore<T extends Record<string, unknown>>(initialState: T) {
  type StoreState = T & Setters<T> & { reset: () => void };
  return create<StoreState>((set) => {
    // Generate dynamic setters: key "foo" -> "setFoo"
    const setters: Record<string, (val: unknown) => void> = {};
    for (const key of Object.keys(initialState)) {
      const setterName = `set${key.charAt(0).toUpperCase()}${key.slice(1)}`;
      setters[setterName] = (val: unknown) => set({ [key]: val } as Partial<StoreState>);
    }

    return {
      ...initialState,
      ...setters,
      reset: () => set(initialState as unknown as Partial<StoreState>), // safety: zustand set() expects Partial but initialState is full StoreState
    } as StoreState;
  });
}
