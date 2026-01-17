import { Guild } from '../models/Guild.js';
import { logger } from './logger.js';

/**
 * Check if a user can execute commands (is server owner or has mod role)
 * @param {Interaction} interaction - Discord interaction object
 * @returns {Promise<{allowed: boolean, reason?: string}>}
 */
export async function canExecuteCommand(interaction) {
    // Check if used in a guild
    if (!interaction.guild) {
        return {
            allowed: false,
            reason: 'This command can only be used in a server!'
        };
    }

    // Check if user is server owner
    if (interaction.user.id === interaction.guild.ownerId) {
        return { allowed: true };
    }

    // Get guild from database to check mod role
    try {
        const guild = await Guild.findByGuildId(interaction.guild.id);

        if (!guild || !guild.settings.modRoleId) {
            return {
                allowed: false,
                reason: 'No moderator role has been set! The server owner must use `/setmod` to set a moderator role.'
            };
        }

        // Check if user has the mod role
        const hasModRole = interaction.member.roles.cache.has(guild.settings.modRoleId);

        if (!hasModRole) {
            return {
                allowed: false,
                reason: 'You need to be the server owner or have the moderator role to use this command!'
            };
        }

        return { allowed: true };
    } catch (error) {
        logger.error(`Error checking command permissions: ${error.message}`);
        return {
            allowed: false,
            reason: 'An error occurred while checking permissions. Please try again.'
        };
    }
}
