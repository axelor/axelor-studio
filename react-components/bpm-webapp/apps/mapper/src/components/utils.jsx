import React from 'react';
import produce from 'immer';


export function useDebounce(cb, duration) {
  const timer = React.useRef(null);

  const clearTimer = () => timer.current && clearTimeout(timer.current);
  const setTimer = (cb) => (timer.current = setTimeout(cb, duration));

  React.useEffect(() => {
    return () => clearTimer();
  }, []);

  return (...args) => {
    clearTimer();
    setTimer(() => cb(...args));
  };
}

export function useMutableState(defaultValue) {
  const [state, setState] = React.useState(defaultValue);
  return [
    state,
    React.useCallback(
      (updater) => {
        return setState(
          typeof updater === 'function' ? produce(updater) : updater
        );
      },
      [setState]
    ),
  ];
}

export function getFormName(str) {
  if (!str) return;
  const formString = str.match(/[A-Z][a-z]+/g);
  if (!formString) return;
  if (formString.join('').trim().length !== str.length) {
    return 'fetchAPI';
  }
  const form = formString && formString.join('-');
  return `${form.toLowerCase()}-form`;
}
