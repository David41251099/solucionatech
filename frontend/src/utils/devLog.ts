const shouldWriteDevLogs = import.meta.env.DEV && import.meta.env.MODE !== "test";

const writeDevLog = (method: "log" | "warn" | "error", ...args: unknown[]) => {
  if (!shouldWriteDevLogs) {
    return;
  }

  console[method](...args);
};

export const devLog = (...args: unknown[]) => {
  writeDevLog("log", ...args);
};

export const devWarn = (...args: unknown[]) => {
  writeDevLog("warn", ...args);
};

export const devError = (...args: unknown[]) => {
  writeDevLog("error", ...args);
};
