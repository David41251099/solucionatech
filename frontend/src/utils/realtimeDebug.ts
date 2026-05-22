export type RealtimeDebugEntry = {
  scope: string;
  message: string;
  detail?: unknown;
  timestamp: string;
};

type RealtimeDebugListener = (entry: RealtimeDebugEntry) => void;

const listeners = new Set<RealtimeDebugListener>();
const history: RealtimeDebugEntry[] = [];
const MAX_HISTORY = 30;

const isBrowser = typeof window !== "undefined";

const notify = (entry: RealtimeDebugEntry) => {
  listeners.forEach((listener) => listener(entry));
};

export const pushRealtimeDebug = (scope: string, message: string, detail?: unknown) => {
  const entry: RealtimeDebugEntry = {
    scope,
    message,
    detail,
    timestamp: new Date().toISOString(),
  };

  history.unshift(entry);
  if (history.length > MAX_HISTORY) {
    history.length = MAX_HISTORY;
  }

  if (isBrowser) {
    (window as Window & { __solucionaTechRealtimeDebug?: RealtimeDebugEntry[] }).__solucionaTechRealtimeDebug =
      [...history];
  }

  notify(entry);
};

export const getRealtimeDebugHistory = () => [...history];

export const subscribeRealtimeDebug = (listener: RealtimeDebugListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
