import { useState, useEffect } from 'react';

interface ConfirmState {
  open: boolean;
  title: string;
  description: string;
  confirmText: string;
  variant: 'default' | 'destructive';
  resolve: ((value: boolean) => void) | null;
}

const defaultState: ConfirmState = {
  open: false,
  title: '',
  description: '',
  confirmText: 'Confirm',
  variant: 'destructive',
  resolve: null,
};

let memoryState: ConfirmState = { ...defaultState };

const listeners: Array<(state: ConfirmState) => void> = [];

function dispatch(state: ConfirmState) {
  memoryState = state;
  listeners.forEach((listener) => listener(memoryState));
}

interface ConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  variant?: 'default' | 'destructive';
}

function confirm({
  title,
  description,
  confirmText = 'Confirm',
  variant = 'destructive',
}: ConfirmOptions): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    dispatch({
      open: true,
      title,
      description,
      confirmText,
      variant,
      resolve,
    });
  });
}

function respond(value: boolean) {
  if (memoryState.resolve) {
    memoryState.resolve(value);
  }
  dispatch({ ...defaultState });
}

function useConfirmState() {
  const [state, setState] = useState<ConfirmState>(memoryState);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return state;
}

export { confirm, respond, useConfirmState };
