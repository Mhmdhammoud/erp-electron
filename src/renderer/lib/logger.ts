/**
 * Logger utility for the Electron app
 * Replaces console.log/error/warn to comply with linting rules
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]): void => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  },
  error: (...args: unknown[]): void => {
    // Always log errors, even in production
    // eslint-disable-next-line no-console
    console.error(...args);
  },
  warn: (...args: unknown[]): void => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.warn(...args);
    }
  },
  info: (...args: unknown[]): void => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.info(...args);
    }
  },
};

