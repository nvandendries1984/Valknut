import dotenv from 'dotenv';
dotenv.config();

export const config = {
    // Discord credentials
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,

    // Bot settings
    botName: process.env.BOT_NAME || 'Discord Bot',
    prefix: process.env.BOT_PREFIX || '!',

    // Logging
    logLevel: process.env.LOG_LEVEL || 'info',

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
    const required = ['token', 'clientId'];
    const missing = required.filter(key => !config[key]);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}
