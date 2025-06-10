export class Logger {
    static info(message: string, context?: string) {
        console.log(`[INFO] ${context ? `[${context}] ` : ''}${new Date().toISOString()} - ${message}`);
    }

    static warn(message: string, context?: string) {
        console.warn(`[WARN] ${context ? `[${context}] ` : ''}${new Date().toISOString()} - ${message}`);
    }

    static error(message: string | Error, context?: string) {
        if (message instanceof Error) {
            console.error(`[ERROR] ${context ? `[${context}] ` : ''}${new Date().toISOString()} - ${message.message}\n${message.stack}`);
        } else {
            console.error(`[ERROR] ${context ? `[${context}] ` : ''}${new Date().toISOString()} - ${message}`);
        }
    }

    static debug(message: string, context?: string) {
        // Only log in development environments
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[DEBUG] ${context ? `[${context}] ` : ''}${new Date().toISOString()} - ${message}`);
        }
    }
}