import { config } from '../config/config.js';

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

class Logger {
    constructor() {
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };
        this.currentLevel = this.levels[config.logLevel] || this.levels.info;
    }

    formatMessage(level, message) {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    }

    error(message) {
        if (this.currentLevel >= this.levels.error) {
            console.error(`${colors.red}${this.formatMessage('error', message)}${colors.reset}`);
        }
    }

    warn(message) {
        if (this.currentLevel >= this.levels.warn) {
            console.warn(`${colors.yellow}${this.formatMessage('warn', message)}${colors.reset}`);
        }
    }

    info(message) {
        if (this.currentLevel >= this.levels.info) {
            console.log(`${colors.blue}${this.formatMessage('info', message)}${colors.reset}`);
        }
    }

    debug(message) {
        if (this.currentLevel >= this.levels.debug) {
            console.log(`${colors.cyan}${this.formatMessage('debug', message)}${colors.reset}`);
        }
    }

    success(message) {
        console.log(`${colors.green}${this.formatMessage('success', message)}${colors.reset}`);
    }
}

export const logger = new Logger();
