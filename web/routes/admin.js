import express from 'express';
import { isOwner } from '../middleware/auth.js';
import { AllowedUser } from '../../src/models/AllowedUser.js';
import { promisify } from 'util';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { config } from '../../src/config/config.js';

const router = express.Router();
const execAsync = promisify(exec);

// Admin page for managing allowed users
router.get('/users', isOwner, async (req, res) => {
    try {
        const allowedUsers = await AllowedUser.find().sort({ addedAt: -1 });
        res.render('admin-users', {
            user: req.user,
            allowedUsers,
            title: 'Manage Allowed Users'
        });
    } catch (error) {
        console.error('Error loading admin users page:', error);
        res.status(500).send('Error loading admin page');
    }
});

// Search Discord user by username
router.post('/users/search', isOwner, async (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }

        // Search through all guilds the bot is in
        const guilds = req.app.get('client').guilds.cache;
        const foundUsers = new Map(); // Use Map to avoid duplicates by userId

        for (const [guildId, guild] of guilds) {
            try {
                // Search in cached members first
                const cachedMembers = guild.members.cache.filter(member =>
                    member.user.username.toLowerCase().includes(username.toLowerCase())
                );

                cachedMembers.forEach(member => {
                    if (!foundUsers.has(member.user.id)) {
                        foundUsers.set(member.user.id, {
                            id: member.user.id,
                            username: member.user.username,
                            discriminator: member.user.discriminator,
                            displayName: member.user.tag,
                            avatar: member.user.displayAvatarURL()
                        });
                    }
                });

                // Also search by fetching if needed (for larger servers)
                if (foundUsers.size < 10) {
                    const searchResults = await guild.members.search({
                        query: username,
                        limit: 10
                    });

                    searchResults.forEach(member => {
                        if (!foundUsers.has(member.user.id)) {
                            foundUsers.set(member.user.id, {
                                id: member.user.id,
                                username: member.user.username,
                                discriminator: member.user.discriminator,
                                displayName: member.user.tag,
                                avatar: member.user.displayAvatarURL()
                            });
                        }
                    });
                }
            } catch (error) {
                console.error(`Error searching guild ${guild.name}:`, error);
            }
        }

        const results = Array.from(foundUsers.values()).slice(0, 10);
        res.json({ users: results });
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ error: 'Error searching users' });
    }
});

// Add user to allowed list
router.post('/users', isOwner, async (req, res) => {
    try {
        const { userId, username, discriminator, reason } = req.body;

        if (!userId || !username) {
            return res.status(400).json({ error: 'User ID and username are required' });
        }

        const result = await AllowedUser.addUser(
            userId,
            username,
            discriminator || '0',
            req.user.id,
            reason
        );

        res.json({ success: true, user: result });
    } catch (error) {
        console.error('Error adding allowed user:', error);
        res.status(400).json({ error: error.message });
    }
});

// Remove user from allowed list
router.delete('/users/:userId', isOwner, async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await AllowedUser.removeUser(userId);

        if (result) {
            res.json({ success: true, message: 'User removed from allowed list' });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error removing allowed user:', error);
        res.status(500).json({ error: 'Error removing user' });
    }
});

// Get all allowed users (API endpoint)
router.get('/users/api', isOwner, async (req, res) => {
    try {
        const allowedUsers = await AllowedUser.find().sort({ addedAt: -1 });
        res.json({ users: allowedUsers });
    } catch (error) {
        console.error('Error fetching allowed users:', error);
        res.status(500).json({ error: 'Error fetching users' });
    }
});

export default router;
