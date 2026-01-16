import { AllowedUser } from '../../src/models/AllowedUser.js';

export function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/auth/login');
}

export async function isAllowedUser(req, res, next) {
    if (!req.isAuthenticated()) {
        return res.redirect('/auth/login');
    }

    // Owner always has access
    if (req.user.id === process.env.OWNER_ID) {
        return next();
    }

    // Check if user is in allowed list
    const isAllowed = await AllowedUser.isAllowed(req.user.id);
    if (isAllowed) {
        return next();
    }

    res.status(403).render('error', {
        title: 'Access Denied',
        error: { message: 'You do not have permission to access this application. Contact the bot owner for access.' }
    });
}

export function isOwner(req, res, next) {
    if (req.isAuthenticated() && req.user.id === process.env.OWNER_ID) {
        return next();
    }
    res.status(403).render('error', {
        title: 'Access Denied',
        error: { message: 'This page is only accessible to the bot owner' }
    });
}

export async function hasGuildAccess(req, res, next) {
    const guildId = req.params.guildId;

    // Get user's guilds
    const userGuild = req.user.guilds?.find(g => g.id === guildId);
    if (!userGuild) {
        return res.status(403).json({ error: 'You are not a member of this guild' });
    }

    // Check if user has admin permissions
    if ((userGuild.permissions & 0x8) === 0x8) {
        return next();
    }

    // Check if user has DEV role in the Discord server
    try {
        const botClient = req.app.get('client');
        if (botClient) {
            const guild = botClient.guilds.cache.get(guildId);
            if (guild) {
                const member = await guild.members.fetch(req.user.id);
                const hasDevRole = member.roles.cache.some(role => role.name === 'DEV');
                if (hasDevRole) {
                    return next();
                }
            }
        }
    } catch (error) {
        console.error('Error checking DEV role:', error);
    }

    res.status(403).json({ error: 'You need Administrator permissions or DEV role to access this guild' });
}
