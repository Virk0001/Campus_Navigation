/* eslint-disable no-console */
// Lightweight logger that only logs in development
export const logger = {
  log: (...args: unknown[]) => {
  // Only log info when explicitly enabled to reduce console noise in development
  if (import.meta.env?.DEV && import.meta.env?.VITE_DEBUG_LOGS === 'true') console.log(...args);
  },
  warn: (...args: unknown[]) => {
    if (import.meta.env?.DEV) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    if (import.meta.env?.DEV) console.error(...args);
  },
};
