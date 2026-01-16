import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import { Guild } from '../../src/models/Guild.js';
import { User } from '../../src/models/User.js';

const router = express.Router();

// Dashboard home
router.get('/', isAuthenticated, async (req, res) => {
    try {
        // Get user's guilds from Discord
        const userGuilds = req.user.guilds || [];

        // Get bot's guilds from database
        const botGuilds = await Guild.find({ active: true });
        const botGuildIds = new Set(botGuilds.map(g => g.guildId));

        // Find mutual guilds where user has admin permissions
        const mutualGuilds = userGuilds.filter(guild => {
            const hasAdmin = (guild.permissions & 0x8) === 0x8; // Administrator permission
            return botGuildIds.has(guild.id) && hasAdmin;
        });

        // Get detailed info for mutual guilds
        const guildsWithInfo = await Promise.all(
            mutualGuilds.map(async (guild) => {
                const dbGuild = botGuilds.find(g => g.guildId === guild.id);
                const userCount = await User.countDocuments({ guildId: guild.id });

                return {
                    ...guild,
                    memberCount: dbGuild?.memberCount || 0,
                    registeredUsers: userCount,
                    logChannelId: dbGuild?.logChannelId,
                    settings: dbGuild?.settings || {}
                };
            })
        );

        res.render('dashboard', {
            title: 'Dashboard',
            guilds: guildsWithInfo,
            allGuilds: userGuilds.length,
            mutualGuilds: mutualGuilds.length
        });
    } catch (error) {
        res.status(500).render('error', {
            title: 'Error',
            error: { message: 'Failed to load dashboard' }
        });
    }
});

// Guild management page
router.get('/guild/:guildId', isAuthenticated, async (req, res) => {
    try {
        const guildId = req.params.guildId;

        // Check if user has access to this guild
        const userGuild = req.user.guilds?.find(g => g.id === guildId);
        if (!userGuild || (userGuild.permissions & 0x8) !== 0x8) {
            return res.status(403).render('error', {
                title: 'Access Denied',
                error: { message: 'You do not have permission to manage this guild' }
            });
        }

        // Get guild from database
        const guild = await Guild.findByGuildId(guildId);
        if (!guild) {
            return res.status(404).render('error', {
                title: 'Guild Not Found',
                error: { message: 'This guild is not in the database' }
            });
        }

        // Get registered users
        const users = await User.find({ guildId }).sort({ registeredAt: -1 }).limit(50);

        res.render('guild', {
            title: `Manage ${userGuild.name}`,
            guild: {
                ...userGuild,
                dbInfo: guild,
                users
            }
        });
    } catch (error) {
        res.status(500).render('error', {
            title: 'Error',
            error: { message: 'Failed to load guild information' }
        });
    }
});

export default router;
