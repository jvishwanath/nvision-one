type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

const CURRENT_LEVEL: LogLevel =
    (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) ?? "info";

function shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[CURRENT_LEVEL];
}

export const logger = {
    debug: (message: string, ...args: unknown[]) => {
        if (shouldLog("debug")) {
            // eslint-disable-next-line no-console
            console.debug(`[LifeOS:DEBUG] ${message}`, ...args);
        }
    },
    info: (message: string, ...args: unknown[]) => {
        if (shouldLog("info")) {
            // eslint-disable-next-line no-console
            console.info(`[LifeOS:INFO] ${message}`, ...args);
        }
    },
    warn: (message: string, ...args: unknown[]) => {
        if (shouldLog("warn")) {
            // eslint-disable-next-line no-console
            console.warn(`[LifeOS:WARN] ${message}`, ...args);
        }
    },
    error: (message: string, ...args: unknown[]) => {
        if (shouldLog("error")) {
            // eslint-disable-next-line no-console
            console.error(`[LifeOS:ERROR] ${message}`, ...args);
        }
    },
};
