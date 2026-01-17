import express from 'express';
import { isAllowedUser, hasGuildAccess } from '../middleware/auth.js';
import { Guild } from '../../src/models/Guild.js';
import { User } from '../../src/models/User.js';
import { Role } from '../../src/models/Role.js';
import { AllowedUser } from '../../src/models/AllowedUser.js';

const router = express.Router();

// Dashboard home
router.get('/', isAllowedUser, async (req, res) => {
    try {
        // Get user's guilds from Discord
        const userGuilds = req.user.guilds || [];

        // Get bot's guilds from database
        const botGuilds = await Guild.find({ active: true });
        const botGuildIds = new Set(botGuilds.map(g => g.guildId));

        // Owner sees all guilds
        const isOwner = req.user.id === process.env.OWNER_ID;

        // Check if user is a moderator (AllowedUser)
        const isModerator = await AllowedUser.isAllowed(req.user.id);

        // Find mutual guilds with appropriate access
        const botClient = req.app.get('client');
        const mutualGuildsPromises = userGuilds
            .filter(guild => botGuildIds.has(guild.id))
            .map(async (guild) => {
                // Owner has access to all guilds
                if (isOwner) {
                    return guild;
                }

                // Check admin permissions
                const hasAdmin = (guild.permissions & 0x8) === 0x8;
                if (hasAdmin) {
                    return guild;
                }

                // Check Discord roles
                if (botClient) {
                    try {
                        const discordGuild = botClient.guilds.cache.get(guild.id);
                        if (discordGuild) {
                            const member = await discordGuild.members.fetch(req.user.id);

                            // Check DEV role
                            const hasDevRole = member.roles.cache.some(role => role.name === 'DEV');
                            if (hasDevRole) {
                                return guild;
                            }

                            // Moderators need Mod role in the guild
                            if (isModerator) {
                                const hasModRole = member.roles.cache.some(role => role.name === 'Mod');
                                if (hasModRole) {
                                    return guild;
                                }
                            }
                        }
                    } catch (error) {
                        console.error(`Error checking roles for guild ${guild.id}:`, error);
                    }
                }

                return null;
            });

        const mutualGuildsResults = await Promise.all(mutualGuildsPromises);
        const mutualGuilds = mutualGuildsResults.filter(g => g !== null);

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
router.get('/guild/:guildId', isAllowedUser, hasGuildAccess, async (req, res) => {
    try {
        const guildId = req.params.guildId;

        // Get user's guild info from Discord
        const userGuild = req.user.guilds?.find(g => g.id === guildId);
        if (!userGuild) {
            return res.status(403).render('error', {
                title: 'Access Denied',
                error: { message: 'You are not a member of this guild' }
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

        // Get registered users with roles
        const users = await User.find({ guildId })
            .populate('roles')
            .sort({ registeredAt: -1 })
            .limit(50);

        // Get all roles for this guild
        const roles = await Role.findByGuildId(guildId);

        res.render('guild', {
            title: `Manage ${userGuild.name}`,
            guild: {
                ...userGuild,
                dbInfo: guild,
                users,
                roles
            }
        });
    } catch (error) {
        res.status(500).render('error', {
            title: 'Error',
            error: { message: 'Failed to load guild information' }
        });
    }
});

// Onboarding data page
router.get('/guild/:guildId/onboarding', isAllowedUser, hasGuildAccess, async (req, res) => {
    try {
        const guildId = req.params.guildId;

        // Get user's guild info from Discord
        const userGuild = req.user.guilds?.find(g => g.id === guildId);
        if (!userGuild) {
            return res.status(403).render('error', {
                title: 'Access Denied',
                error: { message: 'You are not a member of this guild' }
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

        // Get users with onboarding data
        const users = await User.find({ 
            guildId,
            'onboarding.name': { $ne: null }
        }).sort({ 'onboarding.dateRegistered': -1 });

        res.render('guild-onboarding', {
            title: `Onboarding - ${userGuild.name}`,
            guild: {
                ...userGuild,
                dbInfo: guild
            },
            users
        });
    } catch (error) {
        console.error('Onboarding page error:', error);
        res.status(500).render('error', {
            title: 'Error',
            error: { message: 'Failed to load onboarding data' }
        });
    }
});

export default router;
