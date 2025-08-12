/* Lightweight client-side logger */
type LogLevel = "info" | "warn" | "error" | "debug";

function baseLog(level: LogLevel, message: string, data?: unknown) {
  const time = new Date().toISOString();
  const payload = data !== undefined ? [message, data] : [message];
  const fn: ((...args: unknown[]) => void) | undefined = (console as unknown as Record<string, unknown>)[
    level
  ] as ((...args: unknown[]) => void) | undefined;
  if (typeof fn === "function") {
    fn(`[MODOO][${level.toUpperCase()}][${time}]`, ...payload);
  } else {
    console.log(`[MODOO][${level.toUpperCase()}][${time}]`, ...payload);
  }
}

export const logger = {
  info: (message: string, data?: unknown) => baseLog("info", message, data),
  warn: (message: string, data?: unknown) => baseLog("warn", message, data),
  error: (message: string, data?: unknown) => baseLog("error", message, data),
  debug: (message: string, data?: unknown) => baseLog("debug", message, data),
  event: (name: string, data?: unknown) => baseLog("info", `event:${name}`, data),
};

