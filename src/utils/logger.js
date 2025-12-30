import { config } from '../config/config.js';
import { appendFileSync, mkdirSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
        this.logFile = join(__dirname, '../../logs/bot.log');

        // Create logs directory if it doesn't exist
        try {
            mkdirSync(dirname(this.logFile), { recursive: true });
        } catch (error) {
            // Directory already exists
        }

        // Create log file if it doesn't exist with proper permissions
        if (!existsSync(this.logFile)) {
            try {
                writeFileSync(this.logFile, '', { mode: 0o666 });
            } catch (error) {
                console.error(`Failed to create log file: ${error.message}`);
            }
        }
    }

    formatMessage(level, message) {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    }

    writeToFile(formattedMessage) {
        try {
            appendFileSync(this.logFile, formattedMessage + '\n');
        } catch (error) {
            console.error(`Failed to write to log file: ${error.message}`);
        }
    }

    error(message) {
        if (this.currentLevel >= this.levels.error) {
            const formatted = this.formatMessage('error', message);
            console.error(`${colors.red}${formatted}${colors.reset}`);
            this.writeToFile(formatted);
        }
    }

    warn(message) {
        if (this.currentLevel >= this.levels.warn) {
            const formatted = this.formatMessage('warn', message);
            console.warn(`${colors.yellow}${formatted}${colors.reset}`);
            this.writeToFile(formatted);
        }
    }

    info(message) {
        if (this.currentLevel >= this.levels.info) {
            const formatted = this.formatMessage('info', message);
            console.log(`${colors.blue}${formatted}${colors.reset}`);
            this.writeToFile(formatted);
        }
    }

    debug(message) {
        if (this.currentLevel >= this.levels.debug) {
            const formatted = this.formatMessage('debug', message);
            console.log(`${colors.cyan}${formatted}${colors.reset}`);
            this.writeToFile(formatted);
        }
    }

    success(message) {
        const formatted = this.formatMessage('success', message);
        console.log(`${colors.green}${formatted}${colors.reset}`);
        this.writeToFile(formatted);
    }
}

export const logger = new Logger();
