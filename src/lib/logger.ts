type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

function resolveLogLevel(): LogLevel {
    const raw = process.env.NEXT_PUBLIC_LOG_LEVEL;
    if (!raw) return "info";
    if (raw === "debug" || raw === "info" || raw === "warn" || raw === "error") {
        return raw;
    }
    return "info";
}

const CURRENT_LEVEL: LogLevel = resolveLogLevel();

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
