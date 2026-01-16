import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import { Guild } from '../../src/models/Guild.js';
import { User } from '../../src/models/User.js';
import { Role } from '../../src/models/Role.js';

const router = express.Router();

// Update guild settings
router.post('/guild/:guildId/settings', isAuthenticated, async (req, res) => {
    try {
        const guildId = req.params.guildId;
        const { logChannelId, prefix, language } = req.body;

        // Check if user has access
        const userGuild = req.user.guilds?.find(g => g.id === guildId);
        if (!userGuild || (userGuild.permissions & 0x8) !== 0x8) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Update guild
        const guild = await Guild.findByGuildId(guildId);
        if (!guild) {
            return res.status(404).json({ error: 'Guild not found' });
        }

        if (logChannelId !== undefined) guild.logChannelId = logChannelId || null;
        if (prefix !== undefined) guild.settings.prefix = prefix || null;
        if (language !== undefined) guild.settings.language = language || 'en';

        await guild.save();

        res.json({ success: true, guild });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// Get guild statistics
router.get('/guild/:guildId/stats', isAuthenticated, async (req, res) => {
    try {
        const guildId = req.params.guildId;

        // Check if user has access
        const userGuild = req.user.guilds?.find(g => g.id === guildId);
        if (!userGuild || (userGuild.permissions & 0x8) !== 0x8) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const guild = await Guild.findByGuildId(guildId);
        const userCount = await User.countDocuments({ guildId });
        const recentUsers = await User.find({ guildId })
            .sort({ registeredAt: -1 })
            .limit(10);

        res.json({
            memberCount: guild?.memberCount || 0,
            registeredUsers: userCount,
            hasLogChannel: !!guild?.logChannelId,
            recentUsers
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});

// Get all guilds (owner only)
router.get('/guilds', isAuthenticated, async (req, res) => {
    try {
        // Check if user is owner
        if (req.user.id !== process.env.OWNER_ID) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const guilds = await Guild.find({ active: true }).sort({ memberCount: -1 });
        res.json({ guilds });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get guilds' });
    }
});

// ===== ROLE MANAGEMENT =====

// Sync Discord roles to database
router.post('/guild/:guildId/roles/sync', isAuthenticated, async (req, res) => {
    try {
        const guildId = req.params.guildId;

        // Check if user has access
        const userGuild = req.user.guilds?.find(g => g.id === guildId);
        if (!userGuild || (userGuild.permissions & 0x8) !== 0x8) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Get Discord guild roles via bot
        const botGuild = req.app.get('discordClient')?.guilds?.cache?.get(guildId);
        if (!botGuild) {
            return res.status(404).json({ error: 'Bot is not in this guild' });
        }

        await botGuild.roles.fetch();
        const discordRoles = botGuild.roles.cache
            .filter(role => role.name !== '@everyone' && !role.managed)
            .sort((a, b) => b.position - a.position);

        let imported = 0;
        let updated = 0;

        for (const [roleId, discordRole] of discordRoles) {
            const existingRole = await Role.findByDiscordRoleId(guildId, roleId);

            if (existingRole) {
                // Update existing role
                existingRole.name = discordRole.name;
                existingRole.color = discordRole.hexColor || '#6B7280';
                existingRole.position = discordRole.position;
                await existingRole.save();
                updated++;
            } else {
                // Create new role
                const newRole = new Role({
                    guildId,
                    name: discordRole.name,
                    discordRoleId: roleId,
                    color: discordRole.hexColor || '#6B7280',
                    position: discordRole.position,
                    description: `Discord role: ${discordRole.name}`
                });
                await newRole.save();
                imported++;
            }
        }

        res.json({
            success: true,
            imported,
            updated,
            total: imported + updated
        });
    } catch (error) {
        console.error('Role sync error:', error);
        res.status(500).json({ error: 'Failed to sync roles' });
    }
});

// Get all roles for a guild
router.get('/guild/:guildId/roles', isAuthenticated, async (req, res) => {
    try {
        const guildId = req.params.guildId;

        // Check if user has access
        const userGuild = req.user.guilds?.find(g => g.id === guildId);
        if (!userGuild || (userGuild.permissions & 0x8) !== 0x8) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const roles = await Role.findByGuildId(guildId);
        res.json({ roles });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get roles' });
    }
});

// ===== USER MANAGEMENT =====

// Get user with roles
router.get('/guild/:guildId/users/:userId', isAuthenticated, async (req, res) => {
    try {
        const { guildId, userId } = req.params;

        // Check if user has access
        const userGuild = req.user.guilds?.find(g => g.id === guildId);
        if (!userGuild || (userGuild.permissions & 0x8) !== 0x8) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const user = await User.findOne({ userId, guildId }).populate('roles');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get user' });
    }
});

export default router;
