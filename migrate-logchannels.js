import { connectDatabase, mongoose } from './src/utils/database.js';
import { Guild } from './src/models/Guild.js';
import { logger } from './src/utils/logger.js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const configPath = join(__dirname, 'src/config/logChannel.json');

/**
 * Migrate log channels from JSON file to MongoDB
 */
async function migrateLogChannels() {
    logger.info('Starting log channel migration...');

    try {
        // Connect to database
        await connectDatabase();

        // Check if old config file exists
        if (!existsSync(configPath)) {
            logger.warn('No logChannel.json file found. Nothing to migrate.');
            await mongoose.disconnect();
            return;
        }

        // Read old config
        const oldConfig = JSON.parse(readFileSync(configPath, 'utf8'));
        const channels = oldConfig.channels || {};

        logger.info(`Found ${Object.keys(channels).length} log channel(s) to migrate`);

        let migrated = 0;
        let skipped = 0;

        // Migrate each guild's log channel
        for (const [guildId, channelId] of Object.entries(channels)) {
            try {
                // Find guild in database
                let guild = await Guild.findByGuildId(guildId);

                if (!guild) {
                    logger.warn(`Guild ${guildId} not found in database, skipping...`);
                    skipped++;
                    continue;
                }

                // Update log channel if not already set
                if (!guild.logChannelId) {
                    guild.logChannelId = channelId;
                    await guild.save();
                    logger.info(`✓ Migrated log channel for guild ${guildId}`);
                    migrated++;
                } else {
                    logger.info(`Guild ${guildId} already has a log channel, skipping...`);
                    skipped++;
                }

            } catch (error) {
                logger.error(`Failed to migrate guild ${guildId}: ${error.message}`);
                skipped++;
            }
        }

        logger.success(`Migration complete! Migrated: ${migrated}, Skipped: ${skipped}`);
        logger.info('You can now safely delete src/config/logChannel.json');

        await mongoose.disconnect();

    } catch (error) {
        logger.error(`Migration failed: ${error.message}`);
        process.exit(1);
    }
}

// Run migration
migrateLogChannels();
