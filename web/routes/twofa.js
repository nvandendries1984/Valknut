import express from 'express';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { isAuthenticated, isTwoFactorVerified } from '../middleware/auth.js';
import { AllowedUser } from '../../src/models/AllowedUser.js';
import { logger } from '../../src/utils/logger.js';

const router = express.Router();

// 2FA Setup - Generate QR Code
router.get('/setup', isAuthenticated, async (req, res) => {
    try {
        let user = await AllowedUser.findOne({ userId: req.user.id });

        // Create AllowedUser entry for owner if it doesn't exist
        if (!user && req.user.id === process.env.OWNER_ID) {
            user = new AllowedUser({
                userId: req.user.id,
                username: req.user.username,
                discriminator: req.user.discriminator || '0',
                addedBy: 'SYSTEM',
                reason: 'Bot Owner'
            });
            await user.save();
        }

        if (!user) {
            return res.status(403).render('error', {
                title: 'Access Denied',
                error: { message: 'You are not authorized to use this application' }
            });
        }

        // Don't allow setup if already enabled (must disable first)
        if (user.twoFactorEnabled) {
            return res.redirect('/auth/2fa/status');
        }

        // Generate new secret
        const secret = speakeasy.generateSecret({
            name: `Valknut (${req.user.username})`,
            length: 32
        });

        // Generate QR code
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

        res.render('2fa-setup', {
            title: '2FA Setup',
            qrCode: qrCodeUrl,
            secret: secret.base32,
            user: req.user
        });
    } catch (error) {
        logger.error(`2FA setup error: ${error.message}`);
        res.status(500).render('error', {
            title: 'Error',
            error: { message: 'Failed to setup 2FA' }
        });
    }
});

// 2FA Enable - Verify and activate
router.post('/enable', isAuthenticated, async (req, res) => {
    try {
        const { secret, token } = req.body;

        if (!secret || !token) {
            return res.status(400).json({ success: false, message: 'Secret and token are required' });
        }

        // Verify the token
        const verified = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token,
            window: 2
        });

        if (!verified) {
            return res.status(400).json({ success: false, message: 'Invalid verification code' });
        }

        // Generate backup codes
        const backupCodes = [];
        for (let i = 0; i < 10; i++) {
            backupCodes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
        }

        // Save to database
        const user = await AllowedUser.findOne({ userId: req.user.id });
        if (!user) {
            return res.status(403).json({ success: false, message: 'User not found' });
        }

        user.twoFactorSecret = secret;
        user.twoFactorEnabled = true;
        user.backupCodes = backupCodes;
        await user.save();

        logger.info(`2FA enabled for user: ${req.user.username} (${req.user.id})`);

        res.json({
            success: true,
            message: '2FA enabled successfully',
            backupCodes: backupCodes
        });
    } catch (error) {
        logger.error(`2FA enable error: ${error.message}`);
        res.status(500).json({ success: false, message: 'Failed to enable 2FA' });
    }
});

// 2FA Verify - Check token after login
router.get('/verify', isAuthenticated, async (req, res) => {
    try {
        // If already verified in session, redirect to dashboard
        if (req.session.twoFactorVerified === true) {
            return res.redirect('/dashboard');
        }

        const user = await AllowedUser.findOne({ userId: req.user.id });

        // If user doesn't have 2FA enabled, mark as verified and continue
        if (!user || !user.twoFactorEnabled) {
            req.session.twoFactorVerified = true;
            return res.redirect('/dashboard');
        }

        res.render('2fa-verify', {
            title: '2FA Verification',
            user: req.user
        });
    } catch (error) {
        logger.error(`2FA verify page error: ${error.message}`);
        res.status(500).render('error', {
            title: 'Error',
            error: { message: 'Failed to load 2FA verification' }
        });
    }
});

// 2FA Verify - Submit token
router.post('/verify', isAuthenticated, async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ success: false, message: 'Token is required' });
        }

        const user = await AllowedUser.findOne({ userId: req.user.id });

        if (!user || !user.twoFactorEnabled) {
            req.session.twoFactorVerified = true;
            return res.json({ success: true, message: '2FA not required' });
        }

        // Check if it's a backup code
        if (user.backupCodes.includes(token.toUpperCase().replace(/\s/g, ''))) {
            // Remove used backup code
            user.backupCodes = user.backupCodes.filter(code => code !== token.toUpperCase().replace(/\s/g, ''));
            await user.save();

            req.session.twoFactorVerified = true;

            // Set remember device cookie for 7 days if requested
            const rememberDevice = req.body.rememberDevice;
            if (rememberDevice) {
                const rememberToken = crypto.randomBytes(32).toString('hex');
                res.cookie('remember_2fa', rememberToken, {
                    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                    httpOnly: true,
                    secure: false, // Set to true in production with HTTPS
                    sameSite: 'lax'
                });

                // Store in database
                user.rememberToken = rememberToken;
                user.rememberTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                await user.save();
            }

            logger.info(`2FA verified with backup code for user: ${req.user.username}`);

            return res.json({
                success: true,
                message: '2FA verified with backup code',
                remainingBackupCodes: user.backupCodes.length
            });
        }

        // Verify TOTP token
        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: token,
            window: 2
        });

        if (!verified) {
            logger.warn(`Failed 2FA attempt for user: ${req.user.username}`);
            return res.status(400).json({ success: false, message: 'Invalid verification code' });
        }

        req.session.twoFactorVerified = true;

        // Set remember device cookie for 7 days if requested
        const rememberDevice = req.body.rememberDevice;
        if (rememberDevice) {
            const rememberToken = crypto.randomBytes(32).toString('hex');
            res.cookie('remember_2fa', rememberToken, {
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                httpOnly: true,
                secure: false, // Set to true in production with HTTPS
                sameSite: 'lax'
            });

            // Store in database
            user.rememberToken = rememberToken;
            user.rememberTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await user.save();

            logger.info(`2FA verified successfully with remember device for user: ${req.user.username}`);
        } else {
            logger.info(`2FA verified successfully for user: ${req.user.username}`);
        }

        res.json({ success: true, message: '2FA verified successfully' });
    } catch (error) {
        logger.error(`2FA verify error: ${error.message}`);
        res.status(500).json({ success: false, message: 'Failed to verify 2FA' });
    }
});

