import express from 'express';
import passport from 'passport';
import { logger } from '../../src/utils/logger.js';

const router = express.Router();

// Login route
router.get('/login', (req, res, next) => {
    logger.info('Login attempt initiated');
    passport.authenticate('discord')(req, res, next);
});

// Callback route
router.get('/callback',
    (req, res, next) => {
        logger.info('Callback received from Discord');
        next();
    },
    passport.authenticate('discord', { 
        failureRedirect: '/',
        failureMessage: true 
    }),
    (req, res) => {
        logger.info(`User logged in successfully: ${req.user.username}`);
        res.redirect('/dashboard');
    }
);

// Logout route
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.redirect('/dashboard');
        }
        res.redirect('/');
    });
});

export default router;
