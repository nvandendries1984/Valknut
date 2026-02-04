import express from 'express';
import passport from 'passport';
import { logger } from '../../src/utils/logger.js';
import { AllowedUser } from '../../src/models/AllowedUser.js';
import { requireCookieConsent } from '../middleware/cookieConsent.js';

const router = express.Router();

// Login route - require cookie consent first
router.get('/login', requireCookieConsent, (req, res, next) => {
    logger.info('Login attempt initiated');
    passport.authenticate('discord')(req, res, next);
});

// Callback route
router.get('/callback',
    (req, res, next) => {
        logger.info('Callback received from Discord');
        logger.info(`Callback query params: ${JSON.stringify(req.query)}`);
        next();
    },
    (req, res, next) => {
        passport.authenticate('discord', {
            failureRedirect: '/',
            failureMessage: true
        })(req, res, (err) => {
            if (err) {
                logger.error(`Authentication error: ${err.name} - ${err.message}`);
                logger.error(`Error details: ${JSON.stringify(err)}`);
                logger.error(`Error stack: ${err.stack}`);
                if (err.oauthError) {
                    logger.error(`OAuth error data: ${err.oauthError.data}`);
                }
                return res.redirect('/?error=auth_failed');
            }
            next();
        });
    },
    async (req, res) => {
        logger.info(`User logged in successfully: ${req.user.username}`);

        // Check if user has 2FA enabled
        try {
            const user = await AllowedUser.findOne({ userId: req.user.id });

            if (user && user.twoFactorEnabled) {
                // Check for remember device cookie
                const rememberToken = req.cookies.remember_2fa;
                if (rememberToken && user.rememberToken === rememberToken) {
                    // Check if token is still valid
                    if (user.rememberTokenExpiry && user.rememberTokenExpiry > new Date()) {
                        // Valid remember token, skip 2FA
                        req.session.twoFactorVerified = true;
                        logger.info(`2FA skipped (remembered device) for user: ${req.user.username}`);
                        return res.redirect('/dashboard');
                    } else {
                        // Token expired, clear it
                        res.clearCookie('remember_2fa');
                        user.rememberToken = null;
                        user.rememberTokenExpiry = null;
                        await user.save();
                    }
                }

                // User has 2FA enabled, redirect to verification
                req.session.twoFactorVerified = false;
                logger.info(`2FA required for user: ${req.user.username}`);
                return res.redirect('/auth/2fa/verify');
            } else {
                // No 2FA, mark as verified and continue to dashboard
                req.session.twoFactorVerified = true;
                return res.redirect('/dashboard');
            }
        } catch (error) {
            logger.error(`Error checking 2FA status: ${error.message}`);
            // On error, continue to dashboard (fail open for now)
            req.session.twoFactorVerified = true;
            return res.redirect('/dashboard');
        }
    }
);

// Logout route
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.redirect('/dashboard');
        }
        // Clear 2FA session flag
        req.session.twoFactorVerified = false;
        res.redirect('/');
    });
});

export default router;
