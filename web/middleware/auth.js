import { AllowedUser } from '../../src/models/AllowedUser.js';

/**
 * Fetch fresh guild data from Discord API
 * Falls back to cached data if API call fails
 */
async function fetchUserGuilds(accessToken, cachedGuilds = []) {
    try {
        const response = await fetch('https://discord.com/api/v10/users/@me/guilds', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error('Failed to fetch fresh guilds from Discord API:', error.message);
    }

    // Fallback to cached guilds
    return cachedGuilds;
}

export function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/auth/login');
}

export function isTwoFactorVerified(req, res, next) {
    if (!req.isAuthenticated()) {
        return res.redirect('/auth/login');
    }

    // Owner bypass - always verified
    if (req.user.id === process.env.OWNER_ID) {
        return next();
    }

    // Check if 2FA is verified in session
    if (req.session.twoFactorVerified === true) {
        return next();
    }

    // Redirect to 2FA verification
    res.redirect('/auth/2fa/verify');
}

export async function isAllowedUser(req, res, next) {
    if (!req.isAuthenticated()) {
        return res.redirect('/auth/login');
    }

    // Owner always has access (bypass 2FA check)
    if (req.user.id === process.env.OWNER_ID) {
        return next();
    }

    // Check 2FA verification
    if (!req.session.twoFactorVerified) {
        return res.redirect('/auth/2fa/verify');
    }

    // Check if user is in allowed list
    const isAllowed = await AllowedUser.isAllowed(req.user.id);
    if (isAllowed) {
        return next();
    }

    res.status(403).render('error', {
        title: 'Access Denied',
        error: { message: 'You do not have permission to access this application. Contact the bot owner for access.' },
        showUserNav: false
    });
}

export function isOwner(req, res, next) {
    if (!req.isAuthenticated()) {
        return res.redirect('/auth/login');
    }

    // Owner check (bypass 2FA)
    if (req.user.id === process.env.OWNER_ID) {
        return next();
    }

    // Check 2FA verification for non-owners
    if (!req.session.twoFactorVerified) {
        return res.redirect('/auth/2fa/verify');
    }

    res.status(403).render('error', {
        title: 'Access Denied',
        error: { message: 'This page is only accessible to the bot owner' },
        showUserNav: false
    });
}

export async function hasGuildAccess(req, res, next) {
    const guildId = req.params.guildId;

    // Owner always has access to all guilds
    if (req.user.id === process.env.OWNER_ID) {
        return next();
    }

    // Get user's guilds with fresh data (or use cached if already fetched this request)
    if (!req.freshGuilds) {
        req.freshGuilds = await fetchUserGuilds(req.user.accessToken, req.user.guilds);
    }

    const userGuild = req.freshGuilds.find(g => g.id === guildId);
    if (!userGuild) {
        return res.status(403).json({ error: 'You are not a member of this guild' });
    }

    // Check if user has admin permissions
    if ((userGuild.permissions & 0x8) === 0x8) {
        return next();
    }

    // Check Discord roles (DEV or Mod)
    try {
        const botClient = req.app.get('client');
        if (botClient) {
            const guild = botClient.guilds.cache.get(guildId);
            if (guild) {
                const member = await guild.members.fetch(req.user.id);

                // Check for DEV role (development/testing)
                const hasDevRole = member.roles.cache.some(role => role.name === 'DEV');
                if (hasDevRole) {
                    return next();
                }

                // Check for Mod role (for AllowedUser moderators)
                const isAllowedModerator = await AllowedUser.isAllowed(req.user.id);
                if (isAllowedModerator) {
                    const hasModRole = member.roles.cache.some(role => role.name === 'Mod');
                    if (hasModRole) {
                        return next();
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error checking Discord roles:', error);
    }

    res.status(403).json({ error: 'You need Administrator permissions, DEV role, or Mod role to access this guild' });
}
