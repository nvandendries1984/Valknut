import { Events } from 'discord.js';
import { User } from '../models/User.js';
import { Role } from '../models/Role.js';
import { logger } from '../utils/logger.js';

export default {
    name: Events.GuildMemberUpdate,
    async execute(oldMember, newMember) {
        try {
            const guildId = newMember.guild.id;
            const userId = newMember.user.id;

            // Check if roles changed
            const oldRoles = oldMember.roles.cache;
            const newRoles = newMember.roles.cache;

            if (oldRoles.size === newRoles.size &&
                oldRoles.every(role => newRoles.has(role.id))) {
                // No role changes
                return;
            }

            // Find user in database
            const user = await User.findOne({ userId, guildId });
            if (!user) {
                // User not registered yet
                return;
            }

            // Get all Discord role IDs from the member
            const memberDiscordRoleIds = Array.from(newRoles.keys())
                .filter(roleId => roleId !== guildId); // Exclude @everyone

            // Find corresponding roles in database
            const dbRoles = await Role.find({
                guildId,
                discordRoleId: { $in: memberDiscordRoleIds }
            });

            // Update user roles
            user.roles = dbRoles.map(role => role._id);
            await user.save();

            logger.info(`Updated roles for user ${newMember.user.tag} in guild ${newMember.guild.name}`);
        } catch (error) {
            logger.error('Error in guildMemberUpdate:', error);
        }
    }
};
