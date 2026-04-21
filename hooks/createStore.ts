import { useSyncExternalStore } from 'react';

// Um micro-Zustand 100% nativo (React 18+)
export function createStore<T>(initialState: T) {
  let state = initialState;
  const listeners = new Set<() => void>();

  const getState = () => state;

  const setState = (partial: Partial<T> | ((state: T) => Partial<T>)) => {
    const nextState = typeof partial === 'function' ? (partial as any)(state) : partial;
    if (nextState !== state) {
      state = { ...state, ...nextState };
      listeners.forEach(listener => listener());
    }
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  // Hook que os componentes usarão para puxar o estado
  const useStore = <U>(selector: (state: T) => U): U => {
    return useSyncExternalStore(subscribe, () => selector(getState()));
  };

  return { getState, setState, subscribe, useStore };
}
