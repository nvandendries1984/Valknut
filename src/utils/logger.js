import { config } from '../config/config.js';
import { appendFileSync, mkdirSync, existsSync, writeFileSync, readFileSync } from 'fs';
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
        this.logChannelConfigPath = join(__dirname, '../config/logChannel.json');
        this.client = null;

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

    setClient(client) {
        this.client = client;
    }

    getLogChannels() {
        try {
            if (!existsSync(this.logChannelConfigPath)) {
                return {};
            }
            const data = JSON.parse(readFileSync(this.logChannelConfigPath, 'utf8'));
            return data.channels || {};
        } catch (error) {
            return {};
        }
    }

    async sendToDiscord(level, message, guildId = null) {
        if (!this.client) return;

        const logChannels = this.getLogChannels();

        // ANSI color codes for Discord code blocks
        const colorMap = {
            error: '```ansi\n\u001b[0;31m',      // Red
            warn: '```ansi\n\u001b[0;33m',       // Yellow
            info: '```ansi\n\u001b[0;34m',       // Blue
            debug: '```ansi\n\u001b[0;36m',      // Cyan
            success: '```ansi\n\u001b[0;32m'     // Green
        };

        const timestamp = new Date().toLocaleString('nl-NL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const formattedMessage = `${colorMap[level] || '```'}[${timestamp}] [${level.toUpperCase()}] ${message}\u001b[0m\n\`\`\``;

        // If guildId is provided, only send to that guild's log channel
        if (guildId && logChannels[guildId]) {
            try {
                const channel = await this.client.channels.fetch(logChannels[guildId]);
                if (channel) {
                    await channel.send(formattedMessage);
                }
            } catch (error) {
                // Silently fail if channel not found or no permission
            }
        } else {
            // Send to all configured log channels
            for (const [guild, channelId] of Object.entries(logChannels)) {
                try {
                    const channel = await this.client.channels.fetch(channelId);
                    if (channel) {
                        await channel.send(formattedMessage);
                    }
                } catch (error) {
                    // Silently fail if channel not found or no permission
                }
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

    error(message, guildId = null) {
        if (this.currentLevel >= this.levels.error) {
            const formatted = this.formatMessage('error', message);
            console.error(`${colors.red}${formatted}${colors.reset}`);
            this.writeToFile(formatted);
            this.sendToDiscord('error', message, guildId);
        }
    }

    warn(message, guildId = null) {
        if (this.currentLevel >= this.levels.warn) {
            const formatted = this.formatMessage('warn', message);
            console.warn(`${colors.yellow}${formatted}${colors.reset}`);
            this.writeToFile(formatted);
            this.sendToDiscord('warn', message, guildId);
        }
    }

    info(message, guildId = null) {
        if (this.currentLevel >= this.levels.info) {
            const formatted = this.formatMessage('info', message);
            console.log(`${colors.blue}${formatted}${colors.reset}`);
            this.writeToFile(formatted);
            this.sendToDiscord('info', message, guildId);
        }
    }

    debug(message, guildId = null) {
        if (this.currentLevel >= this.levels.debug) {
            const formatted = this.formatMessage('debug', message);
            console.log(`${colors.cyan}${formatted}${colors.reset}`);
            this.writeToFile(formatted);
            this.sendToDiscord('debug', message, guildId);
        }
    }

    success(message, guildId = null) {
        const formatted = this.formatMessage('success', message);
        console.log(`${colors.green}${formatted}${colors.reset}`);
        this.writeToFile(formatted);
        this.sendToDiscord('success', message, guildId);
    }
}

export const logger = new Logger();
