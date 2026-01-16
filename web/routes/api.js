import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import { Guild } from '../../src/models/Guild.js';
import { User } from '../../src/models/User.js';

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

export default router;