// 2FA Status
router.get('/status', isAuthenticated, async (req, res) => {
    try {
        let user = await AllowedUser.findOne({ userId: req.user.id });

        // Create AllowedUser entry for owner if it doesn't exist
        if (!user && req.user.id === process.env.OWNER_ID) {
            user = new AllowedUser({
                userId: req.user.id,
                username: req.user.username,
                discriminator: req.user.discriminator || '0',
                addedBy: 'SYSTEM',
                reason: 'Bot Owner'
            });
            await user.save();
        }

        if (!user) {
            return res.status(403).render('error', {
                title: 'Access Denied',
                error: { message: 'User not found' }
            });
        }

        res.render('2fa-status', {
            title: '2FA Status',
            twoFactorEnabled: user.twoFactorEnabled,
            backupCodesCount: user.backupCodes?.length || 0,
            user: req.user,
            isOwner: req.user.id === process.env.OWNER_ID
        });
    } catch (error) {
        logger.error(`2FA status error: ${error.message}`);
        res.status(500).render('error', {
            title: 'Error',
            error: { message: 'Failed to load 2FA status' }
        });
    }
});

// 2FA Disable
router.post('/disable', isAuthenticated, isTwoFactorVerified, async (req, res) => {
    try {
        const { token } = req.body;
        const isOwner = req.user.id === process.env.OWNER_ID;

        // Owner can disable without token
        if (!isOwner && !token) {
            return res.status(400).json({ success: false, message: 'Verification code required' });
        }

        const user = await AllowedUser.findOne({ userId: req.user.id });

        if (!user || !user.twoFactorEnabled) {
            return res.status(400).json({ success: false, message: '2FA is not enabled' });
        }

        // Verify token before disabling (skip for owner)
        if (!isOwner) {
            const verified = speakeasy.totp.verify({
                secret: user.twoFactorSecret,
                encoding: 'base32',
                token: token,
                window: 2
            });

            if (!verified) {
                return res.status(400).json({ success: false, message: 'Invalid verification code' });
            }
        }

        // Disable 2FA
        user.twoFactorSecret = null;
        user.twoFactorEnabled = false;
        user.backupCodes = [];
        user.rememberToken = null;
        user.rememberTokenExpiry = null;
        await user.save();

        // Clear remember cookie
        res.clearCookie('remember_2fa');

        logger.info(`2FA disabled for user: ${req.user.username} (${req.user.id})${isOwner ? ' [OWNER]' : ''}`);

        res.json({ success: true, message: '2FA disabled successfully' });
    } catch (error) {
        logger.error(`2FA disable error: ${error.message}`);
        res.status(500).json({ success: false, message: 'Failed to disable 2FA' });
    }
});

// Regenerate backup codes
router.post('/regenerate-backup-codes', isAuthenticated, isTwoFactorVerified, async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ success: false, message: 'Verification code required' });
        }

        const user = await AllowedUser.findOne({ userId: req.user.id });

        if (!user || !user.twoFactorEnabled) {
            return res.status(400).json({ success: false, message: '2FA is not enabled' });
        }

        // Verify token before regenerating
        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: token,
            window: 2
        });

        if (!verified) {
            return res.status(400).json({ success: false, message: 'Invalid verification code' });
        }

        // Generate new backup codes
        const backupCodes = [];
        for (let i = 0; i < 10; i++) {
            backupCodes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
        }

        user.backupCodes = backupCodes;
        await user.save();

        logger.info(`Backup codes regenerated for user: ${req.user.username}`);

        res.json({
            success: true,
            message: 'Backup codes regenerated successfully',
            backupCodes: backupCodes
        });
    } catch (error) {
        logger.error(`Backup codes regeneration error: ${error.message}`);
        res.status(500).json({ success: false, message: 'Failed to regenerate backup codes' });
    }
});

export default router;
