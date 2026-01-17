import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Determine backup directory (Docker vs local)
const getBackupDir = () => {
    const dockerPath = '/app/db-backups';
    const localPath = path.join(path.dirname(__dirname), '..', 'db-backups');

    // Check if Docker path exists
    if (fs.existsSync(dockerPath)) {
        return dockerPath;
    }

    // Use local path and ensure it exists
    if (!fs.existsSync(localPath)) {
        fs.mkdirSync(localPath, { recursive: true });
    }
    return localPath;
};

export const config = {
    // Discord credentials
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,

    // Bot settings
    botName: process.env.BOT_NAME || 'Discord Bot',
    prefix: process.env.BOT_PREFIX || '!',
    ownerId: process.env.OWNER_ID,

    // Logging
    logLevel: process.env.LOG_LEVEL || 'info',

    // MongoDB
    mongodbUri: process.env.MONGODB_URI,

    // Backup directory
    backupDir: getBackupDir(),

    // Bot intents and configuration
    intents: [
        'Guilds',
        'GuildMessages',
        'MessageContent',
        'GuildMembers',
        'GuildModeration'
    ],

    // Partials for caching
    partials: [
        'Message',
        'Channel',
        'Reaction'
    ]
};

// Validate required config
export function validateConfig() {
    const required = ['token', 'clientId', 'mongodbUri'];
    const missing = required.filter(key => !config[key]);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}
