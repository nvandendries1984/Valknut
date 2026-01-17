import { User } from '../models/User.js';
import { Role } from '../models/Role.js';
import { logger } from './logger.js';

/**
 * Synchronize Discord server roles with the database for all registered users
 * @param {Client} client - Discord client
 */
export async function syncRoles(client) {
    logger.debug('Starting role synchronization...');

    let totalUpdated = 0;
    let totalChecked = 0;

    try {
        // Loop through all guilds the bot is in
        for (const [guildId, guild] of client.guilds.cache) {
            try {
                // Get all registered users for this guild from database
                const dbUsers = await User.find({ guildId }).populate('roles');

                if (dbUsers.length === 0) {
                    continue;
                }

                // First, ensure all Discord roles exist in database
                const discordRoles = guild.roles.cache.filter(role => !role.managed && role.name !== '@everyone');
                for (const [roleId, discordRole] of discordRoles) {
                    await Role.findOneAndUpdate(
                        { guildId, discordRoleId: roleId },
                        {
                            guildId,
                            name: discordRole.name,
                            discordRoleId: roleId,
                            color: discordRole.hexColor,
                            position: discordRole.position,
                            active: true
                        },
                        { upsert: true, new: true }
                    );
                }

                // Get all database roles for this guild
                const dbRoles = await Role.find({ guildId });
                const roleMap = new Map(dbRoles.map(role => [role.discordRoleId, role]));

                // Check each registered user
                for (const dbUser of dbUsers) {
                    totalChecked++;

                    try {
                        // Fetch the member from Discord
                        const member = await guild.members.fetch(dbUser.userId).catch(() => null);

                        if (!member) {
                            // User is no longer in the server
                            continue;
                        }

                        // Get current Discord roles (exclude @everyone and managed roles)
                        const currentDiscordRoles = member.roles.cache
                            .filter(role => !role.managed && role.name !== '@everyone')
                            .map(role => role.id);

                        // Get current database role IDs
                        const currentDbRoleIds = dbUser.roles.map(role => role.discordRoleId);

                        // Check if roles have changed
                        const rolesChanged =
                            currentDiscordRoles.length !== currentDbRoleIds.length ||
                            currentDiscordRoles.some(roleId => !currentDbRoleIds.includes(roleId)) ||
                            currentDbRoleIds.some(roleId => !currentDiscordRoles.includes(roleId));

                        if (rolesChanged) {
                            // Map Discord role IDs to database Role ObjectIds
                            const newRoleObjectIds = currentDiscordRoles
                                .map(roleId => roleMap.get(roleId)?._id)
                                .filter(id => id !== undefined);

                            // Update user roles in database
                            dbUser.roles = newRoleObjectIds;
                            await dbUser.save();

                            totalUpdated++;
                            logger.debug(`Updated roles for ${dbUser.username} in ${guild.name}`);
                        }

                    } catch (error) {
                        logger.error(`Error syncing roles for user ${dbUser.userId} in guild ${guild.name}: ${error.message}`);
                    }
                }

            } catch (error) {
                logger.error(`Error syncing roles for guild ${guildId}: ${error.message}`);
            }
        }

        if (totalUpdated > 0) {
            logger.info(`Role sync completed: ${totalUpdated} users updated out of ${totalChecked} checked`);
        } else {
            logger.debug(`Role sync completed: No changes detected (${totalChecked} users checked)`);
        }

    } catch (error) {
        logger.error(`Error in role synchronization: ${error.message}`);
    }
}

/**
 * Start automatic role synchronization every 5 minutes
 * @param {Client} client - Discord client
 */
export function startRoleSync(client) {
    // Run immediately on startup
    syncRoles(client);

    // Then run every 5 minutes (300000 milliseconds)
    setInterval(() => {
        syncRoles(client);
    }, 5 * 60 * 1000);

    logger.success('✓ Automatic role synchronization enabled (every 5 minutes)');
}
